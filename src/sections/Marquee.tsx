const ITEMS = [
  "Visual editor",
  "Real physics",
  "Instant play",
  "Shareable links",
  "Works offline",
  "Export to JSON",
  "Remix anything",
  "No install",
];

export function Marquee() {
  return (
    <div className="overflow-hidden border-y border-line py-5">
      <div className="flex w-max animate-marquee gap-10 whitespace-nowrap pr-10">
        {[0, 1].map((dup) => (
          <div key={dup} className="flex shrink-0 items-center gap-10" aria-hidden={dup === 1}>
            {ITEMS.map((it) => (
              <span key={it} className="flex items-center gap-10 text-sm uppercase tracking-[0.18em] text-muted">
                {it}
                <span className="text-black/20">✦</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
