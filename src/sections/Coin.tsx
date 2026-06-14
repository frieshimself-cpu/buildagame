import { Rocket } from "lucide-react";
import { CoinBadge } from "../components/CoinBadge";
import { Reveal } from "../components/Reveal";
import { GAME } from "../coin";
import { Section } from "./Section";

export function Coin({ onOpenStudio }: { onOpenStudio: () => void }) {
  return (
    <Section
      id="token"
      eyebrow={`The ${GAME.ticker} token`}
      title="Every game can become a coin."
      intro={`Aethera runs on ${GAME.ticker}, live on Pump.fun. And it isn't just ours — any game you build here can be minted as its own token in a single click, straight from the studio, with the game's art and a playable link baked into the coin.`}
    >
      <Reveal>
        <div className="flex flex-col items-start gap-8 rounded-3xl border border-line bg-[#fafafa] p-8 sm:p-10 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-lg">
            <CoinBadge />
            <p className="mt-5 text-sm leading-relaxed text-muted">
              Launching is non-custodial: you sign in your own Solana wallet, and the transaction goes
              straight to Pump.fun. Aethera never touches your keys or your funds.
            </p>
          </div>
          <button
            onClick={onOpenStudio}
            className="flex shrink-0 items-center gap-2 rounded-full bg-black px-7 py-4 text-sm font-medium text-white transition-transform duration-200 hover:scale-[1.03]"
          >
            <Rocket size={17} /> Build a game to launch
          </button>
        </div>
      </Reveal>
    </Section>
  );
}
