import type { GameState } from "../engine/types";

/**
 * Canvas renderer for the live game. Pure function of (state, viewport, time):
 * it never mutates the simulation, so the same state can be drawn at any frame
 * rate. All art is vector-drawn — no image assets to load.
 */

export interface Viewport {
  width: number; // CSS pixels
  height: number; // CSS pixels
  dpr: number;
}

const TAU = Math.PI * 2;

const COLORS = {
  skyTop: "#161a33",
  hillFar: "#272c4d",
  hillNear: "#2f355c",
  block: "#3b4168",
  blockCap: "#5a63a0",
  blockShade: "#2c3052",
  spike: "#e5575d",
  spikeDark: "#b8323a",
  coin: "#ffd05a",
  coinHi: "#fff0bf",
  spring: "#a99bff",
  springPlate: "#6f63c4",
  goal: "#54e0ad",
  goalPole: "#e8ecff",
  enemy: "#bb7cf2",
  enemyDark: "#8a52c4",
  player: "#f4ebd6",
  playerShade: "#d8caa6",
  eye: "#1b1f3a",
};

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

export function drawGame(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  view: Viewport,
  t: number,
) {
  const { width: cw, height: ch } = view;
  const tile = ch / state.height; // fit the full level height
  const viewTilesX = cw / tile;

  // Camera follows the player horizontally, clamped to the world.
  const pcx = state.player.x + state.player.w / 2;
  const half = viewTilesX / 2;
  const camX = Math.max(half, Math.min(state.width - half, pcx));
  const originX = camX * tile - cw / 2;

  const sx = (wx: number) => wx * tile - originX;
  const sy = (wy: number) => wy * tile;

  // --- Sky ---
  const sky = ctx.createLinearGradient(0, 0, 0, ch);
  sky.addColorStop(0, "#12152b");
  sky.addColorStop(0.55, "#1b2042");
  sky.addColorStop(1, "#252a51");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, cw, ch);

  // --- Parallax hills ---
  drawHills(ctx, cw, ch, originX * 0.25, COLORS.hillFar, 0.72);
  drawHills(ctx, cw, ch, originX * 0.5, COLORS.hillNear, 0.84);

  // --- Solid blocks (only the visible columns) ---
  const x0 = Math.max(0, Math.floor(originX / tile) - 1);
  const x1 = Math.min(state.width - 1, Math.ceil((originX + cw) / tile) + 1);
  for (let gx = x0; gx <= x1; gx++) {
    for (let gy = 0; gy < state.height; gy++) {
      if (state.solid[gy * state.width + gx] !== 1) continue; // 2 = spring, drawn separately
      const px = sx(gx);
      const py = sy(gy);
      ctx.fillStyle = COLORS.block;
      ctx.fillRect(px, py, tile + 0.5, tile + 0.5);
      // Grass-like cap when the cell above is open.
      if (gy === 0 || state.solid[(gy - 1) * state.width + gx] !== 1) {
        ctx.fillStyle = COLORS.blockCap;
        ctx.fillRect(px, py, tile + 0.5, Math.max(3, tile * 0.16));
      }
      // Bottom shade.
      ctx.fillStyle = COLORS.blockShade;
      ctx.fillRect(px, py + tile * 0.82, tile + 0.5, tile * 0.2);
    }
  }

  // --- Spikes ---
  for (const sp of state.spikes) {
    const px = sx(sp.x);
    const py = sy(sp.y);
    const n = 3;
    const w = tile / n;
    ctx.fillStyle = COLORS.spike;
    for (let i = 0; i < n; i++) {
      ctx.beginPath();
      ctx.moveTo(px + i * w, py + tile);
      ctx.lineTo(px + i * w + w / 2, py + tile * 0.28);
      ctx.lineTo(px + (i + 1) * w, py + tile);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = COLORS.spikeDark;
    ctx.fillRect(px, py + tile * 0.86, tile, tile * 0.14);
  }

  // --- Springs (contact plate at the top of the cell, where the player lands) ---
  for (const s of state.springs) {
    const compress = state.springAnim.get(s.y * state.width + s.x) ?? 0;
    const px = sx(s.x);
    const py = sy(s.y);
    // Base anchored at the bottom of the cell.
    ctx.fillStyle = "#4a4080";
    ctx.fillRect(px + tile * 0.12, py + tile * 0.82, tile * 0.76, tile * 0.18);
    const plateY = py + tile * (0.08 + compress * 0.36);
    // Coils between the plate and the base.
    ctx.strokeStyle = COLORS.spring;
    ctx.lineWidth = Math.max(2, tile * 0.08);
    ctx.beginPath();
    const coilTop = plateY + tile * 0.16;
    const coilBot = py + tile * 0.82;
    for (let i = 0; i <= 3; i++) {
      const yy = coilTop + ((coilBot - coilTop) * i) / 3;
      ctx.moveTo(px + tile * 0.2, yy);
      ctx.lineTo(px + tile * 0.8, yy);
    }
    ctx.stroke();
    ctx.fillStyle = COLORS.springPlate;
    roundRect(ctx, px + tile * 0.1, plateY, tile * 0.8, tile * 0.16, 4);
    ctx.fill();
  }

  // --- Goal flag ---
  if (state.goal) {
    const px = sx(state.goal.x) + tile * 0.5;
    const top = sy(state.goal.y) + tile * 0.05;
    const hgt = tile * 0.95;
    ctx.fillStyle = COLORS.goalPole;
    ctx.fillRect(px - tile * 0.04, top, tile * 0.08, hgt);
    ctx.fillStyle = COLORS.goal;
    ctx.beginPath();
    ctx.moveTo(px, top);
    for (let i = 0; i <= 6; i++) {
      const fy = top + (i / 6) * tile * 0.4;
      const wave = Math.sin(t * 4 + i * 0.7) * tile * 0.06;
      ctx.lineTo(px + tile * 0.5 + wave, fy + tile * 0.06);
    }
    ctx.lineTo(px, top + tile * 0.46);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#bfffe9";
    ctx.beginPath();
    ctx.arc(px, top, tile * 0.06, 0, Math.PI * 2);
    ctx.fill();
  }

  // --- Coins ---
  for (const c of state.coins) {
    if (c.taken) continue;
    const px = sx(c.x);
    const py = sy(c.y) + Math.sin(t * 2 + c.phase) * tile * 0.06;
    const r = tile * 0.26;
    const sxFactor = Math.abs(Math.cos(t * 3 + c.phase));
    ctx.fillStyle = COLORS.coin;
    ctx.beginPath();
    ctx.ellipse(px, py, Math.max(1, r * sxFactor), r, 0, 0, Math.PI * 2);
    ctx.fill();
    if (sxFactor > 0.4) {
      ctx.fillStyle = COLORS.coinHi;
      ctx.beginPath();
      ctx.ellipse(px - r * 0.25 * sxFactor, py - r * 0.3, r * 0.18 * sxFactor, r * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // --- Enemies ---
  for (const e of state.enemies) {
    if (!e.alive) continue;
    drawShadow(ctx, sx(e.x + e.w / 2), sy(e.y + e.h) + 2, tile * e.w * 0.55, tile);
    const wob = Math.sin(e.phase * 12) * tile * 0.04;
    const px = sx(e.x);
    const py = sy(e.y) + wob;
    const w = tile * e.w;
    const h = tile * e.h;
    ctx.fillStyle = COLORS.enemyDark;
    roundRect(ctx, px, py + h * 0.55, w, h * 0.45, tile * 0.18);
    ctx.fill();
    ctx.fillStyle = COLORS.enemy;
    roundRect(ctx, px, py, w, h * 0.78, tile * 0.22);
    ctx.fill();
    // Eyes look toward travel direction.
    const ex = px + (e.dir > 0 ? w * 0.6 : w * 0.4);
    const ey = py + h * 0.34;
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(ex - tile * 0.1, ey, tile * 0.09, 0, TAU);
    ctx.arc(ex + tile * 0.12, ey, tile * 0.09, 0, TAU);
    ctx.fill();
    ctx.fillStyle = COLORS.eye;
    ctx.beginPath();
    ctx.arc(ex - tile * 0.1 + e.dir * tile * 0.02, ey, tile * 0.045, 0, TAU);
    ctx.arc(ex + tile * 0.12 + e.dir * tile * 0.02, ey, tile * 0.045, 0, TAU);
    ctx.fill();
  }

  // --- Player ---
  drawPlayer(ctx, state, sx, sy, tile, t);

  // --- Particles ---
  for (const p of state.particles) {
    ctx.globalAlpha = Math.max(0, Math.min(1, p.life / p.maxLife));
    ctx.fillStyle = p.color;
    const s = p.size * tile;
    ctx.fillRect(sx(p.x) - s / 2, sy(p.y) - s / 2, s, s);
  }
  ctx.globalAlpha = 1;

  // --- Spawn flash ---
  if (state.player.spawnFlash > 0) {
    ctx.globalAlpha = state.player.spawnFlash * 0.5;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, cw, ch);
    ctx.globalAlpha = 1;
  }

  // --- Vignette ---
  const vig = ctx.createRadialGradient(cw / 2, ch / 2, ch * 0.3, cw / 2, ch / 2, ch * 0.85);
  vig.addColorStop(0, "rgba(0,0,0,0)");
  vig.addColorStop(1, "rgba(5,6,16,0.5)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, cw, ch);
}

function drawShadow(ctx: CanvasRenderingContext2D, cx: number, y: number, rx: number, tile: number) {
  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.ellipse(cx, y, rx, tile * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawPlayer(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  sx: (x: number) => number,
  sy: (y: number) => number,
  tile: number,
  t: number,
) {
  const p = state.player;
  drawShadow(ctx, sx(p.x + p.w / 2), sy(p.y + p.h) + 2, tile * p.w * 0.55, tile);

  const squash = p.squash;
  const stretch = 1 / squash;
  const cx = sx(p.x + p.w / 2);
  const footY = sy(p.y + p.h);
  const w = tile * p.w * squash;
  const h = tile * p.h * stretch;

  ctx.save();
  if (p.spawnFlash > 0 && Math.floor(t * 20) % 2 === 0) ctx.globalAlpha = 0.6;

  // Body.
  ctx.fillStyle = COLORS.playerShade;
  roundRect(ctx, cx - w / 2, footY - h + h * 0.5, w, h * 0.5, tile * 0.2);
  ctx.fill();
  ctx.fillStyle = COLORS.player;
  roundRect(ctx, cx - w / 2, footY - h, w, h * 0.92, tile * 0.24);
  ctx.fill();

  // Eyes (toward facing).
  const dir = p.facing;
  const eyeX = cx + dir * w * 0.16;
  const eyeY = footY - h * 0.62;
  ctx.fillStyle = COLORS.eye;
  ctx.beginPath();
  ctx.arc(eyeX - tile * 0.1, eyeY, tile * 0.06, 0, Math.PI * 2);
  ctx.arc(eyeX + tile * 0.12, eyeY, tile * 0.06, 0, Math.PI * 2);
  ctx.fill();
  // Cheek.
  ctx.fillStyle = "rgba(232,150,140,0.5)";
  ctx.beginPath();
  ctx.arc(eyeX + dir * tile * 0.02, eyeY + tile * 0.16, tile * 0.07, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawHills(
  ctx: CanvasRenderingContext2D,
  cw: number,
  ch: number,
  offset: number,
  color: string,
  baseline: number,
) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, ch);
  const span = cw + 120;
  for (let x = -60; x <= span; x += 30) {
    const y =
      ch * baseline -
      Math.sin((x + offset) * 0.004) * ch * 0.12 -
      Math.cos((x + offset) * 0.013) * ch * 0.05;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(cw, ch);
  ctx.closePath();
  ctx.fill();
}
