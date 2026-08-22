import { WALL_THICKNESS, WORLD_H, WORLD_W } from './constants'
import type { AABB, Interactable, Prop } from './types'

export function createWalls(): AABB[] {
  const t = WALL_THICKNESS
  return [
    { x: 0, y: 0, w: WORLD_W, h: t }, // top
    { x: 0, y: WORLD_H - t, w: WORLD_W, h: t }, // bottom
    { x: 0, y: 0, w: t, h: WORLD_H }, // left
    { x: WORLD_W - t, y: 0, w: t, h: WORLD_H }, // right
  ]
}

/** Tall crate: large sprite, small foot at base for collision / Y-sort */
export function createPlaceholderCrate(): Prop {
  const footW = 60
  const footH = 40
  const spriteW = 80
  const spriteH = 120
  const footX = 900
  const footY = 400

  return {
    id: 'crate',
    foot: { x: footX, y: footY, w: footW, h: footH },
    sprite: {
      x: footX + (footW - spriteW) / 2,
      y: footY + footH - spriteH,
      w: spriteW,
      h: spriteH,
    },
    color: '#8b6914',
  }
}

/** Local lever stub — left of center, distinct from crate */
export function createLeverProp(): Interactable {
  const footW = 36
  const footH = 28
  const spriteW = 48
  const spriteH = 100
  const footX = 380
  const footY = 420

  return {
    id: 'lever',
    taskId: 'lever',
    foot: { x: footX, y: footY, w: footW, h: footH },
    sprite: {
      x: footX + (footW - spriteW) / 2,
      y: footY + footH - spriteH,
      w: spriteW,
      h: spriteH,
    },
    color: '#c45c26',
  }
}

/** Floor wrench pickup — south of spawn */
export function createWrenchProp(): Interactable {
  const footW = 28
  const footH = 20
  const spriteW = 40
  const spriteH = 36
  const footX = 560
  const footY = 520

  return {
    id: 'wrench',
    taskId: 'wrench',
    foot: { x: footX, y: footY, w: footW, h: footH },
    sprite: {
      x: footX + (footW - spriteW) / 2,
      y: footY + footH - spriteH,
      w: spriteW,
      h: spriteH,
    },
    color: '#7a8a9a',
  }
}

/** Vase on pedestal — upper mid-left */
export function createVaseProp(): Interactable {
  const footW = 44
  const footH = 32
  const spriteW = 56
  const spriteH = 110
  const footX = 220
  const footY = 280

  return {
    id: 'vase',
    taskId: 'vase',
    foot: { x: footX, y: footY, w: footW, h: footH },
    sprite: {
      x: footX + (footW - spriteW) / 2,
      y: footY + footH - spriteH,
      w: spriteW,
      h: spriteH,
    },
    color: '#6b3d8f',
  }
}

/** Locker — right side, grants fuse after keypad */
export function createLockerProp(): Interactable {
  const footW = 52
  const footH = 36
  const spriteW = 64
  const spriteH = 120
  const footX = 1050
  const footY = 300

  return {
    id: 'locker',
    taskId: 'locker',
    foot: { x: footX, y: footY, w: footW, h: footH },
    sprite: {
      x: footX + (footW - spriteW) / 2,
      y: footY + footH - spriteH,
      w: spriteW,
      h: spriteH,
    },
    color: '#3d5a4c',
  }
}

/** Fuse / breaker panel — near lever */
export function createFusePanelProp(): Interactable {
  const footW = 48
  const footH = 32
  const spriteW = 60
  const spriteH = 100
  const footX = 480
  const footY = 250

  return {
    id: 'fuse',
    taskId: 'fuse',
    foot: { x: footX, y: footY, w: footW, h: footH },
    sprite: {
      x: footX + (footW - spriteW) / 2,
      y: footY + footH - spriteH,
      w: spriteW,
      h: spriteH,
    },
    color: '#b45309',
  }
}

/** Gate bypass console — bottom center-ish */
export function createBypassProp(): Interactable {
  const footW = 70
  const footH = 40
  const spriteW = 90
  const spriteH = 80
  const footX = 700
  const footY = 560

  return {
    id: 'bypass',
    taskId: 'bypass',
    foot: { x: footX, y: footY, w: footW, h: footH },
    sprite: {
      x: footX + (footW - spriteW) / 2,
      y: footY + footH - spriteH,
      w: spriteW,
      h: spriteH,
    },
    color: '#1e3a5f',
  }
}

export function createWorldSolids(props: readonly Prop[]): AABB[] {
  return [...createWalls(), ...props.map((p) => p.foot)]
}
