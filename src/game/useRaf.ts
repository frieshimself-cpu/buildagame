import { useEffect, useRef } from "react";

/** Run `cb(nowMs)` every animation frame. The latest `cb` is always used. */
export function useRaf(cb: (now: number) => void, active = true) {
  const ref = useRef(cb);
  ref.current = cb;
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const loop = (t: number) => {
      ref.current(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [active]);
}
