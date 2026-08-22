import type { AABB, Interactable, Vec2 } from './types'

export function footCenter(foot: AABB): Vec2 {
  return {
    x: foot.x + foot.w / 2,
    y: foot.y + foot.h / 2,
  }
}

export function distance(a: Vec2, b: Vec2): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

/** Distance from a point to the closest point on an AABB */
export function distanceToAabb(point: Vec2, box: AABB): number {
  const cx = Math.max(box.x, Math.min(point.x, box.x + box.w))
  const cy = Math.max(box.y, Math.min(point.y, box.y + box.h))
  return Math.hypot(point.x - cx, point.y - cy)
}

/** Nearest interactable within radius, or null */
export function findNearestInteractable(
  playerFoot: AABB,
  list: readonly Interactable[],
  radius: number,
): Interactable | null {
  const origin = footCenter(playerFoot)
  let best: Interactable | null = null
  let bestDist = radius

  for (const item of list) {
    const d = distanceToAabb(origin, item.foot)
    if (d <= bestDist) {
      best = item
      bestDist = d
    }
  }

  return best
}
