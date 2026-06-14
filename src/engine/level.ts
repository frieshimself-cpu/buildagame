import { Tile, type Level, type Vec2 } from "./types";

export const MIN_WIDTH = 16;
export const MAX_WIDTH = 240;
export const MIN_HEIGHT = 8;
export const MAX_HEIGHT = 24;

export const idx = (w: number, x: number, y: number) => y * w + x;

export function tileAt(level: Level, x: number, y: number): Tile {
  if (x < 0 || x >= level.width || y < 0 || y >= level.height) return Tile.Empty;
  return level.tiles[idx(level.width, x, y)] as Tile;
}

/* ------------------------------------------------------------------ *
 * Construction helpers
 * ------------------------------------------------------------------ */

export function createBlankLevel(name: string, width: number, height: number): Level {
  return {
    name,
    width,
    height,
    spawn: { x: 2, y: height - 3 },
    tiles: new Array(width * height).fill(Tile.Empty),
  };
}

function set(level: Level, x: number, y: number, tile: Tile) {
  if (x < 0 || x >= level.width || y < 0 || y >= level.height) return;
  level.tiles[idx(level.width, x, y)] = tile;
}

function fillRect(level: Level, x0: number, y0: number, x1: number, y1: number, tile: Tile) {
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(level, x, y, tile);
}

/** Solid ground from `topRow` to the bottom, across [x0, x1]. */
function ground(level: Level, x0: number, x1: number, topRow: number) {
  fillRect(level, x0, topRow, x1, level.height - 1, Tile.Solid);
}

function row(level: Level, y: number, x0: number, x1: number, tile: Tile) {
  for (let x = x0; x <= x1; x++) set(level, x, y, tile);
}

/**
 * A friendly starting canvas for the editor: a floor, the player, and a goal at
 * the far end — already playable, so a new maker has something to run.
 */
export function starterLevel(): Level {
  const lvl = createBlankLevel("Untitled level", 48, 14);
  const top = 12;
  ground(lvl, 0, lvl.width - 1, top);
  lvl.spawn = { x: 2, y: top - 1 };
  set(lvl, lvl.width - 3, top - 1, Tile.Goal);
  return lvl;
}

/* ------------------------------------------------------------------ *
 * ASCII authoring (used by the built-in levels + tests)
 * ------------------------------------------------------------------ */

const CHAR_TO_TILE: Record<string, Tile> = {
  "#": Tile.Solid,
  "^": Tile.Spike,
  o: Tile.Coin,
  e: Tile.Enemy,
  s: Tile.Spring,
  G: Tile.Goal,
};

/**
 * Build a level from rows of characters (top row first). `@` marks the spawn,
 * `.`/space are empty. Rows are padded to the widest row.
 */
export function fromAscii(name: string, rows: string[]): Level {
  const height = rows.length;
  const width = Math.max(...rows.map((r) => r.length));
  const lvl = createBlankLevel(name, width, height);
  for (let y = 0; y < height; y++) {
    const r = rows[y];
    for (let x = 0; x < r.length; x++) {
      const ch = r[x];
      if (ch === "@") lvl.spawn = { x, y };
      else if (CHAR_TO_TILE[ch] !== undefined) set(lvl, x, y, CHAR_TO_TILE[ch]);
    }
  }
  return lvl;
}

const TILE_TO_CHAR: Record<number, string> = {
  [Tile.Empty]: ".",
  [Tile.Solid]: "#",
  [Tile.Spike]: "^",
  [Tile.Coin]: "o",
  [Tile.Enemy]: "e",
  [Tile.Spring]: "s",
  [Tile.Goal]: "G",
};

/** Inverse of {@link fromAscii}; handy for debugging + snapshot tests. */
export function toAscii(level: Level): string[] {
  const rows: string[] = [];
  for (let y = 0; y < level.height; y++) {
    let r = "";
    for (let x = 0; x < level.width; x++) {
      if (level.spawn.x === x && level.spawn.y === y) r += "@";
      else r += TILE_TO_CHAR[tileAt(level, x, y)] ?? ".";
    }
    rows.push(r);
  }
  return rows;
}

