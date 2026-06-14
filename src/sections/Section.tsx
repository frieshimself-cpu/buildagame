import type { ReactNode } from "react";
import { Reveal } from "../components/Reveal";

export function Section({
  id,
  eyebrow,
  title,
  intro,
  children,
  className = "",
}: {
  id?: string;
  eyebrow: string;
  title: ReactNode;
  intro?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`mx-auto max-w-7xl px-6 py-24 sm:px-8 sm:py-32 ${className}`}>
      <Reveal>
        <p className="text-xs uppercase tracking-[0.22em] text-muted">{eyebrow}</p>
        <h2
          className="mt-4 max-w-3xl font-display text-4xl text-black sm:text-5xl md:text-6xl"
          style={{ letterSpacing: "-1px", lineHeight: 1.02 }}
        >
          {title}
        </h2>
        {intro && <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted">{intro}</p>}
      </Reveal>
      {children && <div className="mt-14">{children}</div>}
    </section>
  );
}
