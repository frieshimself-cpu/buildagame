import {
  AIR_ACCEL,
  AIR_FRICTION,
  COYOTE_TIME,
  ENEMY_H,
  ENEMY_SPEED,
  ENEMY_W,
  GRAVITY,
  GROUND_FRICTION,
  JUMP_BUFFER,
  JUMP_CUT,
  JUMP_SPEED,
  PIT_MARGIN,
  PLAYER_H,
  PLAYER_W,
  RUN_ACCEL,
  RUN_SPEED,
  SPRING_SPEED,
  STOMP_BOUNCE,
  TERMINAL_VY,
} from "./constants";
import { idx } from "./level";
import { Tile, type Box, type GameState, type Input, type Level, type Particle } from "./types";

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

function overlap(a: Box, b: Box): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

/* ------------------------------------------------------------------ *
 * Building the live state from an authored level
 * ------------------------------------------------------------------ */

export function buildGameState(level: Level): GameState {
  const { width, height } = level;
  const solid = new Uint8Array(width * height);
  const coins: GameState["coins"] = [];
  const enemies: GameState["enemies"] = [];
  const springs: GameState["springs"] = [];
  const spikes: GameState["spikes"] = [];
  let goal: GameState["goal"] = null;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const t = level.tiles[idx(width, x, y)] as Tile;
      switch (t) {
        case Tile.Solid:
          solid[idx(width, x, y)] = 1;
          break;
        case Tile.Coin:
          coins.push({ x: x + 0.5, y: y + 0.5, taken: false, phase: (x * 7 + y * 13) % 7 });
          break;
        case Tile.Enemy:
          enemies.push({
            x: x + (1 - ENEMY_W) / 2,
            y: y + 1 - ENEMY_H,
            w: ENEMY_W,
            h: ENEMY_H,
            vx: 0,
            vy: 0,
            dir: -1,
            alive: true,
            phase: 0,
          });
          break;
        case Tile.Spring:
          springs.push({ x, y });
          solid[idx(width, x, y)] = 2; // solid for collision (2), but not drawn as a block
          break;
        case Tile.Spike:
          spikes.push({ x, y });
          break;
        case Tile.Goal:
          if (!goal) goal = { x, y };
          break;
      }
    }
  }

  return {
    level,
    solid,
    width,
    height,
    player: {
      x: level.spawn.x + (1 - PLAYER_W) / 2,
      y: level.spawn.y + 1 - PLAYER_H,
      w: PLAYER_W,
      h: PLAYER_H,
      vx: 0,
      vy: 0,
      onGround: false,
      facing: 1,
      squash: 1,
      spawnFlash: 0,
    },
    coins,
    enemies,
    springs,
    spikes,
    goal,
    particles: [],
    score: 0,
    totalCoins: coins.length,
    deaths: 0,
    time: 0,
    phase: "playing",
    springAnim: new Map(),
    coyote: 0,
    jumpBuffer: 0,
    jumpHeld: false,
    endTimer: 0,
  };
}

/** Reset to spawn after a death, preserving the running clock + death count. */
export function respawn(state: GameState) {
  const fresh = buildGameState(state.level);
  fresh.deaths = state.deaths;
  fresh.time = state.time;
  fresh.player.spawnFlash = 1.0;
  Object.assign(state, fresh);
}

/* ------------------------------------------------------------------ *
 * Collision
 * ------------------------------------------------------------------ */

function solidAt(state: GameState, x: number, y: number): boolean {
  // Left/right walls are solid so you can't leave the world sideways; the top
  // is open (jump above the screen) and the bottom is an open pit.
  if (x < 0 || x >= state.width) return true;
  if (y < 0 || y >= state.height) return false;
  return state.solid[y * state.width + x] !== 0; // 1 = block, 2 = spring
}

/**
 * Integrate `box` by its velocity for `dt`, resolving collisions against solid
 * tiles one axis at a time. Mutates the box; returns which contacts happened.
 * Shared by the player and the enemies. Because each fixed step moves the box
 * well under one tile, scanning only the leading edge is sufficient.
 */