/* ------------------------------------------------------------------ *
 * Validation / normalisation
 * ------------------------------------------------------------------ */

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Coerce arbitrary (possibly imported) data into a safe, well-formed level. */
export function normaliseLevel(input: Partial<Level> | null | undefined): Level {
  const width = clamp(Math.round(input?.width ?? 48) || 48, MIN_WIDTH, MAX_WIDTH);
  const height = clamp(Math.round(input?.height ?? 14) || 14, MIN_HEIGHT, MAX_HEIGHT);
  const tiles = new Array(width * height).fill(Tile.Empty);
  const src = Array.isArray(input?.tiles) ? input!.tiles : [];
  for (let i = 0; i < tiles.length && i < src.length; i++) {
    const v = Math.round(src[i]);
    tiles[i] = v >= Tile.Empty && v <= Tile.Goal ? v : Tile.Empty;
  }
  const spawn: Vec2 = {
    x: clamp(Math.round(input?.spawn?.x ?? 2), 0, width - 1),
    y: clamp(Math.round(input?.spawn?.y ?? height - 3), 0, height - 1),
  };
  const name = (typeof input?.name === "string" ? input!.name : "Untitled level")
    .slice(0, 60)
    .trim() || "Untitled level";
  return { name, width, height, spawn, tiles };
}

/* ------------------------------------------------------------------ *
 * JSON (export / import / local storage)
 * ------------------------------------------------------------------ */

export function levelToJson(level: Level): string {
  return JSON.stringify({ v: 1, ...level }, null, 2);
}

export function levelFromJson(json: string): Level {
  return normaliseLevel(JSON.parse(json) as Partial<Level>);
}

/* ------------------------------------------------------------------ *
 * Compact share codes (used in the URL)
 *
 * Layout (before base64url): `1|<name>|<w>|<h>|<sx>|<sy>|<rle>`
 * The grid is run-length encoded: a base36 count followed by an uppercase
 * letter A–G for the tile code (A=empty … G=goal). Uppercase letters can't
 * appear inside a base36 count, so the stream is unambiguous.
 * ------------------------------------------------------------------ */

const CODE_LETTERS = "ABCDEFG"; // index = tile code 0..6

function rleEncode(tiles: number[]): string {
  let out = "";
  let i = 0;
  while (i < tiles.length) {
    const code = clamp(tiles[i] | 0, Tile.Empty, Tile.Goal);
    let j = i + 1;
    while (j < tiles.length && (clamp(tiles[j] | 0, Tile.Empty, Tile.Goal) === code)) j++;
    out += (j - i).toString(36) + CODE_LETTERS[code];
    i = j;
  }
  return out;
}

function rleDecode(s: string, expectedLen: number): number[] {
  const tiles: number[] = [];
  let num = "";
  for (const ch of s) {
    const code = CODE_LETTERS.indexOf(ch);
    if (code >= 0) {
      const count = parseInt(num || "1", 36);
      for (let k = 0; k < count; k++) tiles.push(code);
      num = "";
    } else {
      num += ch;
    }
  }
  while (tiles.length < expectedLen) tiles.push(Tile.Empty);
  tiles.length = expectedLen;
  return tiles;
}

