import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import App from "../App";
import { EXAMPLE_LEVELS, starterLevel } from "../engine/level";
import { GamePlayer } from "../game/GamePlayer";
import { Studio } from "../studio/Studio";

/**
 * Server-render smoke tests. They don't run effects (no canvas/loop), but they
 * exercise every component's render path, which catches bad imports, undefined
 * references and broken JSX that `tsc` and the bundler can miss.
 */
describe("smoke render", () => {
  it("renders the landing page", () => {
    const html = renderToString(createElement(App));
    expect(html).toContain("Aethera");
    expect(html).toContain("the playable");
    expect(html).toContain("Begin Journey");
    // Showcase lists the built-in levels.
    expect(html).toContain("First Steps");
  });

  it("renders the studio", () => {
    const html = renderToString(
      createElement(Studio, {
        initial: { id: null, level: starterLevel() },
        onExit: () => {},
        onTest: () => {},
      }),
    );
    expect(html).toContain("Test");
    expect(html).toContain("Ground");
  });

  it("renders the player", () => {
    const html = renderToString(
      createElement(GamePlayer, { level: EXAMPLE_LEVELS[0], onExit: () => {} }),
    );
    expect(html).toContain("First Steps");
    expect(html).toContain("Exit");
  });
});
