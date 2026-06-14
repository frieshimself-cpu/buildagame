/**
 * Tunables for the platformer. Units are tiles and seconds. These numbers were
 * hand-tuned so the jump arc clears ~3 tiles of height and a running jump
 * crosses ~6 tiles of gap — the sweet spot that makes hand-built levels fair.
 */

// Fixed simulation step. Small enough that nothing tunnels through a 1-tile
// wall even at top speed (max move per step ≈ 0.2 tiles).
export const DT = 1 / 120;
// Never advance more than this much wall-clock per frame (avoids spiral-of-death
// after a tab is backgrounded).
export const MAX_FRAME = 0.25;

export const GRAVITY = 42; // tiles / s²
export const TERMINAL_VY = 34;

export const RUN_SPEED = 8.6; // top horizontal speed
export const RUN_ACCEL = 70; // ground acceleration toward target speed
export const AIR_ACCEL = 42; // weaker control in the air
export const GROUND_FRICTION = 64; // deceleration when no input on ground
export const AIR_FRICTION = 8;

export const JUMP_SPEED = 16.2; // initial upward velocity → ~3.1 tiles peak
export const JUMP_CUT = 0.45; // velocity kept when the jump key is released early
export const COYOTE_TIME = 0.09; // grace after leaving a ledge
export const JUMP_BUFFER = 0.11; // grace when pressing jump just before landing

export const STOMP_BOUNCE = 12; // upward kick after stomping an enemy
export const SPRING_SPEED = 23; // launch velocity from a spring → ~6 tiles

export const ENEMY_SPEED = 3.0;

// Player hitbox, a touch smaller than a tile so corners feel forgiving.
export const PLAYER_W = 0.68;
export const PLAYER_H = 0.9;

export const ENEMY_W = 0.8;
export const ENEMY_H = 0.8;

// Falling below this many tiles past the floor counts as falling into a pit.
export const PIT_MARGIN = 3;
