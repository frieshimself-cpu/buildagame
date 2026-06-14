import { Hero } from "./components/Hero";
import type { Level } from "./engine/types";
import type { SavedGame } from "./storage";
import { Coin } from "./sections/Coin";
import { CTASection } from "./sections/CTASection";
import { Features } from "./sections/Features";
import { Footer } from "./sections/Footer";
import { HowItWorks } from "./sections/HowItWorks";
import { Marquee } from "./sections/Marquee";
import { Showcase } from "./sections/Showcase";

interface Props {
  examples: Level[];
  saved: SavedGame[];
  onOpenStudio: () => void;
  onCreate: () => void;
  onPlay: (level: Level) => void;
  onEdit: (level: Level, id?: string | null) => void;
  onShare: (level: Level) => void;
  onLaunch: (level: Level) => void;
  onDelete: (id: string) => void;
}

export function Landing(props: Props) {
  return (
    <div className="min-h-screen w-full bg-background font-inter text-foreground">
      <Hero onOpenStudio={props.onOpenStudio} />
      <Marquee />
      <Features />
      <HowItWorks />
      <Showcase
        examples={props.examples}
        saved={props.saved}
        onPlay={props.onPlay}
        onEdit={props.onEdit}
        onShare={props.onShare}
        onLaunch={props.onLaunch}
        onCreate={props.onCreate}
        onDelete={props.onDelete}
      />
      <Coin onOpenStudio={props.onOpenStudio} />
      <CTASection onOpenStudio={props.onOpenStudio} />
      <Footer onOpenStudio={props.onOpenStudio} />
    </div>
  );
}
