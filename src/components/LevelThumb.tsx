import { useEffect, useRef } from "react";
import { Tile, type Level } from "../engine/types";
import { drawSpawnMarker, drawTileCell } from "../studio/tileArt";

/** A static, fit-to-frame preview of a level — used on the showcase cards. */
export function LevelThumb({ level, className = "" }: { level: Level; className?: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Sky.
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, "#14172e");
      sky.addColorStop(1, "#222850");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);

      // Show the start of the level, scaled so the full height fits.
      const tile = h / level.height;
      const cols = Math.min(level.width, Math.ceil(w / tile) + 1);
      for (let gx = 0; gx < cols; gx++) {
        for (let gy = 0; gy < level.height; gy++) {
          const t = level.tiles[gy * level.width + gx] as Tile;
          if (t !== Tile.Empty) drawTileCell(ctx, t, gx * tile, gy * tile, tile);
        }
      }
      if (level.spawn.x < cols) drawSpawnMarker(ctx, level.spawn.x * tile, level.spawn.y * tile, tile);
    };

    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [level]);

  return (
    <div ref={wrapRef} className={`relative overflow-hidden ${className}`}>
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}
