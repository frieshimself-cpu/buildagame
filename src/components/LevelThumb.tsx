import { useEffect, useRef } from "react";
import type { Level } from "../engine/types";
import { paintLevelPreview } from "../render/levelImage";

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
      paintLevelPreview(ctx, level, w, h);
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
