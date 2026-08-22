export const WORLD_W = 1280
export const WORLD_H = 720

export const WALL_THICKNESS = 32

/** Pixels per second */
export const MOVE_SPEED = 220

export const PLAYER_SPRITE_W = 64
export const PLAYER_SPRITE_H = 96
export const PLAYER_FOOT_W = 28
export const PLAYER_FOOT_H = 16

/** Spawn: foot top-left near center */
export const PLAYER_START_X = WORLD_W / 2 - PLAYER_FOOT_W / 2
export const PLAYER_START_Y = WORLD_H / 2 - PLAYER_FOOT_H / 2

/** Soft-edge radius of the flashlight hole (px) */
export const FLASHLIGHT_RADIUS = 168

/** Interact radius around footprints (px) */
export const INTERACT_RADIUS = 80

/** Gate slam overlay duration */
export const GATE_SLAM_MS = 900

/** Hold after blackout before play (AI toast window) */
export const BLACKOUT_HOLD_MS = 400

/** Pod B keypad reserve while open */
export const KEYPAD_RESERVE = 80

/** Pod A fuse install reserve while open */
export const FUSE_RESERVE = 70

/** Dual bypass hold window (ms) */
export const GATE_SYNC_MS = 1200

/** Lights hysteresis thresholds (free power %) */
export const LIGHT_OFF_BELOW = 25
export const LIGHT_ON_ABOVE = 35
