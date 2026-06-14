import { useCallback, useMemo, useRef, useState } from "react";
import {
  MAX_HEIGHT,
  MAX_WIDTH,
  MIN_HEIGHT,
  MIN_WIDTH,
  idx,
  starterLevel,
} from "../engine/level";
import { Tile, type Brush, type Level } from "../engine/types";
import { type Draft, type SavedGame, saveDraft, saveGame } from "../storage";

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

function cloneLevel(l: Level): Level {
  return { name: l.name, width: l.width, height: l.height, spawn: { ...l.spawn }, tiles: l.tiles.slice() };
}

const HISTORY_LIMIT = 60;

export interface EditorApi {
  /** Authoritative mutable level — the canvas reads this every frame. */
  levelRef: React.MutableRefObject<Level>;
  /** Snapshot mirror used for rendering React controls. */
  level: Level;
  id: string | null;
  tool: Brush;
  dirty: boolean;
  canUndo: boolean;
  canRedo: boolean;

  setTool: (t: Brush) => void;
  beginStroke: () => void;
  paint: (x: number, y: number) => void;
  /** Force-erase a cell regardless of the selected tool (right-drag). */
  erase: (x: number, y: number) => void;
  endStroke: () => void;

  setName: (name: string) => void;
  resize: (width: number, height: number) => void;
  clearLevel: () => void;
  newLevel: () => void;
  loadLevel: (level: Level, id: string | null) => void;

  undo: () => void;
  redo: () => void;
  save: () => SavedGame;
}