function moveAndCollide(state: GameState, box: Box & { vx: number; vy: number }, dt: number) {
  const eps = 1e-4;
  let onGround = false;
  let hitX = false;
  let hitY = false;

  // --- X axis ---
  box.x += box.vx * dt;
  if (box.vx > 0) {
    const ix = Math.floor(box.x + box.w - eps);
    for (let iy = Math.floor(box.y + eps); iy <= Math.floor(box.y + box.h - eps); iy++) {
      if (solidAt(state, ix, iy)) {
        box.x = ix - box.w;
        box.vx = 0;
        hitX = true;
        break;
      }
    }
  } else if (box.vx < 0) {
    const ix = Math.floor(box.x + eps);
    for (let iy = Math.floor(box.y + eps); iy <= Math.floor(box.y + box.h - eps); iy++) {
      if (solidAt(state, ix, iy)) {
        box.x = ix + 1;
        box.vx = 0;
        hitX = true;
        break;
      }
    }
  }

  // --- Y axis ---
  box.y += box.vy * dt;
  if (box.vy > 0) {
    const iy = Math.floor(box.y + box.h - eps);
    for (let ix = Math.floor(box.x + eps); ix <= Math.floor(box.x + box.w - eps); ix++) {
      if (solidAt(state, ix, iy)) {
        box.y = iy - box.h;
        box.vy = 0;
        hitY = true;
        onGround = true;
        break;
      }
    }
  } else if (box.vy < 0) {
    const iy = Math.floor(box.y + eps);
    for (let ix = Math.floor(box.x + eps); ix <= Math.floor(box.x + box.w - eps); ix++) {
      if (solidAt(state, ix, iy)) {
        box.y = iy + 1;
        box.vy = 0;
        hitY = true;
        break;
      }
    }
  }

  return { onGround, hitX, hitY };
}

/* ------------------------------------------------------------------ *
 * Particles (pure juice)
 * ------------------------------------------------------------------ */

function spawnParticles(
  state: GameState,
  x: number,
  y: number,
  count: number,
  color: string,
  spread: number,
  up = 0,
) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = Math.random() * spread;
    state.particles.push({
      x,
      y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp - up,
      life: 0.4 + Math.random() * 0.4,
      maxLife: 0.8,
      color,
      size: 0.06 + Math.random() * 0.08,
    });
  }
  // Keep the particle list bounded so long sessions stay cheap.
  if (state.particles.length > 220) state.particles.splice(0, state.particles.length - 220);
}

function updateParticles(state: GameState, dt: number) {
  const list = state.particles;
  for (let i = list.length - 1; i >= 0; i--) {
    const p: Particle = list[i];
    p.life -= dt;
    if (p.life <= 0) {
      list.splice(i, 1);
      continue;
    }
    p.vy += GRAVITY * 0.45 * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
  }
}

/* ------------------------------------------------------------------ *
 * The fixed-step simulation
 * ------------------------------------------------------------------ */

function kill(state: GameState) {
  if (state.phase !== "playing") return;
  state.phase = "dead";
  state.deaths += 1;
  state.endTimer = 0;
  const p = state.player;
  spawnParticles(state, p.x + p.w / 2, p.y + p.h / 2, 26, "#f5f0e6", 9, 4);
}

function win(state: GameState) {
  if (state.phase !== "playing") return;
  state.phase = "won";
  state.endTimer = 0;
  const g = state.goal!;
  spawnParticles(state, g.x + 0.5, g.y + 0.5, 40, "#7fe3c4", 8, 3);
}

