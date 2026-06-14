import { Pencil, Play, Plus, Share2, Trash2 } from "lucide-react";
import { Reveal } from "../components/Reveal";
import { LevelThumb } from "../components/LevelThumb";
import { Tile, type Level } from "../engine/types";
import type { SavedGame } from "../storage";
import { Section } from "./Section";

function coinCount(level: Level): number {
  let n = 0;
  for (const t of level.tiles) if (t === Tile.Coin) n++;
  return n;
}

interface Props {
  examples: Level[];
  saved: SavedGame[];
  onPlay: (level: Level) => void;
  onEdit: (level: Level, id?: string | null) => void;
  onShare: (level: Level) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
}

export function Showcase({ examples, saved, onPlay, onEdit, onShare, onCreate, onDelete }: Props) {
  return (
    <Section
      id="showcase"
      eyebrow="Showcase"
      title="Play one. Then make your own."
      intro="These demo levels were built with the exact same studio you're about to open. Play them, or crack one open and remix it."
    >
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {examples.map((lvl, i) => (
          <Reveal key={lvl.name} delay={(i % 3) * 0.08}>
            <GameCard
              level={lvl}
              badge={["Beginner", "Intermediate", "Tricky"][i] ?? "Demo"}
              onPlay={() => onPlay(lvl)}
              onEdit={() => onEdit(lvl)}
              onShare={() => onShare(lvl)}
            />
          </Reveal>
        ))}

        <Reveal delay={0.08}>
          <button
            onClick={onCreate}
            className="group flex h-full min-h-[15rem] w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-black/20 bg-white p-7 text-center transition hover:border-black/40 hover:bg-black/[0.02]"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black text-white transition-transform group-hover:scale-110">
              <Plus size={22} />
            </span>
            <span className="font-display text-2xl text-black">Start a new game</span>
            <span className="text-sm text-muted">Open the studio with a blank canvas</span>
          </button>
        </Reveal>
      </div>

      {saved.length > 0 && (
        <div className="mt-16">
          <Reveal>
            <h3 className="font-display text-3xl text-black">Your games</h3>
            <p className="mt-2 text-sm text-muted">Saved in this browser. Export them to keep a copy you own.</p>
          </Reveal>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {saved.map((g, i) => (
              <Reveal key={g.id} delay={(i % 3) * 0.06}>
                <GameCard
                  level={g.level}
                  badge="Yours"
                  onPlay={() => onPlay(g.level)}
                  onEdit={() => onEdit(g.level, g.id)}
                  onShare={() => onShare(g.level)}
                  onDelete={() => onDelete(g.id)}
                />
              </Reveal>
            ))}
          </div>
        </div>
      )}
    </Section>
  );
}

function GameCard({
  level,
  badge,
  onPlay,
  onEdit,
  onShare,
  onDelete,
}: {
  level: Level;
  badge: string;
  onPlay: () => void;
  onEdit: () => void;
  onShare: () => void;
  onDelete?: () => void;
}) {
  return (
    <div className="group h-full overflow-hidden rounded-2xl border border-line bg-white transition-shadow duration-300 hover:shadow-[0_18px_50px_-20px_rgba(0,0,0,0.3)]">
      <button onClick={onPlay} className="relative block w-full" aria-label={`Play ${level.name}`}>
        <LevelThumb level={level} className="h-44 w-full" />
        <span className="absolute left-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur">
          {badge}
        </span>
        <span className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/25 group-hover:opacity-100">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-black shadow-lg">
            <Play size={22} className="ml-0.5" />
          </span>
        </span>
      </button>

      <div className="flex items-center justify-between gap-2 p-4">
        <div className="min-w-0">
          <h3 className="truncate font-display text-xl text-black">{level.name}</h3>
          <p className="text-xs text-muted">
            {coinCount(level)} coins · {level.width}×{level.height}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <CardBtn label="Remix in studio" onClick={onEdit}>
            <Pencil size={15} />
          </CardBtn>
          <CardBtn label="Copy share link" onClick={onShare}>
            <Share2 size={15} />
          </CardBtn>
          {onDelete && (
            <CardBtn label="Delete" onClick={onDelete}>
              <Trash2 size={15} />
            </CardBtn>
          )}
        </div>
      </div>
    </div>
  );
}

function CardBtn({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      title={label}
      aria-label={label}
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-black/60 transition hover:bg-black/[0.04] hover:text-black"
    >
      {children}
    </button>
  );
}
