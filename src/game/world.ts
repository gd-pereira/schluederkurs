import { WALL_THICKNESS, WORLD_H, WORLD_W } from './constants'
import type { AABB, Interactable, Prop } from './types'

export function createWalls(): AABB[] {
  const t = WALL_THICKNESS
  return [
    { x: 0, y: 0, w: WORLD_W, h: t },
    { x: 0, y: WORLD_H - t, w: WORLD_W, h: t },
    { x: 0, y: 0, w: t, h: WORLD_H },
    { x: WORLD_W - t, y: 0, w: t, h: WORLD_H },
  ]
}

/** Invisible interact hotspot — sprite box used for [E] prompt anchor only */
function hotspot(
  id: string,
  taskId: string,
  footX: number,
  footY: number,
  footW: number,
  footH: number,
  promptH = 80,
): Interactable {
  return {
    id,
    taskId,
    foot: { x: footX, y: footY, w: footW, h: footH },
    sprite: {
      x: footX + footW / 2 - 20,
      y: footY + footH - promptH,
      w: 40,
      h: promptH,
    },
    color: 'transparent',
  }
}

/** Collision for plate-baked furniture / mid-room islands (Pod A) */
export function furnitureSolidsA(): AABB[] {
  return [
    { x: 60, y: 470, w: 150, h: 100 }, // BL crates
    { x: 980, y: 480, w: 200, h: 110 }, // BR spools
    { x: 80, y: 190, w: 90, h: 70 }, // left wall panels
    { x: 200, y: 200, w: 55, h: 40 }, // vase pedestal base
    { x: 320, y: 330, w: 70, h: 50 }, // lever station base
    { x: 1040, y: 250, w: 80, h: 60 }, // locker bay
    { x: 520, y: 540, w: 200, h: 55 }, // bypass console bank
    { x: 480, y: 300, w: 160, h: 50 }, // mid cable island
    { x: 680, y: 340, w: 140, h: 45 }, // mid pipe island
    { x: 500, y: 160, w: 240, h: 40 }, // back pipe ledge
  ]
}

export function furnitureSolidsB(): AABB[] {
  return [
    { x: 60, y: 490, w: 170, h: 95 }, // cart / barrels
    { x: 980, y: 490, w: 200, h: 100 }, // BR clutter
    { x: 100, y: 250, w: 90, h: 70 }, // grimy wall base
    { x: 360, y: 320, w: 70, h: 50 }, // lever station
    { x: 1040, y: 250, w: 80, h: 55 }, // painting bay
    { x: 520, y: 540, w: 200, h: 55 }, // bypass bank
    { x: 500, y: 300, w: 180, h: 55 }, // mid platform
    { x: 700, y: 360, w: 120, h: 40 }, // mid cables
    { x: 480, y: 160, w: 240, h: 40 }, // back ledge
  ]
}

export function createWorldSolids(
  props: readonly Prop[],
  extra: readonly AABB[] = [],
): AABB[] {
  return [...createWalls(), ...props.map((p) => p.foot), ...extra]
}

export type PodWorld = {
  pod: 'a' | 'b'
  /** Hotspot props (invisible); used for prompts / pickup patches */
  props: Prop[]
  interactables: Interactable[]
  solids: AABB[]
  byId: Record<string, Interactable>
}

/**
 * Hotspots aligned to baked plate art (no overlay sprites).
 * Mid-room islands are collision-only in furnitureSolids*.
 */
export function createPodWorld(pod: 'a' | 'b'): PodWorld {
  if (pod === 'b') {
    const interactables = [
      hotspot('lever', 'lever', 200, 300, 40, 30),
      hotspot('rag', 'rag', 150, 500, 48, 36, 48),
      hotspot('wall', 'wall', 100, 220, 90, 36, 120),
      hotspot('keypad', 'keypad', 1050, 240, 48, 30, 100),
      hotspot('bypass', 'bypass', 540, 580, 120, 40, 70),
    ]
    const byId: Record<string, Interactable> = {}
    for (const item of interactables) byId[item.id] = item
    return {
      pod,
      props: interactables,
      interactables,
      /** Collisions disabled for now — plate art only */
      solids: [],
      byId,
    }
  }

  const interactables = [
    hotspot('lever', 'lever', 200, 300, 40, 30),
    hotspot('wrench', 'wrench', 160, 480, 56, 40, 56),
    hotspot('vase', 'vase', 200, 160, 56, 40, 130),
    hotspot('locker', 'locker', 1080, 260, 56, 36, 120),
    hotspot('fuse', 'fuse', 100, 240, 50, 34, 100),
    hotspot('bypass', 'bypass', 540, 580, 120, 40, 70),
  ]
  const byId: Record<string, Interactable> = {}
  for (const item of interactables) byId[item.id] = item
  return {
    pod,
    props: interactables,
    interactables,
    solids: [],
    byId,
  }
}
