import { describe, expect, it } from "vitest";
import { DT } from "../../engine/constants";
import { EXAMPLE_LEVELS, fromAscii } from "../../engine/level";
import { buildGameState, step } from "../../engine/physics";
import { Tile, type Input } from "../../engine/types";
import { drawGame } from "../render";
import { drawSpawnMarker, drawTileCell } from "../../studio/tileArt";

/**
 * The renderer never runs in the node test environment, so stub a 2D context
 * that records every call. The goal isn't pixel-accuracy — it's proving the
 * draw code executes end-to-end (every entity, particles, overlays) without
 * throwing or producing a call that a real canvas wouldn't accept.
 */
function makeCtx() {
  let calls = 0;
  const grad = { addColorStop: () => {} };
  const handler: ProxyHandler<Record<string, unknown>> = {
    get(target, prop) {
      if (prop === "createLinearGradient" || prop === "createRadialGradient") {
        return () => grad;
      }
      if (prop === "__calls") return calls;
      if (prop in target) return target[prop as string];
      // Any drawing method: count it and return undefined.
      return (...args: unknown[]) => {
        calls++;
        for (const a of args) if (typeof a === "number" && Number.isNaN(a)) throw new Error("NaN passed to ctx");
        return undefined;
      };
    },
    set(target, prop, value) {
      if (typeof value === "number" && Number.isNaN(value)) throw new Error(`NaN assigned to ${String(prop)}`);
      target[prop as string] = value;
      return true;
    },
  };
  return new Proxy({} as Record<string, unknown>, handler) as unknown as CanvasRenderingContext2D & {
    __calls: number;
  };
}

const view = { width: 960, height: 540, dpr: 1 };

describe("game renderer", () => {
  it("draws every example level across its lifecycle without throwing", () => {
    for (const lvl of EXAMPLE_LEVELS) {
      const state = buildGameState(lvl);
      const ctx = makeCtx();
      drawGame(ctx, state, view, 0);
      // Advance through a few seconds of play, drawing along the way.
      const input: Input = { left: false, right: true, jump: true };
      for (let i = 0; i < 360; i++) {
        step(state, input, DT);
        if (i % 30 === 0) drawGame(ctx, state, view, i * DT);
      }
      expect((ctx as unknown as { __calls: number }).__calls).toBeGreaterThan(0);
    }
  });

  it("draws win and death overlays", () => {
    const won = buildGameState(fromAscii("t", ["....", "....", "@.G.", "####"]));
    for (let i = 0; i < 200; i++) step(won, { left: false, right: true, jump: false }, DT);
    expect(won.phase).toBe("won");
    drawGame(makeCtx(), won, view, 1);

    const dead = buildGameState(fromAscii("t", ["@...", "^...", "####"]));
    for (let i = 0; i < 60; i++) step(dead, { left: false, right: false, jump: false }, DT);
    expect(dead.phase).toBe("dead");
    drawGame(makeCtx(), dead, view, 1);
  });

  it("draws every tile type for the editor/thumbnails", () => {
    const ctx = makeCtx();
    for (const t of [Tile.Solid, Tile.Spike, Tile.Coin, Tile.Enemy, Tile.Spring, Tile.Goal]) {
      drawTileCell(ctx, t, 0, 0, 32);
    }
    drawSpawnMarker(ctx, 0, 0, 32);
    expect((ctx as unknown as { __calls: number }).__calls).toBeGreaterThan(0);
  });
});
