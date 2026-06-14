/**
 * Minimal injected-wallet access (Phantom, Solflare, Backpack — anything that
 * injects a Solana provider). Deliberately free of @solana/web3.js so it stays
 * in the main bundle; the launcher dynamically imports web3 only when needed.
 *
 * Aethera is fully non-custodial: it never sees a private key. The wallet signs
 * every transaction itself.
 */

// `tx` is a web3.js Transaction/VersionedTransaction — kept `unknown` here.
export interface SolanaProvider {
  isPhantom?: boolean;
  publicKey?: { toString(): string } | null;
  connect(opts?: { onlyIfTrusted?: boolean }): Promise<{ publicKey: { toString(): string } }>;
  disconnect?(): Promise<void>;
  signTransaction?<T>(tx: T): Promise<T>;
  signAndSendTransaction?<T>(tx: T): Promise<{ signature: string }>;
}

export function getProvider(): SolanaProvider | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { phantom?: { solana?: SolanaProvider }; solana?: SolanaProvider };
  const p = w.phantom?.solana ?? w.solana;
  return p && (p.isPhantom || typeof p.connect === "function") ? p : null;
}

export interface Connected {
  provider: SolanaProvider;
  publicKey: string;
}

export async function connectWallet(): Promise<Connected> {
  const provider = getProvider();
  if (!provider) {
    throw new Error("No Solana wallet found. Install Phantom (phantom.app) and try again.");
  }
  const res = await provider.connect();
  const publicKey = (res?.publicKey ?? provider.publicKey)?.toString();
  if (!publicKey) throw new Error("Wallet did not return a public key.");
  return { provider, publicKey };
}
