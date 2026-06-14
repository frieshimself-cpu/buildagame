import { useCallback, useEffect, useRef, useState } from "react";
import { GamePlayer } from "./game/GamePlayer";
import { EXAMPLE_LEVELS, decodeLevel, starterLevel } from "./engine/level";
import type { Level } from "./engine/types";
import { Landing } from "./Landing";
import { LaunchModal } from "./components/LaunchModal";
import { copyShareLink } from "./share";
import { Studio } from "./studio/Studio";
import { type Draft, type SavedGame, deleteGame, loadDraft, loadGames, saveDraft } from "./storage";

type View = "home" | "studio" | "play";

function cloneLevel(l: Level): Level {
  return { name: l.name, width: l.width, height: l.height, spawn: { ...l.spawn }, tiles: l.tiles.slice() };
}

function playCodeFromHash(): Level | null {
  const m = location.hash.match(/^#play=(.+)$/);
  return m ? decodeLevel(m[1]) : null;
}

export default function App() {
  const [view, setView] = useState<View>("home");
  const [saved, setSaved] = useState<SavedGame[]>(() => loadGames());
  const [studioDraft, setStudioDraft] = useState<Draft>(
    () => loadDraft() ?? { id: null, level: starterLevel() },
  );
  const [studioKey, setStudioKey] = useState(0);
  const [play, setPlay] = useState<{ level: Level; from: View } | null>(null);
  const [launch, setLaunch] = useState<Level | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const fromHash = useRef(false);
  const toastTimer = useRef<number>();

  const flash = useCallback((msg: string) => {
    setToast(msg);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2200);
  }, []);

  // Deep links: #play=<code> opens straight into that game.
  useEffect(() => {
    const tryHash = () => {
      const lvl = playCodeFromHash();
      if (lvl) {
        fromHash.current = true;
        setPlay({ level: lvl, from: "home" });
        setView("play");
      }
    };
    tryHash();
    window.addEventListener("hashchange", tryHash);
    return () => window.removeEventListener("hashchange", tryHash);
  }, []);

  // Keep the saved-games list fresh whenever we land back on the home page.
  useEffect(() => {
    if (view === "home") setSaved(loadGames());
  }, [view]);

  const enterStudio = useCallback((draft: Draft) => {
    setStudioDraft(draft);
    saveDraft(draft);
    setStudioKey((k) => k + 1);
    setView("studio");
  }, []);

  const openStudioResume = useCallback(() => {
    enterStudio(loadDraft() ?? { id: null, level: starterLevel() });
  }, [enterStudio]);

  const createNew = useCallback(() => {
    enterStudio({ id: null, level: starterLevel() });
  }, [enterStudio]);

  const remix = useCallback(
    (level: Level, id: string | null = null) => {
      enterStudio({ id, level: cloneLevel(level) });
    },
    [enterStudio],
  );

  const playLevel = useCallback((level: Level, from: View) => {
    fromHash.current = false;
    setPlay({ level, from });
    setView("play");
  }, []);

  const share = useCallback(
    async (level: Level) => {
      await copyShareLink(level);
      flash("Share link copied to clipboard");
    },
    [flash],
  );

  const removeGame = useCallback((id: string) => {
    deleteGame(id);
    setSaved(loadGames());
  }, []);

  const exitPlay = useCallback(() => {
    const back = play?.from ?? "home";
    if (fromHash.current) {
      history.replaceState(null, "", location.pathname + location.search);
      fromHash.current = false;
    }
    setView(back);
  }, [play]);

  let body: JSX.Element;
  if (view === "studio") {
    body = (
      <Studio
        key={studioKey}
        initial={studioDraft}
        onExit={() => setView("home")}
        onTest={(level) => playLevel(level, "studio")}
        onLaunch={(level) => setLaunch(level)}
      />
    );
  } else if (view === "play" && play) {
    body = (
      <GamePlayer
        level={play.level}
        onExit={exitPlay}
        onEdit={() => remix(play.level, null)}
        onShare={() => share(play.level)}
        onLaunch={() => setLaunch(play.level)}
      />
    );
  } else {
    body = (
      <Landing
        examples={EXAMPLE_LEVELS}
        saved={saved}
        onOpenStudio={openStudioResume}
        onCreate={createNew}
        onPlay={(level) => playLevel(level, "home")}
        onEdit={remix}
        onShare={share}
        onLaunch={(level) => setLaunch(level)}
        onDelete={removeGame}
      />
    );
  }

  return (
    <>
      {body}
      {launch && <LaunchModal level={launch} onClose={() => setLaunch(null)} />}
      <Toast msg={toast} />
    </>
  );
}

function Toast({ msg }: { msg: string | null }) {
  if (!msg) return null;
  return (
    <div className="animate-fade-rise pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-black/10 bg-black px-5 py-2.5 text-sm text-white shadow-xl">
      {msg}
    </div>
  );
}
