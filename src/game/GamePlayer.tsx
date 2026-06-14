import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Pencil, Rocket, RotateCcw, Share2, Trophy } from "lucide-react";
import { DT, MAX_FRAME } from "../engine/constants";
import { buildGameState, respawn, step } from "../engine/physics";
import type { GameState, Level } from "../engine/types";
import { drawGame, type Viewport } from "./render";
import { useKeyboard } from "./input";
import { useRaf } from "./useRaf";

function fmtTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  const tenths = Math.floor((s * 10) % 10);
  return `${m}:${sec.toString().padStart(2, "0")}.${tenths}`;
}

interface Props {
  level: Level;
  onExit: () => void;
  onEdit?: () => void;
  onShare?: () => void;
  onLaunch?: () => void;
}

export function GamePlayer({ level, onExit, onEdit, onShare, onLaunch }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>(buildGameState(level));
  const viewRef = useRef<Viewport>({ width: 1, height: 1, dpr: 1 });
  const accRef = useRef(0);
  const lastRef = useRef<number | null>(null);
  const wonRef = useRef(false);

  const coinRef = useRef<HTMLSpanElement>(null);
  const timeRef = useRef<HTMLSpanElement>(null);
  const deathRef = useRef<HTMLSpanElement>(null);

  const [result, setResult] = useState<null | { time: number; coins: number; total: number; deaths: number }>(
    null,
  );
  const [showHint, setShowHint] = useState(true);

  const input = useKeyboard(true);

  const restart = useCallback(() => {
    stateRef.current = buildGameState(level);
    accRef.current = 0;
    lastRef.current = null;
    wonRef.current = false;
    setResult(null);
    setShowHint(true);
  }, [level]);

  // Rebuild whenever the level changes.
  useEffect(() => {
    restart();
  }, [restart]);

  // Auto-hide the controls hint.
  useEffect(() => {
    if (!showHint) return;
    const id = window.setTimeout(() => setShowHint(false), 4200);
    return () => window.clearTimeout(id);
  }, [showHint]);

  // Resize the canvas to its container at device resolution.
  useEffect(() => {
    const el = containerRef.current;
    const canvas = canvasRef.current;
    if (!el || !canvas) return;
    const ctx = canvas.getContext("2d");
    const apply = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = el.clientWidth;
      const h = el.clientHeight;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      viewRef.current = { width: w, height: h, dpr };
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Restart / exit shortcuts.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "KeyR") restart();
      else if (e.code === "Escape") onExit();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [restart, onExit]);

  // The main loop: fixed-step simulation + render.
  useRaf((now) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    const last = lastRef.current ?? now;
    lastRef.current = now;
    let frame = (now - last) / 1000;
    if (frame > MAX_FRAME) frame = MAX_FRAME;
    accRef.current += frame;

    const st = stateRef.current;
    let guard = 0;
    while (accRef.current >= DT && guard < 600) {
      step(st, input.current, DT);
      accRef.current -= DT;
      guard++;
      if (st.phase === "dead" && st.endTimer > 0.65) respawn(st);
    }

    if (st.phase === "won" && !wonRef.current) {
      wonRef.current = true;
      setResult({ time: st.time, coins: st.score, total: st.totalCoins, deaths: st.deaths });
    }

    if (coinRef.current) coinRef.current.textContent = `${st.score}/${st.totalCoins}`;
    if (timeRef.current) timeRef.current.textContent = fmtTime(st.time);
    if (deathRef.current) deathRef.current.textContent = String(st.deaths);

    drawGame(ctx, st, viewRef.current, now / 1000);
  });

  const press = (key: "left" | "right" | "jump", down: boolean) => (e: React.PointerEvent) => {
    e.preventDefault();
    input.current[key] = down;
  };

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-ink-950 font-inter text-white select-none">
      <div ref={containerRef} className="absolute inset-0">
        <canvas ref={canvasRef} className="h-full w-full" />
      </div>

      {/* Top HUD */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-3 p-4 sm:p-5">
        <button
          onClick={onExit}
          className="pointer-events-auto flex items-center gap-2 rounded-full border border-white/15 bg-black/40 px-4 py-2 text-sm backdrop-blur transition hover:bg-black/60"
        >
          <ArrowLeft size={16} /> Exit
        </button>

        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-4 py-2 text-sm backdrop-blur">
          <span className="flex items-center gap-1.5">
            <span className="text-[#ffd05a]">●</span>
            <span ref={coinRef} className="tabular-nums">0/0</span>
          </span>
          <span className="text-white/25">·</span>
          <span ref={timeRef} className="tabular-nums text-white/80">0:00.0</span>
          <span className="text-white/25">·</span>
          <span className="text-white/50">deaths&nbsp;</span>
          <span ref={deathRef} className="tabular-nums text-white/80">0</span>
        </div>

        <button
          onClick={restart}
          className="pointer-events-auto flex items-center gap-2 rounded-full border border-white/15 bg-black/40 px-4 py-2 text-sm backdrop-blur transition hover:bg-black/60"
        >
          <RotateCcw size={16} /> <span className="hidden sm:inline">Restart</span>
        </button>
      </div>

      {/* Level name badge */}
      <div className="pointer-events-none absolute left-1/2 top-16 z-20 -translate-x-1/2 sm:top-20">
        <span className="font-display text-lg text-white/55">{level.name}</span>
      </div>

      {/* Controls hint */}
      {showHint && !result && (
        <div className="pointer-events-none absolute bottom-6 left-1/2 z-20 -translate-x-1/2 rounded-full border border-white/10 bg-black/45 px-5 py-2.5 text-xs text-white/70 backdrop-blur transition md:text-sm">
          <span className="hidden md:inline">← → move&nbsp;&nbsp;·&nbsp;&nbsp;↑ / Space jump&nbsp;&nbsp;·&nbsp;&nbsp;R restart</span>
          <span className="md:hidden">Tap the pads to move &amp; jump</span>
        </div>
      )}

      {/* Touch controls (small screens) */}
      <div className="absolute inset-x-0 bottom-0 z-20 flex items-end justify-between p-5 md:hidden">
        <div className="flex gap-3">
          <TouchPad label="←" onDown={press("left", true)} onUp={press("left", false)} />
          <TouchPad label="→" onDown={press("right", true)} onUp={press("right", false)} />
        </div>
        <TouchPad label="Jump" wide onDown={press("jump", true)} onUp={press("jump", false)} />
      </div>

      {/* Win panel */}
      {result && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/55 px-6 backdrop-blur-sm">
          <div className="animate-fade-rise w-full max-w-md rounded-3xl border border-white/10 bg-ink-900/90 p-8 text-center shadow-2xl">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#54e0ad]/15 text-[#54e0ad]">
              <Trophy size={26} />
            </div>
            <h2 className="font-display text-4xl">Level complete</h2>
            <p className="mt-1 text-sm text-white/50">{level.name}</p>
            <div className="mt-6 grid grid-cols-3 gap-3 text-sm">
              <Stat label="Time" value={fmtTime(result.time)} />
              <Stat label="Coins" value={`${result.coins}/${result.total}`} />
              <Stat label="Deaths" value={String(result.deaths)} />
            </div>
            <div className="mt-7 flex flex-col gap-2.5">
              <button
                onClick={restart}
                className="w-full rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition hover:scale-[1.02]"
              >
                Play again
              </button>
              {onLaunch && (
                <button
                  onClick={onLaunch}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#54e0ad] to-[#a99bff] px-6 py-3 text-sm font-medium text-ink-950 transition hover:scale-[1.02]"
                >
                  <Rocket size={16} /> Launch as a coin
                </button>
              )}
              <div className="flex gap-2.5">
                {onShare && (
                  <button
                    onClick={onShare}
                    className="flex flex-1 items-center justify-center gap-2 rounded-full border border-white/15 px-4 py-3 text-sm transition hover:bg-white/5"
                  >
                    <Share2 size={15} /> Share
                  </button>
                )}
                {onEdit && (
                  <button
                    onClick={onEdit}
                    className="flex flex-1 items-center justify-center gap-2 rounded-full border border-white/15 px-4 py-3 text-sm transition hover:bg-white/5"
                  >
                    <Pencil size={15} /> Edit
                  </button>
                )}
                <button
                  onClick={onExit}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full border border-white/15 px-4 py-3 text-sm transition hover:bg-white/5"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] py-3">
      <div className="font-display text-2xl tabular-nums">{value}</div>
      <div className="mt-0.5 text-[11px] uppercase tracking-wider text-white/40">{label}</div>
    </div>
  );
}

function TouchPad({
  label,
  wide,
  onDown,
  onUp,
}: {
  label: string;
  wide?: boolean;
  onDown: (e: React.PointerEvent) => void;
  onUp: (e: React.PointerEvent) => void;
}) {
  return (
    <button
      onPointerDown={onDown}
      onPointerUp={onUp}
      onPointerLeave={onUp}
      onPointerCancel={onUp}
      style={{ touchAction: "none" }}
      className={`flex ${wide ? "h-20 w-28" : "h-16 w-16"} items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-xl font-medium text-white/90 backdrop-blur active:bg-white/25`}
    >
      {label}
    </button>
  );
}
