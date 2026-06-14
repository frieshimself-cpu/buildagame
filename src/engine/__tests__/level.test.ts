import { describe, expect, it } from "vitest";
import {
  EXAMPLE_LEVELS,
  decodeLevel,
  encodeLevel,
  fromAscii,
  levelFromJson,
  levelToJson,
  normaliseLevel,
  starterLevel,
  toAscii,
} from "../level";
import { DT } from "../constants";
import { buildGameState, step } from "../physics";
import { Tile } from "../types";

describe("ascii authoring", () => {
  it("round-trips through fromAscii / toAscii", () => {
    const rows = ["....G", "..o..", "@...#", "#####"];
    const lvl = fromAscii("t", rows);
    expect(lvl.width).toBe(5);
    expect(lvl.height).toBe(4);
    expect(lvl.spawn).toEqual({ x: 0, y: 2 });
    // toAscii should reproduce the same picture.
    expect(toAscii(lvl)).toEqual(rows);
  });

  it("pads short rows to the widest row", () => {
    const lvl = fromAscii("t", ["@", "###"]);
    expect(lvl.width).toBe(3);
    expect(lvl.tiles).toHaveLength(6);
  });
});

describe("share codes", () => {
  it("round-trips a level losslessly", () => {
    const original = EXAMPLE_LEVELS[2];
    const restored = decodeLevel(encodeLevel(original));
    expect(restored).not.toBeNull();
    expect(restored!.name).toBe(original.name);
    expect(restored!.width).toBe(original.width);
    expect(restored!.height).toBe(original.height);
    expect(restored!.spawn).toEqual(original.spawn);
    expect(restored!.tiles).toEqual(original.tiles);
  });

  it("survives unicode names", () => {
    const lvl = fromAscii("Sky 🌤 Café", ["@.", "##"]);
    const restored = decodeLevel(encodeLevel(lvl));
    expect(restored!.name).toBe("Sky 🌤 Café");
  });

  it("produces a compact code for a sparse level", () => {
    // A wide, mostly-empty level should compress to far fewer chars than cells.
    const code = encodeLevel(starterLevel());
    expect(code.length).toBeLessThan(starterLevel().tiles.length);
  });

  it("returns null for malformed input instead of throwing", () => {
    expect(decodeLevel("this is not base64 @!#")).toBeNull();
    expect(decodeLevel("")).toBeNull();
  });
});

describe("json", () => {
  it("round-trips via JSON", () => {
    const lvl = EXAMPLE_LEVELS[0];
    const back = levelFromJson(levelToJson(lvl));
    expect(back.tiles).toEqual(lvl.tiles);
    expect(back.spawn).toEqual(lvl.spawn);
  });
});

describe("normalisation", () => {
  it("clamps dimensions and sanitises tiles", () => {
    const lvl = normaliseLevel({
      name: "  ",
      width: 5000,
      height: 1,
      spawn: { x: -4, y: 999 },
      tiles: [99, -1, Tile.Solid],
    });
    expect(lvl.width).toBeLessThanOrEqual(240);
    expect(lvl.height).toBeGreaterThanOrEqual(8);
    expect(lvl.name).toBe("Untitled level");
    expect(lvl.spawn.x).toBeGreaterThanOrEqual(0);
    expect(lvl.spawn.y).toBeLessThan(lvl.height);
    // Out-of-range codes collapse to Empty; valid ones are kept.
    expect(lvl.tiles[0]).toBe(Tile.Empty);
    expect(lvl.tiles[2]).toBe(Tile.Solid);
    expect(lvl.tiles).toHaveLength(lvl.width * lvl.height);
  });
});

describe("built-in levels", () => {
  it("are all valid and reachable-looking", () => {
    for (const lvl of EXAMPLE_LEVELS) {
      expect(lvl.tiles).toHaveLength(lvl.width * lvl.height);
      const state = buildGameState(lvl);
      expect(state.goal).not.toBeNull(); // every showcase level has a flag
      expect(state.totalCoins).toBeGreaterThan(0);
      expect(lvl.spawn.x).toBeGreaterThanOrEqual(0);
      expect(lvl.spawn.x).toBeLessThan(lvl.width);
    }
  });

  it("spawn the player safely on solid ground", () => {
    // Standing still at the spawn should settle onto the ground, never dying
    // immediately (which would mean a spawn in a wall or over a pit).
    for (const lvl of EXAMPLE_LEVELS) {
      const state = buildGameState(lvl);
      for (let i = 0; i < 60; i++) step(state, { left: false, right: false, jump: false }, DT);
      expect(state.phase, `${lvl.name} should not die at spawn`).toBe("playing");
      expect(state.player.onGround, `${lvl.name} spawn should be grounded`).toBe(true);
    }
  });
});
