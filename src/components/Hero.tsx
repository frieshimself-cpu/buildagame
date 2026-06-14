import { useEffect, useRef, useState } from "react";
import { Navbar } from "./Navbar";

const VIDEO_URL =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_083109_283f3553-e28f-428b-a723-d639c617eb2b.mp4";

const FADE = 0.5; // seconds of fade-in and fade-out

export function Hero({ onOpenStudio }: { onOpenStudio: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);

  // Custom seamless loop: fade in at the start, fade out before the end, and on
  // `ended` blink to black for 100ms before restarting — no hard cut.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    let raf = 0;
    let timer = 0;

    const tick = () => {
      const d = v.duration;
      if (d && !Number.isNaN(d)) {
        const t = v.currentTime;
        let o = 1;
        if (t < FADE) o = t / FADE;
        else if (d - t < FADE) o = (d - t) / FADE;
        v.style.opacity = String(Math.max(0, Math.min(1, o)));
      }
      raf = requestAnimationFrame(tick);
    };

    const onEnded = () => {
      v.style.opacity = "0";
      timer = window.setTimeout(() => {
        v.currentTime = 0;
        v.play().catch(() => {});
      }, 100);
    };
    const onReady = () => v.play().catch(() => {});

    v.addEventListener("ended", onEnded);
    v.addEventListener("loadeddata", onReady);
    raf = requestAnimationFrame(tick);
    v.play().catch(() => {});

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
      v.removeEventListener("ended", onEnded);
      v.removeEventListener("loadeddata", onReady);
    };
  }, []);

  return (
    <header id="top" className="relative min-h-screen w-full overflow-hidden bg-background">
      {/* Cinematic fallback behind the video */}
      <div className="aurora z-0" aria-hidden />

      {/* Background video */}
      {!failed && (
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          preload="auto"
          onError={() => setFailed(true)}
          className="absolute z-0 object-cover"
          style={{ inset: "auto 0 0 0", top: "300px", opacity: 0 }}
        >
          <source src={VIDEO_URL} type="video/mp4" />
        </video>
      )}

      {/* Gradient overlays over the video */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-background via-transparent to-background" />

      <Navbar onOpenStudio={onOpenStudio} />

      {/* Hero content */}
      <div
        className="relative z-10 flex flex-col items-center justify-center px-6 text-center"
        style={{ paddingTop: "calc(8rem - 75px)" }}
      >
        <h1
          className="animate-fade-rise max-w-7xl font-display text-5xl font-normal text-black text-balance sm:text-7xl md:text-8xl"
          style={{ lineHeight: 0.95, letterSpacing: "-2.46px" }}
        >
          Beyond <span className="italic" style={{ color: "#6F6F6F" }}>the blank canvas,</span> we
          build <span className="italic" style={{ color: "#6F6F6F" }}>the playable.</span>
        </h1>

        <p
          className="animate-fade-rise-delay mt-8 max-w-2xl text-base leading-relaxed sm:text-lg"
          style={{ color: "#6F6F6F" }}
        >
          A studio for restless imaginations and fearless makers. Sketch a level, breathe in real
          physics, and share a game anyone can play — no engine, no install, just your idea in
          motion.
        </p>

        <div className="animate-fade-rise-delay-2 mt-12 flex flex-col items-center gap-4">
          <button
            onClick={onOpenStudio}
            className="rounded-full bg-black px-14 py-5 text-base text-white transition-transform duration-200 hover:scale-[1.03]"
          >
            Begin Journey
          </button>
          <a href="#showcase" className="text-sm transition-colors hover:text-black" style={{ color: "#6F6F6F" }}>
            or play a demo level ↓
          </a>
        </div>

        <div className="pb-40" />
      </div>
    </header>
  );
}
