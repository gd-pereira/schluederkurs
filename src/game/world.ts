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

/**
 * Visible overlay prop: sprite = placement slot on the 1280×720 plate.
 * Foot is derived for interact / Y-sort (override with foot if needed).
 */
function overlay(
  id: string,
  taskId: string,
  sprite: AABB,
  foot?: Partial<AABB>,
): Interactable {
  const footW = foot?.w ?? Math.max(24, Math.round(sprite.w * 0.55))
  const footH = foot?.h ?? 22
  const footX = foot?.x ?? Math.round(sprite.x + (sprite.w - footW) / 2)
  const footY = foot?.y ?? Math.round(sprite.y + sprite.h - footH)
  return {
    id,
    taskId,
    sprite,
    foot: { x: footX, y: footY, w: footW, h: footH },
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
    { x: 70, y: 500, w: 160, h: 90 }, // BL service cart
    { x: 1080, y: 560, w: 90, h: 50 }, // BR pipe stub
    { x: 70, y: 220, w: 80, h: 90 }, // left grimy panel base
    { x: 340, y: 340, w: 80, h: 55 }, // red lever pedestal
    { x: 1060, y: 230, w: 90, h: 70 }, // painting bay
    { x: 520, y: 540, w: 220, h: 60 }, // bypass console
    { x: 560, y: 300, w: 100, h: 90 }, // center barrels
    { x: 780, y: 340, w: 110, h: 70 }, // mid-right valve assembly
    { x: 480, y: 150, w: 280, h: 45 }, // back gate ledge
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
      // Pins from in-game P placer (Pod B)
      hotspot('lever', 'lever', 367, 279, 45, 65),
      // Rag: slot center = visual center (OverlaySprite bottom-centers display on slot)
      overlay(
        'rag',
        'rag',
        { x: 107, y: 518, w: 20, h: 41 },
        { x: 80, y: 497, w: 101, h: 116 },
      ),
      // Wall: foot = placement slot (no tall prompt offset)
      overlay(
        'wall',
        'wall',
        { x: 71, y: 305, w: 43, h: 52 },
        { x: 71, y: 305, w: 43, h: 52 },
      ),
      hotspot('keypad', 'keypad', 1054, 97, 29, 39, 110),
      // Gate bypass console (bottom center, green screen)
      hotspot('bypass', 'bypass', 560, 575, 130, 40, 70),
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
    // Pins from in-game P placer (top-left → bottom-right rects)
    overlay('wrench', 'wrench', { x: 300, y: 418, w: 128, h: 58 }),
    overlay('vase', 'vase', { x: 249, y: 111, w: 79, h: 45 }),
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