export function useEditor(initial: Draft): EditorApi {
  const levelRef = useRef<Level>(cloneLevel(initial.level));
  const [level, setLevelState] = useState<Level>(() => cloneLevel(initial.level));
  const [id, setId] = useState<string | null>(initial.id);
  const [tool, setTool] = useState<Brush>(Tile.Solid);
  const [dirty, setDirty] = useState(false);

  const past = useRef<Level[]>([]);
  const future = useRef<Level[]>([]);
  const [histVer, setHistVer] = useState(0);

  const strokeBefore = useRef<Level | null>(null);
  const strokeChanged = useRef(false);

  // Push the current React snapshot + persist a draft.
  const commit = useCallback(
    (next: Level, nextId: string | null = id) => {
      levelRef.current = next;
      setLevelState(cloneLevel(next));
      setDirty(true);
      saveDraft({ id: nextId, level: next });
    },
    [id],
  );

  const pushHistory = useCallback((before: Level) => {
    past.current.push(before);
    if (past.current.length > HISTORY_LIMIT) past.current.shift();
    future.current = [];
    setHistVer((v) => v + 1);
  }, []);

  /* ---- painting ---- */
  const beginStroke = useCallback(() => {
    strokeBefore.current = cloneLevel(levelRef.current);
    strokeChanged.current = false;
  }, []);

  const paint = useCallback(
    (x: number, y: number) => {
      const lvl = levelRef.current;
      if (x < 0 || x >= lvl.width || y < 0 || y >= lvl.height) return;
      const i = idx(lvl.width, x, y);

      if (tool === "spawn") {
        if (lvl.spawn.x === x && lvl.spawn.y === y && lvl.tiles[i] === Tile.Empty) return;
        lvl.spawn = { x, y };
        lvl.tiles[i] = Tile.Empty; // never spawn inside a wall
      } else if (tool === "eraser") {
        if (lvl.tiles[i] === Tile.Empty) return;
        lvl.tiles[i] = Tile.Empty;
      } else {
        if (lvl.tiles[i] === tool) return;
        // Only one goal allowed.
        if (tool === Tile.Goal) {
          for (let k = 0; k < lvl.tiles.length; k++) if (lvl.tiles[k] === Tile.Goal) lvl.tiles[k] = Tile.Empty;
        }
        lvl.tiles[i] = tool;
      }
      strokeChanged.current = true;
    },
    [tool],
  );

  const erase = useCallback((x: number, y: number) => {
    const lvl = levelRef.current;
    if (x < 0 || x >= lvl.width || y < 0 || y >= lvl.height) return;
    const i = idx(lvl.width, x, y);
    if (lvl.tiles[i] === Tile.Empty) return;
    lvl.tiles[i] = Tile.Empty;
    strokeChanged.current = true;
  }, []);

  const endStroke = useCallback(() => {
    if (strokeChanged.current && strokeBefore.current) {
      pushHistory(strokeBefore.current);
      commit(levelRef.current);
    }
    strokeBefore.current = null;
    strokeChanged.current = false;
  }, [commit, pushHistory]);

  /* ---- structural edits ---- */
  const setName = useCallback(
    (name: string) => {
      const next = cloneLevel(levelRef.current);
      next.name = name.slice(0, 60);
      commit(next);
    },
    [commit],
  );

  const resize = useCallback(
    (width: number, height: number) => {
      const before = cloneLevel(levelRef.current);
      const w = clamp(Math.round(width), MIN_WIDTH, MAX_WIDTH);
      const h = clamp(Math.round(height), MIN_HEIGHT, MAX_HEIGHT);
      if (w === before.width && h === before.height) return;
      const tiles = new Array(w * h).fill(Tile.Empty);
      for (let y = 0; y < Math.min(h, before.height); y++) {
        for (let x = 0; x < Math.min(w, before.width); x++) {
          tiles[y * w + x] = before.tiles[before.width * y + x];
        }
      }
      const next: Level = {
        ...before,
        width: w,
        height: h,
        tiles,
        spawn: { x: clamp(before.spawn.x, 0, w - 1), y: clamp(before.spawn.y, 0, h - 1) },
      };
      pushHistory(before);
      commit(next);
    },
    [commit, pushHistory],
  );

  const clearLevel = useCallback(() => {
    const before = cloneLevel(levelRef.current);
    const next = cloneLevel(before);
    next.tiles = new Array(before.width * before.height).fill(Tile.Empty);
    pushHistory(before);
    commit(next);
  }, [commit, pushHistory]);

  const newLevel = useCallback(() => {
    const before = cloneLevel(levelRef.current);
    const next = starterLevel();
    pushHistory(before);
    setId(null);
    levelRef.current = next;
    setLevelState(cloneLevel(next));
    setDirty(false);
    saveDraft({ id: null, level: next });
  }, [pushHistory]);

  const loadLevel = useCallback((lvl: Level, loadedId: string | null) => {
    past.current = [];
    future.current = [];
    setHistVer((v) => v + 1);
    levelRef.current = cloneLevel(lvl);
    setLevelState(cloneLevel(lvl));
    setId(loadedId);
    setDirty(false);
    saveDraft({ id: loadedId, level: lvl });
  }, []);

  const undo = useCallback(() => {
    const prev = past.current.pop();
    if (!prev) return;
    future.current.push(cloneLevel(levelRef.current));
    levelRef.current = cloneLevel(prev);
    setLevelState(cloneLevel(prev));
    setDirty(true);
    setHistVer((v) => v + 1);
    saveDraft({ id, level: prev });
  }, [id]);

  const redo = useCallback(() => {
    const next = future.current.pop();
    if (!next) return;
    past.current.push(cloneLevel(levelRef.current));
    levelRef.current = cloneLevel(next);
    setLevelState(cloneLevel(next));
    setDirty(true);
    setHistVer((v) => v + 1);
    saveDraft({ id, level: next });
  }, [id]);

  const save = useCallback(() => {
    const record = saveGame(levelRef.current, id);
    setId(record.id);
    setDirty(false);
    saveDraft({ id: record.id, level: levelRef.current });
    return record;
  }, [id]);

  const canUndo = past.current.length > 0;
  const canRedo = future.current.length > 0;
  void histVer; // re-render trigger for undo/redo availability

  return useMemo(
    () => ({
      levelRef,
      level,
      id,
      tool,
      dirty,
      canUndo,
      canRedo,
      setTool,
      beginStroke,
      paint,
      erase,
      endStroke,
      setName,
      resize,
      clearLevel,
      newLevel,
      loadLevel,
      undo,
      redo,
      save,
    }),
    [
      level, id, tool, dirty, canUndo, canRedo,
      beginStroke, paint, erase, endStroke, setName, resize, clearLevel, newLevel, loadLevel, undo, redo, save,
    ],
  );
}
