interface Props {
  onOpenStudio: () => void;
}

const LINKS = [
  { label: "Home", href: "#top", active: true },
  { label: "Showcase", href: "#showcase" },
  { label: "About", href: "#about" },
  { label: "$GAME", href: "#token" },
  { label: "Reach Us", href: "#reach" },
];

export function Navbar({ onOpenStudio }: Props) {
  return (
    <nav className="absolute inset-x-0 top-0 z-20">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 sm:px-8">
        <a href="#top" className="font-display text-3xl tracking-tight text-black">
          Aethera<sup className="top-[-0.7em] text-[0.42em] tracking-normal">®</sup>
        </a>

        <div className="hidden items-center gap-8 md:flex">
          {LINKS.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="text-sm transition-colors hover:text-black"
              style={{ color: l.active ? "#000000" : "#6F6F6F" }}
            >
              {l.label}
            </a>
          ))}
          <button
            onClick={onOpenStudio}
            className="text-sm transition-colors hover:text-black"
            style={{ color: "#6F6F6F" }}
          >
            Studio
          </button>
        </div>

        <button
          onClick={onOpenStudio}
          className="rounded-full bg-black px-6 py-2.5 text-sm text-white transition-transform duration-200 hover:scale-[1.03]"
        >
          Begin Journey
        </button>
      </div>
    </nav>
  );
}
