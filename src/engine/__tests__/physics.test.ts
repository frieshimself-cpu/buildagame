import { describe, expect, it } from "vitest";
import { DT } from "../constants";
import { fromAscii } from "../level";
import { buildGameState, step } from "../physics";
import type { GameState, Input } from "../types";

const NONE: Input = { left: false, right: false, jump: false };
const inp = (o: Partial<Input>): Input => ({ ...NONE, ...o });

/** Advance the sim by `seconds`, holding `input` constant. */
function run(state: GameState, seconds: number, input: Input = NONE) {
  const steps = Math.round(seconds / DT);
  for (let i = 0; i < steps; i++) step(state, input, DT);
}

describe("gravity & ground", () => {
  it("falls and comes to rest on solid ground", () => {
    const s = buildGameState(fromAscii("t", ["@....", ".....", ".....", "#####"]));
    run(s, 1.5);
    expect(s.player.onGround).toBe(true);
    // Player height 0.9 resting on row 3 → top-left y ≈ 2.1.
    expect(s.player.y).toBeCloseTo(2.1, 1);
    expect(Math.abs(s.player.vy)).toBeLessThan(0.5);
  });

  it("falling into a pit kills the player", () => {
    const s = buildGameState(fromAscii("t", ["@..", "...", "..."]));
    run(s, 2);
    expect(s.phase).toBe("dead");
    expect(s.deaths).toBe(1);
  });
});

describe("horizontal movement", () => {
  it("runs right when right is held", () => {
    const s = buildGameState(fromAscii("t", ["@.........", "##########"]));
    const x0 = s.player.x;
    run(s, 0.6, inp({ right: true }));
    expect(s.player.x).toBeGreaterThan(x0 + 2);
    expect(s.player.facing).toBe(1);
  });

  it("cannot pass through a solid wall", () => {
    const s = buildGameState(fromAscii("t", ["@#..", ".#..", "####"]));
    run(s, 2, inp({ right: true }));
    // The wall occupies column 1, so the player's right edge stops at x = 1.
    expect(s.player.x + s.player.w).toBeLessThanOrEqual(1.01);
  });
});

describe("jumping", () => {
  it("leaves the ground when jump is pressed", () => {
    const s = buildGameState(fromAscii("t", ["....", "@...", "####"]));
    run(s, 0.3); // settle onto the ground
    expect(s.player.onGround).toBe(true);
    const yStart = s.player.y;
    // Press + hold jump; track the apex.
    let minY = yStart;
    for (let i = 0; i < 90; i++) {
      step(s, inp({ jump: true }), DT);
      minY = Math.min(minY, s.player.y);
    }
    expect(minY).toBeLessThan(yStart - 2); // cleared at least two tiles
  });

  it("gives a shorter hop when the key is tapped (variable height)", () => {
    const make = () => {
      const s = buildGameState(fromAscii("t", ["......", "......", "@.....", "######"]));
      run(s, 0.3);
      return s;
    };

    // Full hold.
    const held = make();
    let heldApex = held.player.y;
    for (let i = 0; i < 90; i++) {
      step(held, inp({ jump: true }), DT);
      heldApex = Math.min(heldApex, held.player.y);
    }

    // Tap: jump for 3 steps, then release.
    const tap = make();
    let tapApex = tap.player.y;
    for (let i = 0; i < 90; i++) {
      step(tap, inp({ jump: i < 3 }), DT);
      tapApex = Math.min(tapApex, tap.player.y);
    }

    expect(tapApex).toBeGreaterThan(heldApex); // tapped jump is lower
  });

  it("allows a jump just after walking off a ledge (coyote time)", () => {
    // A single 1-wide block to walk off of.
    const s = buildGameState(fromAscii("t", ["....", "@...", "#...", "...."]));
    run(s, 0.3);
    let launched = false;
    for (let i = 0; i < 60; i++) {
      const airborneAtEdge = s.player.x >= 1.02 && !s.player.onGround;
      step(s, inp({ right: true, jump: airborneAtEdge }), DT);
      if (airborneAtEdge && s.player.vy < 0) {
        launched = true;
        break;
      }
    }
    expect(launched).toBe(true);
  });
});

describe("pickups & hazards", () => {
  it("collects a coin it overlaps", () => {
    const s = buildGameState(fromAscii("t", ["....", "@...", "o...", "####"]));
    expect(s.totalCoins).toBe(1);
    run(s, 0.5);
    expect(s.score).toBe(1);
    expect(s.coins[0].taken).toBe(true);
  });

  it("dies on spikes", () => {
    const s = buildGameState(fromAscii("t", ["@...", "^...", "####"]));
    run(s, 0.6);
    expect(s.phase).toBe("dead");
  });

  it("launches off a spring far higher than a normal jump", () => {
    const s = buildGameState(fromAscii("t", ["....", "....", "@...", "s...", "####"]));
    let minY = s.player.y;
    for (let i = 0; i < 200; i++) {
      step(s, NONE, DT);
      minY = Math.min(minY, s.player.y);
    }
    expect(minY).toBeLessThan(0.5); // flung most of the way up the level
    expect(s.phase).toBe("playing");
  });

  it("bounces when walking over a ground-flush spring", () => {
    const s = buildGameState(fromAscii("t", ["......", "......", "@.....", "##s###"]));
    let minY = s.player.y;
    for (let i = 0; i < 200; i++) {
      step(s, inp({ right: true }), DT);
      minY = Math.min(minY, s.player.y);
    }
    expect(minY).toBeLessThan(1.0); // the trampoline launched the runner upward
    expect(s.phase).toBe("playing");
  });

  it("reaches the goal to win", () => {
    const s = buildGameState(fromAscii("t", ["....", "....", "@.G.", "####"]));
    run(s, 1.2, inp({ right: true }));
    expect(s.phase).toBe("won");
  });
});

describe("enemies", () => {
  it("is defeated by a stomp from above", () => {
    const s = buildGameState(fromAscii("t", ["@...", "....", "e...", "####"]));
    run(s, 1.0);
    expect(s.enemies[0].alive).toBe(false);
    expect(s.phase).toBe("playing");
  });

  it("kills the player on side contact", () => {
    const s = buildGameState(fromAscii("t", ["....", "@e..", "####"]));
    run(s, 1.0, inp({ right: true }));
    expect(s.phase).toBe("dead");
  });

  it("patrols and turns around at a wall", () => {
    const s = buildGameState(fromAscii("t", [".....", ".e..#", "#####"]));
    const e = s.enemies[0];
    const startDir = e.dir;
    let flipped = false;
    for (let i = 0; i < 600; i++) {
      step(s, NONE, DT);
      if (e.dir !== startDir) flipped = true;
    }
    expect(flipped).toBe(true);
    // Stays within the level bounds while patrolling.
    expect(e.x).toBeGreaterThan(0);
    expect(e.x + e.w).toBeLessThan(s.width);
  });
});
