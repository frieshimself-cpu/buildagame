import { Reveal } from "../components/Reveal";
import { Section } from "./Section";

const STEPS = [
  {
    n: "01",
    title: "Build",
    body: "Open the studio and paint your world onto the grid — platforms, coins, springs, a flag to reach. Place where the player starts and the camera follows.",
  },
  {
    n: "02",
    title: "Test",
    body: "Press Test and play your level immediately with real platformer physics. Tweak a jump, move a spike, run it again. The loop is instant.",
  },
  {
    n: "03",
    title: "Share",
    body: "Happy with it? Copy a link or export the file. Your whole game travels in a URL — anyone who clicks is playing in seconds.",
  },
];

export function HowItWorks() {
  return (
    <Section
      id="about"
      eyebrow="How it works"
      title="From an idea to a playable game in three moves."
      intro="Aethera exists for one thing: to shrink the distance between imagining a game and watching someone play it. No engine to install, no language to learn — the whole thing runs in your browser."
    >
      <div className="grid gap-px overflow-hidden rounded-3xl border border-line bg-line md:grid-cols-3">
        {STEPS.map((s, i) => (
          <Reveal key={s.n} delay={i * 0.1} className="bg-white">
            <div className="h-full p-8 sm:p-10">
              <div className="font-display text-5xl text-black/15">{s.n}</div>
              <h3 className="mt-5 font-display text-3xl text-black">{s.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{s.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
