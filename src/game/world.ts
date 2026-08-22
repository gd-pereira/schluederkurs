import type { AABB, Interactable, Prop } from './types'

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

export type PodWorld = {
  pod: 'a' | 'b'
  /** Hotspot props (invisible); used for prompts / pickup patches */
  props: Prop[]
  interactables: Interactable[]
  byId: Record<string, Interactable>
}

/**
 * Hotspots aligned to baked plate art (no overlay sprites).
 * Walking collision uses painted masks: public/assets/pod_{a|b}_collision.png
 * (see CollisionMaskTool — press C in-game).
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
      byId,
    }
  }

  const interactables = [
    hotspot('lever', 'lever', 200, 300, 40, 30),
    // Pins from in-game P placer (top-left → bottom-right rects)
    overlay('wrench', 'wrench', { x: 300, y: 418, w: 128, h: 58 }),
    overlay(
      'vase',
      'vase',
      { x: 249, y: 111, w: 79, h: 45 },
      { x: 230, y: 100, w: 110, h: 70 },
    ),
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
    byId,
  }
}
