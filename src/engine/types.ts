/**
 * Core data model for the Aethera platformer engine.
 *
 * The engine works in *tile units*: one tile is 1.0 wide and 1.0 tall. The
 * renderer is the only place that multiplies by a pixel size, which keeps the
 * physics resolution-independent and easy to test.
 */

/** A cell in the level grid. Player spawn is stored separately, not as a tile. */
export enum Tile {
  Empty = 0,
  Solid = 1,
  Spike = 2,
  Coin = 3,
  Enemy = 4,
  Spring = 5,
  Goal = 6,
}

/** Everything paintable in the editor, including the single spawn point. */
export type Brush = Tile | "spawn" | "eraser";

export interface Vec2 {
  x: number;
  y: number;
}

/** A serialisable level: the authored, immutable description of a game. */
export interface Level {
  name: string;
  width: number;
  height: number;
  /** Player start, in tile coordinates (top-left of the player box). */
  spawn: Vec2;
  /** Row-major grid of {@link Tile} codes, length `width * height`. */
  tiles: number[];
}

/** Axis-aligned bounding box in tile units (x,y = top-left). */
export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Player extends Box {
  vx: number;
  vy: number;
  onGround: boolean;
  facing: 1 | -1;
  /** Visual squash/stretch, 1 = neutral. Driven by landings + jumps. */
  squash: number;
  /** Seconds remaining of post-respawn invulnerability flash. */
  spawnFlash: number;
}

export interface Enemy extends Box {
  vx: number;
  vy: number;
  dir: 1 | -1;
  alive: boolean;
  /** Animation phase for the little walk wobble. */
  phase: number;
}

export interface Coin extends Vec2 {
  taken: boolean;
  /** Spin phase, advanced every step for a shimmering rotation. */
  phase: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export type GamePhase = "playing" | "won" | "dead";

/** Per-frame input. `jump` is the raw held state of the jump key. */
export interface Input {
  left: boolean;
  right: boolean;
  jump: boolean;
}

/**
 * The live, mutable simulation. Built from a {@link Level} and advanced in
 * fixed steps. Kept as a single mutable object so the game loop never allocates
 * per frame.
 */
export interface GameState {
  level: Level;
  /** Solidity lookup: 1 where a tile blocks movement, else 0. length w*h. */
  solid: Uint8Array;
  width: number;
  height: number;

  player: Player;
  coins: Coin[];
  enemies: Enemy[];
  springs: Vec2[];
  spikes: Vec2[];
  goal: Vec2 | null;
  particles: Particle[];

  score: number;
  totalCoins: number;
  deaths: number;
  time: number;
  phase: GamePhase;

  /** Spring tiles that are mid-bounce, for a little compression animation. */
  springAnim: Map<number, number>;

  // Timers that give the controls their "good game feel".
  coyote: number;
  jumpBuffer: number;
  jumpHeld: boolean;
  /** Seconds the win/death banner has been showing. */
  endTimer: number;
}
