import { normaliseLevel } from "./engine/level";
import type { Level } from "./engine/types";

const GAMES_KEY = "aethera.games.v1";
const DRAFT_KEY = "aethera.draft.v1";

export interface SavedGame {
  id: string;
  name: string;
  level: Level;
  updatedAt: number;
}

export interface Draft {
  id: string | null;
  level: Level;
}

function newId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `g_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full / unavailable — fail quietly, the app still works in-memory */
  }
}

export function loadGames(): SavedGame[] {
  const raw = read<SavedGame[]>(GAMES_KEY, []);
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((g) => g && typeof g.id === "string")
    .map((g) => ({ ...g, level: normaliseLevel(g.level) }))
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

/** Insert or update a game by id. Returns the stored record (with its id). */
export function saveGame(level: Level, id: string | null): SavedGame {
  const games = loadGames();
  const record: SavedGame = {
    id: id ?? newId(),
    name: level.name,
    level,
    updatedAt: Date.now(),
  };
  const idx = games.findIndex((g) => g.id === record.id);
  if (idx >= 0) games[idx] = record;
  else games.unshift(record);
  write(GAMES_KEY, games);
  return record;
}

export function deleteGame(id: string) {
  write(
    GAMES_KEY,
    loadGames().filter((g) => g.id !== id),
  );
}

export function loadDraft(): Draft | null {
  const raw = read<Draft | null>(DRAFT_KEY, null);
  if (!raw || !raw.level) return null;
  return { id: typeof raw.id === "string" ? raw.id : null, level: normaliseLevel(raw.level) };
}

export function saveDraft(draft: Draft) {
  write(DRAFT_KEY, draft);
}
