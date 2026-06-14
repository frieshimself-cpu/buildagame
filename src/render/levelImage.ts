import { Tile, type Level } from "../engine/types";
import { drawSpawnMarker, drawTileCell } from "../studio/tileArt";

/**
 * Paints a fit-to-frame preview of a level (sky + tiles + spawn). Shared by the
 * showcase thumbnails and the token image generated at launch.
 */
export function paintLevelPreview(
  ctx: CanvasRenderingContext2D,
  level: Level,
  w: number,
  h: number,
) {
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, "#14172e");
  sky.addColorStop(1, "#222850");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  const tile = h / level.height;
  const cols = Math.min(level.width, Math.ceil(w / tile) + 1);
  for (let gx = 0; gx < cols; gx++) {
    for (let gy = 0; gy < level.height; gy++) {
      const t = level.tiles[gy * level.width + gx] as Tile;
      if (t !== Tile.Empty) drawTileCell(ctx, t, gx * tile, gy * tile, tile);
    }
  }
  if (level.spawn.x < cols) drawSpawnMarker(ctx, level.spawn.x * tile, level.spawn.y * tile, tile);
}

/** Render a level to a PNG Blob — used as the Pump.fun token image. */
export function levelToPngBlob(level: Level, w = 600, h = 600): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.reject(new Error("Canvas not available"));
  paintLevelPreview(ctx, level, w, h);
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not render image"))), "image/png");
  });
}