/** Advance the simulation by one fixed timestep. Mutates `state`. */
export function step(state: GameState, input: Input, dt: number) {
  updateParticles(state, dt);
  for (const [k, v] of state.springAnim) {
    const nv = v - dt * 3;
    if (nv <= 0) state.springAnim.delete(k);
    else state.springAnim.set(k, nv);
  }

  if (state.phase !== "playing") {
    state.endTimer += dt;
    return;
  }

  state.time += dt;
  const p = state.player;
  if (p.spawnFlash > 0) p.spawnFlash = Math.max(0, p.spawnFlash - dt);

  // --- Jump intent (edges, buffer, coyote) ---
  const jumpPressed = input.jump && !state.jumpHeld;
  const jumpReleased = !input.jump && state.jumpHeld;
  state.jumpHeld = input.jump;
  if (jumpPressed) state.jumpBuffer = JUMP_BUFFER;
  else state.jumpBuffer = Math.max(0, state.jumpBuffer - dt);
  state.coyote = p.onGround ? COYOTE_TIME : Math.max(0, state.coyote - dt);

  // --- Horizontal movement ---
  const accel = p.onGround ? RUN_ACCEL : AIR_ACCEL;
  const friction = p.onGround ? GROUND_FRICTION : AIR_FRICTION;
  let dir = 0;
  if (input.left) dir -= 1;
  if (input.right) dir += 1;
  if (dir !== 0) {
    p.vx = clamp(p.vx + dir * accel * dt, -RUN_SPEED, RUN_SPEED);
    p.facing = dir > 0 ? 1 : -1;
  } else if (p.vx !== 0) {
    const s = Math.sign(p.vx);
    p.vx -= s * friction * dt;
    if (Math.sign(p.vx) !== s) p.vx = 0;
  }

  // --- Jump ---
  if (state.jumpBuffer > 0 && (p.onGround || state.coyote > 0)) {
    p.vy = -JUMP_SPEED;
    p.onGround = false;
    state.coyote = 0;
    state.jumpBuffer = 0;
    p.squash = 1.3;
    spawnParticles(state, p.x + p.w / 2, p.y + p.h, 6, "#dfeeff", 3, 1);
  }
  if (jumpReleased && p.vy < 0) p.vy *= JUMP_CUT; // variable jump height

  // --- Gravity + integrate ---
  p.vy = Math.min(p.vy + GRAVITY * dt, TERMINAL_VY);
  const impactVy = p.vy;
  const wasAir = !p.onGround;
  const res = moveAndCollide(state, p, dt);
  p.onGround = res.onGround;
  if (res.onGround && wasAir && impactVy > 7) {
    p.squash = clamp(1 - impactVy * 0.02, 0.6, 0.92);
    spawnParticles(state, p.x + p.w / 2, p.y + p.h, 5, "#e9e2d2", 3, 0);
  }
  // Relax squash/stretch back to neutral.
  p.squash += (1 - p.squash) * Math.min(1, dt * 12);

  // --- Coins ---
  for (const c of state.coins) {
    if (c.taken) continue;
    c.phase += dt * 4;
    if (overlap(p, { x: c.x - 0.35, y: c.y - 0.35, w: 0.7, h: 0.7 })) {
      c.taken = true;
      state.score += 1;
      spawnParticles(state, c.x, c.y, 10, "#ffd86b", 5, 2);
    }
  }

  // --- Springs (solid trampolines: bounce when standing on / landing on top) ---
  for (const s of state.springs) {
    if (
      p.onGround &&
      p.x < s.x + 1 &&
      p.x + p.w > s.x &&
      Math.abs(p.y + p.h - s.y) < 0.08
    ) {
      p.vy = -SPRING_SPEED;
      p.onGround = false;
      state.springAnim.set(s.y * state.width + s.x, 1);
      spawnParticles(state, s.x + 0.5, s.y, 10, "#bdb2ff", 5, 3);
      break;
    }
  }

  // --- Spikes (deadly, with a forgiving inset hitbox) ---
  for (const sp of state.spikes) {
    if (overlap(p, { x: sp.x + 0.12, y: sp.y + 0.25, w: 0.76, h: 0.75 })) {
      kill(state);
      return;
    }
  }

  // --- Enemies ---
  for (const e of state.enemies) {
    if (!e.alive) continue;
    e.phase += dt;
    e.vy = Math.min(e.vy + GRAVITY * dt, TERMINAL_VY);
    e.vx = e.dir * ENEMY_SPEED;
    const er = moveAndCollide(state, e, dt);
    if (er.hitX) {
      e.dir = (e.dir * -1) as 1 | -1;
    } else if (er.onGround) {
      // Turn around at the edge of a platform instead of walking off.
      const aheadX = e.dir > 0 ? e.x + e.w + 0.05 : e.x - 0.05;
      const footY = e.y + e.h + 0.1;
      if (!solidAt(state, Math.floor(aheadX), Math.floor(footY))) {
        e.dir = (e.dir * -1) as 1 | -1;
      }
    }

    if (overlap(p, e)) {
      const stomp = p.vy > 0 && p.y + p.h - e.y < 0.5;
      if (stomp) {
        e.alive = false;
        p.vy = -STOMP_BOUNCE;
        p.onGround = false;
        state.score += 1;
        spawnParticles(state, e.x + e.w / 2, e.y + e.h / 2, 16, "#caa6ff", 6, 2);
      } else {
        kill(state);
        return;
      }
    }
  }

  // --- Goal ---
  if (state.goal && overlap(p, { x: state.goal.x + 0.1, y: state.goal.y, w: 0.8, h: 1 })) {
    win(state);
    return;
  }

  // --- Pit ---
  if (p.y > state.height + PIT_MARGIN) kill(state);
}
