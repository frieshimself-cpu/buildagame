import { useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Copy,
  ExternalLink,
  Loader2,
  Rocket,
  Wallet,
  X,
} from "lucide-react";
import type { Level } from "../engine/types";
import { pumpFunCoinUrl, shortAddress, solscanTokenUrl } from "../coin";
import { LevelThumb } from "./LevelThumb";
import { buildShareUrl } from "../share";
import { connectWallet, getProvider, type Connected } from "../pump/wallet";

type Phase = "form" | "working" | "done" | "error";

const cleanTicker = (s: string) => s.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 10);

export function LaunchModal({ level, onClose }: { level: Level; onClose: () => void }) {
  const shareUrl = useMemo(() => buildShareUrl(level), [level]);

  const [name, setName] = useState(level.name);
  const [ticker, setTicker] = useState(cleanTicker(level.name) || "GAME");
  const [description, setDescription] = useState(
    `A playable platformer built in Aethera. Play it free: ${shareUrl}`,
  );
  const [twitter, setTwitter] = useState("");
  const [telegram, setTelegram] = useState("");
  const [devBuy, setDevBuy] = useState("0");
  const [rpc, setRpc] = useState("");
  const [advanced, setAdvanced] = useState(false);

  const [connected, setConnected] = useState<Connected | null>(null);
  const [phase, setPhase] = useState<Phase>("form");
  const [step, setStep] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ mint: string; signature: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const busy = useRef(false);

  const hasWallet = typeof window !== "undefined" && !!getProvider();

  const connect = async () => {
    try {
      setConnected(await connectWallet());
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const launch = async () => {
    if (busy.current) return;
    busy.current = true;
    setPhase("working");
    setError("");
    try {
      let wallet = connected;
      if (!wallet) {
        setStep("Connecting your wallet…");
        wallet = await connectWallet();
        setConnected(wallet);
      }
      setStep("Rendering your game into the coin image…");
      const { launchGame } = await import("../pump/launch"); // code-split web3
      setStep("Building the launch — confirm in your wallet…");
      const res = await launchGame(
        level,
        {
          name: name.trim(),
          symbol: ticker,
          description: description.trim(),
          twitter: twitter.trim() || undefined,
          telegram: telegram.trim() || undefined,
          website: shareUrl,
          devBuySol: Number(devBuy) || 0,
          rpcUrl: rpc.trim() || undefined,
        },
        wallet.provider,
        wallet.publicKey,
      );
      setResult(res);
      setPhase("done");
    } catch (e) {
      setError((e as Error).message || "Launch failed.");
      setPhase("error");
    } finally {
      busy.current = false;
    }
  };

  const copyMint = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.mint);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/65 p-4 font-inter backdrop-blur-sm">
      <div className="relative max-h-[92dvh] w-full max-w-2xl overflow-y-auto scrollbar-dark rounded-3xl border border-white/10 bg-ink-900 text-white shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/70 transition hover:bg-white/5"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-2 text-[#54e0ad]">
            <Rocket size={18} />
            <span className="text-xs font-medium uppercase tracking-[0.18em]">Launch on Pump.fun</span>
          </div>
          <h2 className="mt-3 font-display text-4xl">Turn your game into a coin</h2>
          <p className="mt-2 text-sm text-white/55">
            Mint <span className="text-white/80">{name || "your game"}</span> as a token on Solana. Your
            game's image and a playable link travel with it.
          </p>

          {phase === "done" && result ? (
            <Success result={result} copied={copied} onCopy={copyMint} onClose={onClose} />
          ) : (
            <>
              <div className="mt-6 grid gap-5 sm:grid-cols-[200px_1fr]">
                {/* Image preview */}
                <div>
                  <LevelThumb level={level} className="aspect-square w-full rounded-2xl border border-white/10" />
                  <p className="mt-2 text-center text-[11px] text-white/40">This becomes the coin image</p>
                </div>

                {/* Form */}
                <div className="space-y-3">
                  <Field label="Name">
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      maxLength={32}
                      className="modal-input"
                      placeholder="My game"
                    />
                  </Field>
                  <Field label="Ticker">
                    <div className="flex items-center gap-2">
                      <span className="text-white/40">$</span>
                      <input
                        value={ticker}
                        onChange={(e) => setTicker(cleanTicker(e.target.value))}
                        maxLength={10}
                        className="modal-input"
                        placeholder="GAME"
                      />
                    </div>
                  </Field>
                  <Field label="Description">
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className="modal-input resize-none"
                    />
                  </Field>

                  <button
                    onClick={() => setAdvanced((a) => !a)}
                    className="flex items-center gap-1 text-xs text-white/50 transition hover:text-white/80"
                  >
                    <ChevronDown size={14} className={advanced ? "rotate-180 transition" : "transition"} />
                    Advanced — initial buy, socials, RPC
                  </button>
                  {advanced && (
                    <div className="space-y-3 rounded-2xl border border-white/8 bg-white/[0.02] p-4">
                      <Field label="Your first buy (SOL)" hint="Optional. Buy some of your own coin at launch.">
                        <input
                          value={devBuy}
                          onChange={(e) => setDevBuy(e.target.value.replace(/[^0-9.]/g, ""))}
                          inputMode="decimal"
                          className="modal-input"
                          placeholder="0"
                        />
                      </Field>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field label="Twitter / X URL">
                          <input value={twitter} onChange={(e) => setTwitter(e.target.value)} className="modal-input" placeholder="https://x.com/…" />
                        </Field>
                        <Field label="Telegram URL">
                          <input value={telegram} onChange={(e) => setTelegram(e.target.value)} className="modal-input" placeholder="https://t.me/…" />
                        </Field>
                      </div>
                      <Field label="Custom RPC" hint="Used only if your wallet can't broadcast directly.">
                        <input value={rpc} onChange={(e) => setRpc(e.target.value)} className="modal-input" placeholder="https://…" />
                      </Field>
                    </div>
                  )}
                </div>
              </div>

              {/* Disclaimer */}
              <div className="mt-5 flex gap-2.5 rounded-2xl border border-amber-400/20 bg-amber-400/[0.06] p-3.5 text-[12px] leading-relaxed text-amber-200/80">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                <span>
                  This creates a <b>real token on Solana mainnet</b> via Pump.fun. It costs a little SOL,
                  is permissionless, and can't be undone. Aethera never holds your keys or funds. Coins
                  carry no guarantee of value — launch responsibly.
                </span>
              </div>

              {error && phase === "error" && (
                <p className="mt-4 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
                  {error}
                </p>
              )}

              {/* Actions */}
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-xs text-white/45">
                  {connected ? (
                    <span className="flex items-center gap-1.5 text-emerald-300/80">
                      <Wallet size={14} /> {shortAddress(connected.publicKey)}
                    </span>
                  ) : hasWallet ? (
                    <button onClick={connect} className="flex items-center gap-1.5 text-white/70 transition hover:text-white">
                      <Wallet size={14} /> Connect wallet
                    </button>
                  ) : (
                    <a href="https://phantom.app" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-white/70 hover:text-white">
                      <Wallet size={14} /> Install Phantom <ExternalLink size={12} />
                    </a>
                  )}
                </div>
                <button
                  onClick={launch}
                  disabled={phase === "working" || !name.trim() || ticker.length < 2}
                  className="flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-medium text-black transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {phase === "working" ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> {step || "Working…"}
                    </>
                  ) : (
                    <>
                      <Rocket size={16} /> Launch ${ticker || "GAME"}
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Success({
  result,
  copied,
  onCopy,
  onClose,
}: {
  result: { mint: string; signature: string };
  copied: boolean;
  onCopy: () => void;
  onClose: () => void;
}) {
  return (
    <div className="mt-6 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#54e0ad]/15 text-[#54e0ad]">
        <Check size={28} />
      </div>
      <h3 className="mt-4 font-display text-3xl">It's live on Pump.fun 🎉</h3>
      <p className="mt-1 text-sm text-white/55">Your game is now a coin. Here's its contract address:</p>

      <button
        onClick={onCopy}
        className="mx-auto mt-4 flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2.5 font-mono text-sm transition hover:bg-white/[0.07]"
      >
        {shortAddress(result.mint, 6, 6)}
        {copied ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} className="text-white/50" />}
      </button>

      <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
        <a
          href={pumpFunCoinUrl(result.mint)}
          target="_blank"
          rel="noreferrer"
          className="flex flex-1 items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-medium text-black transition hover:scale-[1.02]"
        >
          View on Pump.fun <ExternalLink size={15} />
        </a>
        <a
          href={solscanTokenUrl(result.mint)}
          target="_blank"
          rel="noreferrer"
          className="flex flex-1 items-center justify-center gap-2 rounded-full border border-white/15 px-5 py-3 text-sm transition hover:bg-white/5"
        >
          Solscan <ExternalLink size={15} />
        </a>
      </div>
      <button onClick={onClose} className="mt-4 text-sm text-white/50 transition hover:text-white">
        Done
      </button>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs text-white/45">{label}</span>
      <div className="mt-1">{children}</div>
      {hint && <span className="mt-1 block text-[11px] text-white/30">{hint}</span>}
    </label>
  );
}
