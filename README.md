# Aethera — build, play and share your own games

Aethera is a **2D platformer maker that runs entirely in the browser**. Paint a
level on a grid, press play to run it with real platformer physics, and share
the whole game as a single link. No engine to install, no account, no backend.

> _Beyond the blank canvas, we build the playable._

## What's actually in here

This isn't a mockup — it's a working game engine plus a studio plus a cinematic
landing page.

- **A real physics engine** (`src/engine`) — fixed-timestep simulation with
  swept tile collision, gravity, and the small touches that make a platformer
  feel good: **coyote time**, **jump buffering** and **variable jump height**.
  Coins, springs, spikes, patrolling/stompable enemies and a goal flag.
- **A visual studio** (`src/studio`) — paint tiles with the mouse (or finger),
  drag to draw lines, right-drag to erase, undo/redo, resize the world, place
  the spawn, and **test-play instantly**. Autosaves a draft as you go.
- **Instant play** (`src/game`) — the same engine rendered to a `<canvas>` with
  a following camera, particles, HUD, win screen and on-screen touch controls.
- **Sharing** — every level compresses (run-length + base64url) into a URL like
  `…/#play=<code>`. Open the link and you're playing it. Levels also export to a
  JSON file you own, and save to `localStorage`.
- **A cinematic landing page** (`src/components`, `src/sections`) — Instrument
  Serif + Inter, a looping fade in/out video background, and scroll-reveal
  sections, including a showcase of playable built-in levels.

## Launch a game as a coin ($GAME on Pump.fun)

Aethera is the home of **$GAME** on Pump.fun — and every game you build can become
its own token. From the studio (or a game's win screen) hit **Launch** to mint it
on Solana:

- The game's image and a **playable share link** are written into the token
  metadata, so anyone who finds the coin can play the game.
- It's **non-custodial** — you sign in your own wallet (Phantom/Solflare/Backpack).
  Aethera never holds keys or funds. Token creation is built via
  [PumpPortal](https://pumpportal.fun)'s local-transaction API; the site only asks
  your wallet to sign.
- Honest by design: the UI states plainly that this is a real mainnet token that
  costs SOL, is permissionless, can't be undone, and carries no guarantee of value.

**Deploy notes for the launch feature:**

- The token image is uploaded to Pump.fun's IPFS endpoint through a tiny
  serverless proxy at [`api/pump-ipfs.ts`](api/pump-ipfs.ts) to avoid browser CORS.
  This runs automatically on **Vercel** (or `vercel dev`). On a purely static host
  (e.g. GitHub Pages) that proxy doesn't exist, so launching needs the Vercel
  deployment.
- After you create the **$GAME** coin, paste its mint address into
  [`src/coin.ts`](src/coin.ts) (`GAME.contractAddress`) and the nav, token band and
  footer light up with the live address, a copy button and Buy / Solscan links.

## Controls

| Action | Keys |
| --- | --- |
| Move | `←` `→` / `A` `D` |
| Jump | `↑` / `W` / `Space` (hold for higher) |
| Restart | `R` |
| Exit | `Esc` |

In the studio: `1–8` pick a tool, `Ctrl/⌘+Z` / `Ctrl/⌘+Shift+Z` undo/redo,
`Ctrl/⌘+S` save, `T` test.

## Run it

```bash
npm install
npm run dev      # local dev server
npm test         # engine + render tests (vitest)
npm run build    # type-check + production build to dist/
```

## How it's built

React 18 · Vite · TypeScript (strict) · Tailwind CSS. The engine is pure,
framework-agnostic TypeScript so it can be unit-tested directly — see
`src/engine/__tests__`. The build is configured with a relative base, so the
`dist/` output works on GitHub Pages, Vercel, or any static host.

```
src/
  engine/     pure game logic: types, physics, levels, share codes (+ tests)
  game/       canvas renderer, input, the play view
  studio/     the level editor (canvas, palette, undo/redo, persistence)
  components/  hero (video bg), navbar, scroll-reveal, thumbnails
  sections/    landing-page sections (features, how-it-works, showcase, …)
  App.tsx      view routing (home / studio / play) + deep-link sharing
```

Made with platforms, springs, and a flag at the end.
