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
    const d = distance(origin, footCenter(item.foot))
    if (d <= bestDist) {
      best = item
      bestDist = d
    }
  }

  return best
}
