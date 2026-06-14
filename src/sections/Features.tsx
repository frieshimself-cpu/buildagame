import {
  Gauge,
  Link2,
  MousePointerClick,
  Play,
  Sparkles,
  WifiOff,
  type LucideIcon,
} from "lucide-react";
import { Reveal } from "../components/Reveal";
import { Section } from "./Section";

const FEATURES: { icon: LucideIcon; title: string; body: string; tint: string }[] = [
  {
    icon: MousePointerClick,
    title: "Visual level editor",
    body: "Paint ground, coins, springs, enemies and hazards onto a grid. No code, no menus to learn — just draw.",
    tint: "#5a63a0",
  },
  {
    icon: Gauge,
    title: "Physics that feel right",
    body: "Coyote time, jump buffering and variable jump height are built in, so even a five-minute level plays like a real platformer.",
    tint: "#bb7cf2",
  },
  {
    icon: Play,
    title: "Play instantly",
    body: "Hit Test and you're playing the exact level on screen. No build step, no waiting — iterate in seconds.",
    tint: "#54e0ad",
  },
  {
    icon: Link2,
    title: "Share with a link",
    body: "Every game compresses into a single URL. Send it to a friend and they play it immediately in the browser.",
    tint: "#ffd05a",
  },
  {
    icon: WifiOff,
    title: "Yours, and offline",
    body: "Levels save to your browser and export to a JSON file you own. Nothing locked behind an account.",
    tint: "#7fc8ff",
  },
  {
    icon: Sparkles,
    title: "Remix anything",
    body: "Open any showcase level straight into the studio, take it apart, and make it your own.",
    tint: "#ff9d7a",
  },
];

export function Features() {
  return (
    <Section
      id="features"
      eyebrow="Why Aethera"
      title="Everything you need to make a game worth playing."
      intro="A focused toolkit — small enough to learn in a minute, deep enough to keep you building."
    >
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f, i) => {
          const Icon = f.icon;
          return (
            <Reveal key={f.title} delay={(i % 3) * 0.08}>
              <div className="group h-full rounded-2xl border border-line bg-white p-7 transition-shadow duration-300 hover:shadow-[0_18px_50px_-20px_rgba(0,0,0,0.25)]">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${f.tint}22`, color: f.tint }}
                >
                  <Icon size={20} />
                </div>
                <h3 className="mt-5 font-display text-2xl text-black">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{f.body}</p>
              </div>
            </Reveal>
          );
        })}
      </div>
    </Section>
  );
}
