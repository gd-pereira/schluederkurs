import type { AABB } from './types'

export function overlaps(a: AABB, b: AABB): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
}

/**
 * Move foot box by dx/dy against solids.
 * Resolves X then Y so the player can slide along walls.
 */
export function resolveMove(
  foot: AABB,
  dx: number,
  dy: number,
  solids: readonly AABB[],
): AABB {
  const next: AABB = { ...foot }

  if (dx !== 0) {
    next.x += dx
    for (const solid of solids) {
      if (overlaps(next, solid)) {
        if (dx > 0) next.x = solid.x - next.w
        else next.x = solid.x + solid.w
      }
    }
  }

  if (dy !== 0) {
    next.y += dy
    for (const solid of solids) {
      if (overlaps(next, solid)) {
        if (dy > 0) next.y = solid.y - next.h
        else next.y = solid.y + solid.h
      }
    }
  }

  return next
}

export function footBottom(foot: AABB): number {
  return foot.y + foot.h
}
