import { useEffect, useRef } from "react";
import { Tile, type Brush, type Level } from "../engine/types";
import { drawSpawnMarker, drawTileCell } from "./tileArt";
import { useRaf } from "../game/useRaf";

interface Props {
  levelRef: React.MutableRefObject<Level>;
  tool: Brush;
  scrollX: number;
  onScrollChange: (next: number) => void;
  onMeta: (maxScroll: number) => void;
  beginStroke: () => void;
  paint: (x: number, y: number) => void;
  erase: (x: number, y: number) => void;
  endStroke: () => void;
}

interface ViewMeta {
  tile: number;
  scroll: number;
  maxScroll: number;
}

export function EditorCanvas(props: Props) {
  const { levelRef, tool, scrollX, onScrollChange, onMeta } = props;
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sizeRef = useRef({ w: 1, h: 1, dpr: 1 });
  const viewRef = useRef<ViewMeta>({ tile: 24, scroll: 0, maxScroll: 0 });
  const hoverRef = useRef<{ x: number; y: number } | null>(null);
  const drawing = useRef<{ active: boolean; erase: boolean; lx: number; ly: number }>({
    active: false,
    erase: false,
    lx: 0,
    ly: 0,
  });
  const lastMaxScroll = useRef(-1);

  // Keep the latest scroll value available to imperative handlers.
  const scrollRef = useRef(scrollX);
  scrollRef.current = scrollX;
  const toolRef = useRef(tool);
  toolRef.current = tool;

  useEffect(() => {
    const el = wrapRef.current;
    const canvas = canvasRef.current;
    if (!el || !canvas) return;
    const ctx = canvas.getContext("2d");
    const apply = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = el.clientWidth;
      const h = el.clientHeight;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sizeRef.current = { w, h, dpr };
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const cellFromEvent = (e: PointerEvent | React.PointerEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const { tile } = viewRef.current;
    const x = Math.floor(scrollRef.current + (e.clientX - rect.left) / tile);
    const y = Math.floor((e.clientY - rect.top) / tile);
    return { x, y };
  };

  // Paint along a line of cells so fast drags don't leave gaps.
  const stroke = (x0: number, y0: number, x1: number, y1: number, erase: boolean) => {
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;
    let x = x0;
    let y = y0;
    for (let guard = 0; guard < 1000; guard++) {
      if (erase) props.erase(x, y);
      else props.paint(x, y);
      if (x === x1 && y === y1) break;
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x += sx;
      }
      if (e2 < dx) {
        err += dx;
        y += sy;
      }
    }
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.button !== 2) return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    const { x, y } = cellFromEvent(e);
    const erase = e.button === 2;
    props.beginStroke();
    if (erase) props.erase(x, y);
    else props.paint(x, y);
    drawing.current = { active: true, erase, lx: x, ly: y };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const { x, y } = cellFromEvent(e);
    hoverRef.current = { x, y };
    const d = drawing.current;
    if (d.active) {
      stroke(d.lx, d.ly, x, y, d.erase);
      d.lx = x;
      d.ly = y;
    }
  };

  const endStroke = () => {
    if (drawing.current.active) {
      drawing.current.active = false;
      props.endStroke();
    }
  };

  const onWheel = (e: React.WheelEvent) => {
    const { tile, maxScroll } = viewRef.current;
    if (maxScroll <= 0) return;
    const delta = (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY) / tile;
    onScrollChange(Math.max(0, Math.min(maxScroll, scrollRef.current + delta)));
  };

  useRaf((now) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;
    const lvl = levelRef.current;
    const { w, h } = sizeRef.current;
    const tile = h / lvl.height;
    const visible = w / tile;
    const maxScroll = Math.max(0, lvl.width - visible);
    const scroll = Math.max(0, Math.min(maxScroll, scrollRef.current));
    viewRef.current = { tile, scroll, maxScroll };
    if (Math.abs(maxScroll - lastMaxScroll.current) > 0.001) {
      lastMaxScroll.current = maxScroll;
      onMeta(maxScroll);
    }

    const originX = scroll * tile;

    // Background.
    ctx.fillStyle = "#0d0f17";
    ctx.fillRect(0, 0, w, h);

    // World area (within bounds) slightly lighter.
    ctx.fillStyle = "#11141f";
    ctx.fillRect(-originX, 0, lvl.width * tile, lvl.height * tile);

    // Grid lines.
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    const c0 = Math.floor(scroll);
    const c1 = Math.ceil(scroll + visible);
    ctx.beginPath();
    for (let gx = c0; gx <= c1; gx++) {
      const px = Math.round(gx * tile - originX) + 0.5;
      ctx.moveTo(px, 0);
      ctx.lineTo(px, lvl.height * tile);
    }
    for (let gy = 0; gy <= lvl.height; gy++) {
      const py = Math.round(gy * tile) + 0.5;
      ctx.moveTo(0, py);
      ctx.lineTo(w, py);
    }
    ctx.stroke();

    // Tiles.
    const x0 = Math.max(0, Math.floor(scroll) - 1);
    const x1 = Math.min(lvl.width - 1, Math.ceil(scroll + visible) + 1);
    for (let gx = x0; gx <= x1; gx++) {
      for (let gy = 0; gy < lvl.height; gy++) {
        const t = lvl.tiles[gy * lvl.width + gx] as Tile;
        if (t !== Tile.Empty) drawTileCell(ctx, t, gx * tile - originX, gy * tile, tile);
      }
    }

    // Spawn marker.
    drawSpawnMarker(ctx, lvl.spawn.x * tile - originX, lvl.spawn.y * tile, tile);

    // Hover ghost of the current tool.
    const hov = hoverRef.current;
    if (hov && hov.x >= 0 && hov.x < lvl.width && hov.y >= 0 && hov.y < lvl.height) {
      const px = hov.x * tile - originX;
      const py = hov.y * tile;
      ctx.save();
      ctx.globalAlpha = 0.45;
      if (toolRef.current === "eraser") {
        ctx.strokeStyle = "#ff7a7a";
        ctx.lineWidth = 2;
        ctx.strokeRect(px + 2, py + 2, tile - 4, tile - 4);
      } else if (toolRef.current === "spawn") {
        drawSpawnMarker(ctx, px, py, tile);
      } else {
        drawTileCell(ctx, toolRef.current as Tile, px, py, tile);
      }
      ctx.restore();
      ctx.strokeStyle = "rgba(255,255,255,0.5)";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(px + 0.5, py + 0.5, tile - 1, tile - 1);
    }

    void now;
  });

  return (
    <div ref={wrapRef} className="relative h-full w-full overflow-hidden">
      <canvas
        ref={canvasRef}
        className="h-full w-full cursor-crosshair touch-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endStroke}
        onPointerLeave={() => {
          hoverRef.current = null;
          endStroke();
        }}
        onPointerCancel={endStroke}
        onWheel={onWheel}
        onContextMenu={(e) => e.preventDefault()}
      />
    </div>
  );
}
