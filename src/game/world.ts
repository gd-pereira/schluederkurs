import { WALL_THICKNESS, WORLD_H, WORLD_W } from './constants'
import type { AABB, Prop } from './types'

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

export function createWorldSolids(props: readonly Prop[]): AABB[] {
  return [...createWalls(), ...props.map((p) => p.foot)]
}
