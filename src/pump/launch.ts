import { Connection, Keypair, VersionedTransaction } from "@solana/web3.js";
import type { Level } from "../engine/types";
import { levelToPngBlob } from "../render/levelImage";
import type { SolanaProvider } from "./wallet";

// PumpPortal builds the on-chain "create" transaction for us and returns it
// unsigned, so we don't hand-roll the Pump.fun program instruction. We then
// sign it locally (mint key) + in the user's wallet (creator) and broadcast.
const PUMPPORTAL = "https://pumpportal.fun/api/trade-local";
// The metadata image upload must reach pump.fun's IPFS endpoint. Browsers are
// blocked by CORS, so we go through our own serverless proxy first (works on
// the Vercel deployment), then fall back to calling pump.fun directly.
const IPFS_PROXY = "/api/pump-ipfs";
const IPFS_DIRECT = "https://pump.fun/api/ipfs";
const DEFAULT_RPC = "https://api.mainnet-beta.solana.com";

export interface LaunchOptions {
  name: string;
  symbol: string;
  description: string;
  twitter?: string;
  telegram?: string;
  website?: string;
  /** Optional creator's first buy, in SOL. 0 = create only. */
  devBuySol: number;
  slippage?: number;
  priorityFee?: number;
  rpcUrl?: string;
}

export interface LaunchResult {
  mint: string;
  signature: string;
}

/** Pump.fun tickers are uppercase alphanumerics; strip "$" and punctuation. */
export function sanitizeSymbol(input: string): string {
  return input.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 10);
}

/** The exact JSON body PumpPortal expects for a "create" action. Pure + tested. */
export function buildCreateBody(args: {
  walletPublicKey: string;
  mintPublicKey: string;
  name: string;
  symbol: string;
  uri: string;
  devBuySol: number;
  slippage?: number;
  priorityFee?: number;
}) {
  return {
    publicKey: args.walletPublicKey,
    action: "create" as const,
    tokenMetadata: { name: args.name, symbol: args.symbol, uri: args.uri },
    mint: args.mintPublicKey,
    denominatedInSol: "true" as const,
    amount: Math.max(0, args.devBuySol || 0),
    slippage: args.slippage ?? 10,
    priorityFee: args.priorityFee ?? 0.0005,
    pool: "pump" as const,
  };
}

function buildMetadataForm(image: Blob, opts: LaunchOptions, symbol: string): FormData {
  const form = new FormData();
  form.append("file", image, "game.png");
  form.append("name", opts.name);
  form.append("symbol", symbol);
  form.append("description", opts.description);
  if (opts.twitter) form.append("twitter", opts.twitter);
  if (opts.telegram) form.append("telegram", opts.telegram);
  if (opts.website) form.append("website", opts.website);
  form.append("showName", "true");
  return form;
}

async function postForm(url: string, form: FormData): Promise<string | null> {
  try {
    const r = await fetch(url, { method: "POST", body: form });
    if (!r.ok) return null;
    const j = (await r.json()) as { metadataUri?: string; uri?: string; metadata?: { uri?: string } };
    return j.metadataUri ?? j.uri ?? j.metadata?.uri ?? null;
  } catch {
    return null;
  }
}

/** Render the game image, upload metadata to IPFS, return the metadata URI. */
export async function uploadMetadata(level: Level, opts: LaunchOptions, symbol: string): Promise<string> {
  const image = await levelToPngBlob(level);
  const form = buildMetadataForm(image, opts, symbol);
  // The proxy form and the direct form can't be reused (a FormData stream is
  // consumed once), so rebuild for the fallback.
  const viaProxy = await postForm(IPFS_PROXY, form);
  if (viaProxy) return viaProxy;
  const viaDirect = await postForm(IPFS_DIRECT, buildMetadataForm(image, opts, symbol));
  if (viaDirect) return viaDirect;
  throw new Error(
    "Couldn't upload the token image to Pump.fun. The IPFS proxy (/api/pump-ipfs) only runs on the Vercel deployment — try there.",
  );
}

/** Create the token on Pump.fun, signed by the mint key + the user's wallet. */
export async function launchGame(
  level: Level,
  opts: LaunchOptions,
  provider: SolanaProvider,
  walletPublicKey: string,
): Promise<LaunchResult> {
  const symbol = sanitizeSymbol(opts.symbol);
  if (symbol.length < 2) throw new Error("Ticker needs at least 2 letters or numbers.");
  if (!opts.name.trim()) throw new Error("Give your game a name.");

  const uri = await uploadMetadata(level, opts, symbol);
  const mint = Keypair.generate();

  const res = await fetch(PUMPPORTAL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(
      buildCreateBody({
        walletPublicKey,
        mintPublicKey: mint.publicKey.toBase58(),
        name: opts.name,
        symbol,
        uri,
        devBuySol: opts.devBuySol,
        slippage: opts.slippage,
        priorityFee: opts.priorityFee,
      }),
    ),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Pump.fun rejected the launch (${res.status}). ${detail.slice(0, 160)}`);
  }

  const tx = VersionedTransaction.deserialize(new Uint8Array(await res.arrayBuffer()));
  tx.sign([mint]); // the new mint authorises its own creation

  let signature: string;
  if (provider.signAndSendTransaction) {
    // Phantom et al. add the creator signature and broadcast via their own RPC.
    signature = (await provider.signAndSendTransaction(tx)).signature;
  } else if (provider.signTransaction) {
    const signed = await provider.signTransaction(tx);
    const conn = new Connection(opts.rpcUrl || DEFAULT_RPC, "confirmed");
    signature = await conn.sendRawTransaction(signed.serialize());
  } else {
    throw new Error("Your wallet can't sign transactions.");
  }

  return { mint: mint.publicKey.toBase58(), signature };
}
