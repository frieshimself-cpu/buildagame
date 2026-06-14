import { Tile } from "../engine/types";

/**
 * Compact, static tile art shared by the editor grid and the gallery
 * thumbnails. `s` is the cell size in pixels. Kept deliberately simple and
 * allocation-free so it can paint hundreds of cells per frame.
 */
export const TILE_ART = {
  block: "#3b4168",
  blockCap: "#5a63a0",
  spike: "#e5575d",
  coin: "#ffd05a",
  spring: "#a99bff",
  springPlate: "#6f63c4",
  goal: "#54e0ad",
  goalPole: "#e8ecff",
  enemy: "#bb7cf2",
  enemyDark: "#8a52c4",
  eye: "#1b1f3a",
};

export function drawTileCell(
  ctx: CanvasRenderingContext2D,
  tile: Tile,
  px: number,
  py: number,
  s: number,
) {
  switch (tile) {
    case Tile.Solid:
      ctx.fillStyle = TILE_ART.block;
      ctx.fillRect(px, py, s + 0.6, s + 0.6);
      ctx.fillStyle = TILE_ART.blockCap;
      ctx.fillRect(px, py, s + 0.6, Math.max(2, s * 0.16));
      break;
    case Tile.Spike: {
      const n = 3;
      const w = s / n;
      ctx.fillStyle = TILE_ART.spike;
      for (let i = 0; i < n; i++) {
        ctx.beginPath();
        ctx.moveTo(px + i * w, py + s);
        ctx.lineTo(px + i * w + w / 2, py + s * 0.28);
        ctx.lineTo(px + (i + 1) * w, py + s);
        ctx.closePath();
        ctx.fill();
      }
      break;
    }
    case Tile.Coin:
      ctx.fillStyle = TILE_ART.coin;
      ctx.beginPath();
      ctx.arc(px + s / 2, py + s / 2, s * 0.27, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff0bf";
      ctx.beginPath();
      ctx.arc(px + s * 0.4, py + s * 0.4, s * 0.08, 0, Math.PI * 2);
      ctx.fill();
      break;
    case Tile.Spring:
      ctx.strokeStyle = TILE_ART.spring;
      ctx.lineWidth = Math.max(1.5, s * 0.07);
      for (let i = 0; i < 3; i++) {
        const yy = py + s * 0.5 + (s * 0.4 * i) / 3;
        ctx.beginPath();
        ctx.moveTo(px + s * 0.2, yy);
        ctx.lineTo(px + s * 0.8, yy);
        ctx.stroke();
      }
      ctx.fillStyle = TILE_ART.springPlate;
      ctx.fillRect(px + s * 0.12, py + s * 0.4, s * 0.76, s * 0.12);
      break;
    case Tile.Goal:
      ctx.fillStyle = TILE_ART.goalPole;
      ctx.fillRect(px + s * 0.46, py + s * 0.05, s * 0.08, s * 0.9);
      ctx.fillStyle = TILE_ART.goal;
      ctx.beginPath();
      ctx.moveTo(px + s * 0.54, py + s * 0.08);
      ctx.lineTo(px + s * 0.95, py + s * 0.24);
      ctx.lineTo(px + s * 0.54, py + s * 0.42);
      ctx.closePath();
      ctx.fill();
      break;
    case Tile.Enemy: {
      const m = s * 0.12;
      ctx.fillStyle = TILE_ART.enemyDark;
      ctx.fillRect(px + m, py + s * 0.5, s - 2 * m, s * 0.4);
      ctx.fillStyle = TILE_ART.enemy;
      ctx.beginPath();
      ctx.arc(px + s / 2, py + s * 0.46, s * 0.32, Math.PI, 0);
      ctx.rect(px + m, py + s * 0.46, s - 2 * m, s * 0.3);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(px + s * 0.4, py + s * 0.44, s * 0.08, 0, Math.PI * 2);
      ctx.arc(px + s * 0.6, py + s * 0.44, s * 0.08, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = TILE_ART.eye;
      ctx.beginPath();
      ctx.arc(px + s * 0.4, py + s * 0.45, s * 0.04, 0, Math.PI * 2);
      ctx.arc(px + s * 0.6, py + s * 0.45, s * 0.04, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    default:
      break;
  }
}

/** The little spawn marker drawn in the editor. */
export function drawSpawnMarker(ctx: CanvasRenderingContext2D, px: number, py: number, s: number) {
  ctx.fillStyle = "#f4ebd6";
  ctx.beginPath();
  ctx.roundRect?.(px + s * 0.22, py + s * 0.18, s * 0.56, s * 0.7, s * 0.18);
  if (!ctx.roundRect) ctx.rect(px + s * 0.22, py + s * 0.18, s * 0.56, s * 0.7);
  ctx.fill();
  ctx.fillStyle = "#1b1f3a";
  ctx.beginPath();
  ctx.arc(px + s * 0.42, py + s * 0.42, s * 0.05, 0, Math.PI * 2);
  ctx.arc(px + s * 0.58, py + s * 0.42, s * 0.05, 0, Math.PI * 2);
  ctx.fill();
}
