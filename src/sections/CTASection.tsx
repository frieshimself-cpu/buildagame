import { Reveal } from "../components/Reveal";

export function CTASection({ onOpenStudio }: { onOpenStudio: () => void }) {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-8 sm:px-8">
      <Reveal>
        <div className="relative overflow-hidden rounded-[2rem] bg-black px-8 py-20 text-center sm:px-12 sm:py-28">
          {/* soft light blooms */}
          <div
            className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full opacity-40 blur-3xl"
            style={{ background: "radial-gradient(circle, rgba(120,130,255,0.6), transparent 60%)" }}
          />
          <div
            className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full opacity-40 blur-3xl"
            style={{ background: "radial-gradient(circle, rgba(255,170,120,0.55), transparent 60%)" }}
          />
          <h2
            className="relative font-display text-4xl text-white sm:text-6xl md:text-7xl"
            style={{ lineHeight: 0.98, letterSpacing: "-1.5px" }}
          >
            Your first game is
            <br />
            one idea away.
          </h2>
          <p className="relative mx-auto mt-6 max-w-xl text-base leading-relaxed text-white/60">
            Open the studio, paint a few platforms, and press play. That's the whole tutorial.
          </p>
          <button
            onClick={onOpenStudio}
            className="relative mt-10 rounded-full bg-white px-12 py-5 text-base font-medium text-black transition-transform duration-200 hover:scale-[1.03]"
          >
            Begin Journey
          </button>
        </div>
      </Reveal>
    </section>
  );
}