function toBase64Url(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(code: string): string {
  let s = code.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  const bin = atob(s);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function encodeLevel(level: Level): string {
  const payload = [
    "1",
    encodeURIComponent(level.name),
    level.width,
    level.height,
    level.spawn.x,
    level.spawn.y,
    rleEncode(level.tiles),
  ].join("|");
  return toBase64Url(payload);
}

export function decodeLevel(code: string): Level | null {
  try {
    const payload = fromBase64Url(code);
    const parts = payload.split("|");
    if (parts[0] !== "1" || parts.length < 7) return null;
    const width = parseInt(parts[2], 10);
    const height = parseInt(parts[3], 10);
    if (!Number.isFinite(width) || !Number.isFinite(height)) return null;
    return normaliseLevel({
      name: decodeURIComponent(parts[1]),
      width,
      height,
      spawn: { x: parseInt(parts[4], 10), y: parseInt(parts[5], 10) },
      tiles: rleDecode(parts[6], width * height),
    });
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ *
 * Built-in showcase levels
 * ------------------------------------------------------------------ */

/** A vertical run of coins, every other row, climbing out of a spring. */
function coinTower(lvl: Level, x: number, fromY: number) {
  for (let y = fromY; y >= fromY - 4; y -= 2) set(lvl, x, y, Tile.Coin);
}

function firstSteps(): Level {
  const lvl = createBlankLevel("First Steps", 44, 14);
  const top = 12;
  const surf = top - 1; // row the player + props stand in
  // One short gap near the start, then a long, safe run to the flag.
  ground(lvl, 0, 9, top);
  ground(lvl, 13, 43, top);
  lvl.spawn = { x: 2, y: surf };

  // A welcoming arc of coins over the gap (10–12).
  set(lvl, 7, 9, Tile.Coin);
  set(lvl, 9, 8, Tile.Coin);
  set(lvl, 11, 8, Tile.Coin);
  set(lvl, 13, 9, Tile.Coin);

  // A bounce pad, flush with the ground, under a tower of coins.
  set(lvl, 22, top, Tile.Spring);
  coinTower(lvl, 22, 9);

  // One slow enemy to learn the stomp on.
  set(lvl, 30, surf, Tile.Enemy);

  set(lvl, 40, surf, Tile.Goal);
  return lvl;
}

function coinRush(): Level {
  const lvl = createBlankLevel("Coin Rush", 60, 14);
  const top = 12;
  const surf = top - 1;
  ground(lvl, 0, 16, top);
  ground(lvl, 20, 59, top); // wide, safe landing field
  lvl.spawn = { x: 2, y: surf };

  // Opening staircase of floating blocks, each capped with a coin.
  for (let i = 0; i < 3; i++) {
    const x = 5 + i * 2;
    set(lvl, x, 10 - i, Tile.Solid);
    set(lvl, x, 9 - i, Tile.Coin);
  }

  // Coin arc over the gap (17–19).
  set(lvl, 15, 9, Tile.Coin);
  set(lvl, 17, 8, Tile.Coin);
  set(lvl, 19, 8, Tile.Coin);
  set(lvl, 21, 9, Tile.Coin);

  // Two bounce pads with coin towers.
  set(lvl, 26, top, Tile.Spring);
  coinTower(lvl, 26, 9);
  set(lvl, 52, top, Tile.Spring);
  coinTower(lvl, 52, 9);

  // A low coin field to scoop while running.
  row(lvl, 10, 34, 38, Tile.Coin);

  // A reachable platform loaded with coins.
  row(lvl, 9, 44, 49, Tile.Solid);
  row(lvl, 8, 44, 49, Tile.Coin);

  // A couple of enemies on the open ground.
  set(lvl, 32, surf, Tile.Enemy);
  set(lvl, 40, surf, Tile.Enemy);

  set(lvl, 57, surf, Tile.Goal);
  return lvl;
}

function spikeCavern(): Level {
  const lvl = createBlankLevel("Spike Cavern", 54, 15);
  const top = 13;
  const surf = top - 1; // row 12
  ground(lvl, 0, 53, top); // continuous floor — the danger is on the surface

  lvl.spawn = { x: 2, y: surf };

  // An opening gauntlet of spike strips to hop over (safe footing between).
  row(lvl, surf, 8, 9, Tile.Spike);
  row(lvl, surf, 14, 15, Tile.Spike);
  row(lvl, surf, 18, 19, Tile.Spike);

  // A small platform detour with coins.
  row(lvl, 10, 11, 13, Tile.Solid);
  row(lvl, 9, 11, 13, Tile.Coin);

  // Bounce pads sit in spike-free corridors, each under a coin tower.
  set(lvl, 26, top, Tile.Spring);
  coinTower(lvl, 26, 9);

  // Two enemies in the open middle.
  set(lvl, 31, surf, Tile.Enemy);
  set(lvl, 36, surf, Tile.Enemy);

  // A late spike strip, then a final bounce pad near the flag.
  row(lvl, surf, 42, 43, Tile.Spike);
  set(lvl, 47, top, Tile.Spring);
  coinTower(lvl, 47, 9);

  set(lvl, 52, surf, Tile.Goal);
  return lvl;
}

/** The curated levels shown in the showcase, in order of difficulty. */
export const EXAMPLE_LEVELS: Level[] = [firstSteps(), coinRush(), spikeCavern()];

export function exampleByName(name: string): Level | undefined {
  return EXAMPLE_LEVELS.find((l) => l.name === name);
}
