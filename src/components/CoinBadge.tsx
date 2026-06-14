import { useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import { GAME, hasGameCA, pumpFunCoinUrl, shortAddress } from "../coin";

/**
 * The $GAME chip. Shows the live contract address with a copy button + Buy link
 * once {@link GAME.contractAddress} is set; until launch it invites people to
 * Pump.fun and notes the CA is coming.
 */
export function CoinBadge({ className = "" }: { className?: string }) {
  const [copied, setCopied] = useState(false);
  const ca = GAME.contractAddress;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(ca);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <div
      className={`inline-flex flex-wrap items-center gap-2 rounded-full border border-black/10 bg-white p-1.5 ${className}`}
    >
      <span className="rounded-full bg-black px-3 py-1.5 text-xs font-semibold tracking-wide text-white">
        {GAME.ticker}
      </span>
      {hasGameCA() ? (
        <>
          <button
            onClick={copy}
            title={ca}
            className="flex items-center gap-1.5 px-2 font-mono text-xs text-black/70 transition hover:text-black"
          >
            {shortAddress(ca, 5, 5)}
            {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
          </button>
          <a
            href={pumpFunCoinUrl(ca)}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 rounded-full bg-black px-3 py-1.5 text-xs text-white transition hover:opacity-90"
          >
            Buy <ExternalLink size={12} />
          </a>
        </>
      ) : (
        <>
          <span className="px-2 text-xs text-muted">Contract address at launch</span>
          <a
            href="https://pump.fun"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 rounded-full bg-black px-3 py-1.5 text-xs text-white transition hover:opacity-90"
          >
            Pump.fun <ExternalLink size={12} />
          </a>
        </>
      )}
    </div>
  );
}
