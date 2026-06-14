import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  Download,
  FilePlus2,
  Minus,
  Play,
  Plus,
  Redo2,
  Rocket,
  Save,
  Share2,
  Trash2,
  Undo2,
  Upload,
} from "lucide-react";
import { MAX_HEIGHT, MAX_WIDTH, MIN_HEIGHT, MIN_WIDTH, levelFromJson, levelToJson } from "../engine/level";
import type { Brush, Level } from "../engine/types";
import { copyShareLink } from "../share";
import type { Draft } from "../storage";
import { EditorCanvas } from "./EditorCanvas";
import { PALETTE, Palette } from "./Palette";
import { useEditor } from "./useEditor";

interface Props {
  initial: Draft;
  onExit: () => void;
  onTest: (level: Level) => void;
  onLaunch: (level: Level) => void;
}

export function Studio({ initial, onExit, onTest, onLaunch }: Props) {
  const ed = useEditor(initial);
  const [scrollX, setScrollX] = useState(0);
  const [maxScroll, setMaxScroll] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const toastTimer = useRef<number>();

  const flash = useCallback((msg: string) => {
    setToast(msg);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2000);
  }, []);

  const onMeta = useCallback((max: number) => {
    setMaxScroll(max);
    setScrollX((s) => Math.max(0, Math.min(max, s)));
  }, []);

  const doSave = useCallback(() => {
    ed.save();
    flash("Saved to your games");
  }, [ed, flash]);

  const doShare = useCallback(async () => {
    await copyShareLink(ed.levelRef.current);
    flash("Share link copied to clipboard");
  }, [ed, flash]);

  const doExport = useCallback(() => {
    const lvl = ed.levelRef.current;
    const blob = new Blob([levelToJson(lvl)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${lvl.name.replace(/[^\w-]+/g, "_") || "level"}.json`;
    a.click();
    URL.revokeObjectURL(url);
    flash("Exported .json");
  }, [ed, flash]);

  const onFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;
      try {
        const lvl = levelFromJson(await file.text());
        ed.loadLevel(lvl, null);
        setScrollX(0);
        flash("Imported level");
      } catch {
        flash("Could not read that file");
      }
    },
    [ed, flash],
  );

  // Keyboard shortcuts (ignored while typing in a field).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === "s") {
        e.preventDefault();
        doSave();
      } else if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) ed.redo();
        else ed.undo();
      } else if (mod && e.key.toLowerCase() === "y") {
        e.preventDefault();
        ed.redo();
      } else if (!mod && e.key === "t") {
        onTest(ed.levelRef.current);
      } else if (!mod && /^[1-8]$/.test(e.key)) {
        ed.setTool(PALETTE[Number(e.key) - 1].brush as Brush);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ed, doSave, onTest]);

  const lvl = ed.level;

  return (
    <div className="flex h-[100dvh] w-full flex-col bg-ink-950 font-inter text-white">
      {/* Header */}
      <header className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-white/10 px-3 py-2.5 sm:px-4">
        <button
          onClick={onExit}
          className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-sm text-white/80 transition hover:bg-white/5"
        >
          <ArrowLeft size={16} /> <span className="hidden sm:inline">Exit</span>
        </button>

        <div className="flex items-center gap-2">
          <input
            value={lvl.name}
            onChange={(e) => ed.setName(e.target.value)}
            spellCheck={false}
            className="w-40 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 font-display text-lg outline-none transition focus:border-white/30 sm:w-56"
          />
          <span
            title={ed.dirty ? "Unsaved changes" : "Saved"}
            className={`h-2 w-2 rounded-full ${ed.dirty ? "bg-amber-400" : "bg-emerald-400/70"}`}
          />
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          <IconBtn label="Undo (Ctrl+Z)" onClick={ed.undo} disabled={!ed.canUndo}>
            <Undo2 size={17} />
          </IconBtn>
          <IconBtn label="Redo (Ctrl+Shift+Z)" onClick={ed.redo} disabled={!ed.canRedo}>
            <Redo2 size={17} />
          </IconBtn>
          <Divider />
          <IconBtn label="New level" onClick={() => { ed.newLevel(); setScrollX(0); }}>
            <FilePlus2 size={17} />
          </IconBtn>
          <IconBtn label="Clear everything" onClick={ed.clearLevel}>
            <Trash2 size={17} />
          </IconBtn>
          <IconBtn label="Import .json" onClick={() => fileRef.current?.click()}>
            <Upload size={17} />
          </IconBtn>
          <IconBtn label="Export .json" onClick={doExport}>
            <Download size={17} />
          </IconBtn>
          <Divider />
          <button
            onClick={doSave}
            className="flex items-center gap-2 rounded-full border border-white/10 px-3.5 py-1.5 text-sm transition hover:bg-white/5"
          >
            {ed.dirty ? <Save size={16} /> : <Check size={16} className="text-emerald-400" />} Save
          </button>
          <button
            onClick={doShare}
            className="flex items-center gap-2 rounded-full border border-white/10 px-3.5 py-1.5 text-sm transition hover:bg-white/5"
          >
            <Share2 size={16} /> <span className="hidden sm:inline">Share</span>
          </button>
          <button
            onClick={() => onTest(ed.levelRef.current)}
            className="flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-sm font-medium text-black transition hover:scale-[1.03]"
          >
            <Play size={16} /> Test
          </button>
          <button
            onClick={() => onLaunch(ed.levelRef.current)}
            title="Launch this game as a token on Pump.fun"
            className="flex items-center gap-2 rounded-full bg-gradient-to-r from-[#54e0ad] to-[#a99bff] px-4 py-1.5 text-sm font-medium text-ink-950 transition hover:scale-[1.03]"
          >
            <Rocket size={16} /> Launch
          </button>
        </div>
      </header>

      {/* Palette + dimensions */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-white/10 px-3 py-2 sm:px-4">
        <Palette tool={ed.tool} onPick={ed.setTool} />
        <div className="ml-auto flex items-center gap-3 text-xs text-white/55">
          <Stepper
            label="W"
            value={lvl.width}
            min={MIN_WIDTH}
            max={MAX_WIDTH}
            step={2}
            onChange={(w) => ed.resize(w, lvl.height)}
          />
          <Stepper
            label="H"
            value={lvl.height}
            min={MIN_HEIGHT}
            max={MAX_HEIGHT}
            step={1}
            onChange={(h) => ed.resize(lvl.width, h)}
          />
        </div>
      </div>

      {/* Canvas */}
      <div className="relative flex-1 overflow-hidden">
        <EditorCanvas
          levelRef={ed.levelRef}
          tool={ed.tool}
          scrollX={scrollX}
          onScrollChange={setScrollX}
          onMeta={onMeta}
          beginStroke={ed.beginStroke}
          paint={ed.paint}
          erase={ed.erase}
          endStroke={ed.endStroke}
        />
        <div className="pointer-events-none absolute left-3 top-3 rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-[11px] text-white/55 backdrop-blur">
          Left-drag to paint · Right-drag to erase · Scroll to pan
        </div>
      </div>

      {/* Scroll bar */}
      {maxScroll > 0.5 && (
        <div className="flex items-center gap-3 border-t border-white/10 px-4 py-2">
          <span className="text-[11px] text-white/40">Pan</span>
          <input
            type="range"
            min={0}
            max={maxScroll}
            step={0.01}
            value={scrollX}
            onChange={(e) => setScrollX(Number(e.target.value))}
            className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-white/10 accent-white"
          />
        </div>
      )}

      <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={onFile} />

      {/* Toast */}
      {toast && (
        <div className="animate-fade-rise pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-white/10 bg-ink-800/95 px-5 py-2.5 text-sm shadow-xl backdrop-blur">
          {toast}
        </div>
      )}
    </div>
  );
}

function IconBtn({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/80 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-30"
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="mx-0.5 h-5 w-px bg-white/10" />;
}

function Stepper({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="text-white/35">{label}</span>
      <button
        onClick={() => onChange(Math.max(min, value - step))}
        disabled={value <= min}
        className="flex h-6 w-6 items-center justify-center rounded-md border border-white/10 transition hover:bg-white/5 disabled:opacity-30"
      >
        <Minus size={13} />
      </button>
      <span className="w-7 text-center tabular-nums text-white/80">{value}</span>
      <button
        onClick={() => onChange(Math.min(max, value + step))}
        disabled={value >= max}
        className="flex h-6 w-6 items-center justify-center rounded-md border border-white/10 transition hover:bg-white/5 disabled:opacity-30"
      >
        <Plus size={13} />
      </button>
    </span>
  );
}
