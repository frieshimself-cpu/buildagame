import { encodeLevel } from "./engine/level";
import type { Level } from "./engine/types";

/** A permanent, self-contained link that plays this exact level. */
export function buildShareUrl(level: Level): string {
  const base = typeof location !== "undefined" ? `${location.origin}${location.pathname}` : "";
  return `${base}#play=${encodeLevel(level)}`;
}

/** Copy a share link to the clipboard, with a legacy fallback. Returns the URL. */
export async function copyShareLink(level: Level): Promise<string> {
  const url = buildShareUrl(level);
  try {
    await navigator.clipboard.writeText(url);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = url;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
    } catch {
      /* clipboard unavailable — the URL is still returned for display */
    }
    document.body.removeChild(ta);
  }
  return url;
}
