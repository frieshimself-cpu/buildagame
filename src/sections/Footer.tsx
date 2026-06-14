interface Props {
  onOpenStudio: () => void;
}

export function Footer({ onOpenStudio }: Props) {
  const year = new Date().getFullYear();
  return (
    <footer id="reach" className="border-t border-line">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="font-display text-3xl tracking-tight text-black">
            Aethera<sup className="top-[-0.7em] text-[0.42em] tracking-normal">®</sup>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
            A browser studio for building, playing and sharing your own platformers. Questions,
            ideas, bugs — it's a playground, so go break things.
          </p>
          <button
            onClick={onOpenStudio}
            className="mt-6 rounded-full bg-black px-6 py-2.5 text-sm text-white transition-transform duration-200 hover:scale-[1.03]"
          >
            Begin Journey
          </button>
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted">Explore</p>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><a href="#showcase" className="text-black/70 transition-colors hover:text-black">Showcase</a></li>
            <li><a href="#features" className="text-black/70 transition-colors hover:text-black">Features</a></li>
            <li><a href="#about" className="text-black/70 transition-colors hover:text-black">How it works</a></li>
            <li>
              <button onClick={onOpenStudio} className="text-black/70 transition-colors hover:text-black">
                Studio
              </button>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted">Reach us</p>
          <ul className="mt-4 space-y-2.5 text-sm text-black/70">
            <li>Built for makers everywhere.</li>
            <li>No account. No tracking.</li>
            <li>Your levels stay in your browser.</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-6 py-6 text-xs text-muted sm:flex-row sm:px-8">
          <span>© {year} Aethera. A place to build games.</span>
          <span>Made with platforms, springs and a flag at the end.</span>
        </div>
      </div>
    </footer>
  );
}
