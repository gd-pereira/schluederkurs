import {
  PLAYER_FOOT_H,
  PLAYER_FOOT_W,
  PLAYER_START_X,
  PLAYER_START_Y,
  WALL_THICKNESS,
  WORLD_H,
  WORLD_W,
} from './constants'
import type { AABB } from './types'

/** 0 = walkable, 1 = solid. World-space sampling maps into this grid. */
export type CollisionMask = {
  width: number
  height: number
  solid: Uint8Array
}

const ALPHA_SOLID = 128

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

/** Room border walls — used until a painted mask PNG is available. */
export function createBorderMask(
  width = WORLD_W,
  height = WORLD_H,
  thickness = WALL_THICKNESS,
): CollisionMask {
  const solid = new Uint8Array(width * height)
  const t = Math.max(1, Math.round((thickness * width) / WORLD_W))
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (x < t || y < t || x >= width - t || y >= height - t) {
        solid[y * width + x] = 1
      }
    }
  }
  return { width, height, solid }
}

export function cloneMask(mask: CollisionMask): CollisionMask {
  return {
    width: mask.width,
    height: mask.height,
    solid: new Uint8Array(mask.solid),
  }
}

function worldToMask(
  mask: CollisionMask,
  wx: number,
  wy: number,
): { mx: number; my: number } {
  const mx = clamp(Math.floor((wx / WORLD_W) * mask.width), 0, mask.width - 1)
  const my = clamp(Math.floor((wy / WORLD_H) * mask.height), 0, mask.height - 1)
  return { mx, my }
}

export function solidAt(mask: CollisionMask, wx: number, wy: number): boolean {
  if (wx < 0 || wy < 0 || wx >= WORLD_W || wy >= WORLD_H) return true
  const { mx, my } = worldToMask(mask, wx, wy)
  return mask.solid[my * mask.width + mx] === 1
}

function footSamplePoints(foot: AABB): Array<{ x: number; y: number }> {
  const inset = 1
  const x0 = foot.x + inset
  const y0 = foot.y + inset
  const x1 = foot.x + foot.w - 1 - inset
  const y1 = foot.y + foot.h - 1 - inset
  const cx = foot.x + foot.w / 2
  const cy = foot.y + foot.h / 2
  return [
    { x: x0, y: y0 },
    { x: x1, y: y0 },
    { x: x0, y: y1 },
    { x: x1, y: y1 },
    { x: cx, y: cy },
  ]
}

export function footBlocked(mask: CollisionMask, foot: AABB): boolean {
  for (const p of footSamplePoints(foot)) {
    if (solidAt(mask, p.x, p.y)) return true
  }
  return false
}

/**
 * Nearest clear foot top-left to a preferred spawn (spiral search).
 * Used so the player never starts inside painted solids.
 */
export function findClearFootSpawn(
  mask: CollisionMask,
  preferX = PLAYER_START_X,
  preferY = PLAYER_START_Y,
  footW = PLAYER_FOOT_W,
  footH = PLAYER_FOOT_H,
): { x: number; y: number } {
  const minX = 0
  const minY = 0
  const maxX = WORLD_W - footW
  const maxY = WORLD_H - footH
  const originX = clamp(preferX, minX, maxX)
  const originY = clamp(preferY, minY, maxY)

  const probe: AABB = { x: originX, y: originY, w: footW, h: footH }
  if (!footBlocked(mask, probe)) return { x: originX, y: originY }

  const step = 8
  const maxRing = Math.ceil(Math.max(WORLD_W, WORLD_H) / step)

  for (let ring = 1; ring <= maxRing; ring++) {
    for (let dy = -ring; dy <= ring; dy++) {
      for (let dx = -ring; dx <= ring; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== ring) continue
        const x = clamp(originX + dx * step, minX, maxX)
        const y = clamp(originY + dy * step, minY, maxY)
        probe.x = x
        probe.y = y
        if (!footBlocked(mask, probe)) return { x, y }
      }
    }
  }

  // Last resort: open border-mask center (should be walkable)
  return { x: originX, y: originY }
}


/**
 * How far (px) to auto-nudge perpendicular when a step hits a tiny mask bump.
 * Lets the foot glide past 1–few-pixel snags instead of locking in place.
 */
const CORNER_SLIDE_PX = 10

/**
 * If a single axis step is blocked, try small perpendicular offsets so the
 * foot can slip past painted jaggies / single-pixel hooks.
 */
function tryCornerSlide(
  foot: AABB,
  step: number,
  axis: 'x' | 'y',
  mask: CollisionMask,
): AABB | null {
  for (let dist = 1; dist <= CORNER_SLIDE_PX; dist++) {
    for (const sign of [1, -1] as const) {
      const nudged: AABB = { ...foot }
      if (axis === 'x') nudged.y += sign * dist
      else nudged.x += sign * dist

      if (footBlocked(mask, nudged)) continue

      const advanced: AABB = { ...nudged }
      if (axis === 'x') advanced.x += step
      else advanced.y += step

      if (!footBlocked(mask, advanced)) return advanced
    }
  }
  return null
}

/** Advance one axis with substeps + optional corner-slide assist. */
function moveAxis(
  foot: AABB,
  delta: number,
  axis: 'x' | 'y',
  mask: CollisionMask,
  allowSlide: boolean,
): AABB {
  if (delta === 0) return foot

  const next: AABB = { ...foot }
  const steps = Math.max(1, Math.ceil(Math.abs(delta)))
  const step = delta / steps

  for (let i = 0; i < steps; i++) {
    const beforeX = next.x
    const beforeY = next.y
    if (axis === 'x') next.x += step
    else next.y += step

    if (!footBlocked(mask, next)) continue

    next.x = beforeX
    next.y = beforeY
    if (!allowSlide) break

    const slid = tryCornerSlide(next, step, axis, mask)
    if (!slid) break
    next.x = slid.x
    next.y = slid.y
  }

  return next
}

/**
 * Move foot by dx/dy against a painted mask.
 * Resolves X then Y with substeps and corner-slide so small mask bumps
 * don't pin the player. Corner-slide is disabled when both axes have input
 * so pressing into a wall while strafing can't inject extra sideways travel
 * (the "surf speed-up"). Path length is also capped to the intended move.
 */
export function resolveMoveMask(
  foot: AABB,
  dx: number,
  dy: number,
  mask: CollisionMask,
): AABB {
  // Only corner-slide on near-pure axis moves. Diagonal / into-wall + strafe
  // uses plain slide-along-wall so assists can't stack into a speed boost.
  const slideX = Math.abs(dy) < 1e-6
  const slideY = Math.abs(dx) < 1e-6

  let next = moveAxis(foot, dx, 'x', mask, slideX)
  next = moveAxis(next, dy, 'y', mask, slideY)

  const movedX = next.x - foot.x
  const movedY = next.y - foot.y
  const movedLen = Math.hypot(movedX, movedY)
  const intentLen = Math.hypot(dx, dy)
  if (movedLen > intentLen && intentLen > 1e-6) {
    const scale = intentLen / movedLen
    const capped: AABB = {
      ...next,
      x: foot.x + movedX * scale,
      y: foot.y + movedY * scale,
    }
    if (!footBlocked(mask, capped)) return capped
  }

  return next
}

/** Paint a disc in world space (for in-game authoring). */
export function stampMask(
  mask: CollisionMask,
  wx: number,
  wy: number,
  radiusWorld: number,
  value: 0 | 1,
) {
  const r = Math.max(1, radiusWorld)
  const { mx: cx, my: cy } = worldToMask(mask, wx, wy)
  const rx = Math.max(1, Math.ceil((r / WORLD_W) * mask.width))
  const ry = Math.max(1, Math.ceil((r / WORLD_H) * mask.height))
  const x0 = clamp(cx - rx, 0, mask.width - 1)
  const x1 = clamp(cx + rx, 0, mask.width - 1)
  const y0 = clamp(cy - ry, 0, mask.height - 1)
  const y1 = clamp(cy + ry, 0, mask.height - 1)
  const rx2 = rx * rx
  const ry2 = ry * ry || 1

  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const dx = x - cx
      const dy = y - cy
      if (dx * dx / rx2 + dy * dy / ry2 <= 1) {
        mask.solid[y * mask.width + x] = value
      }
    }
  }
}

/**
 * Decode PNG (or any drawable) into a collision mask.
 * Opaque / bright pixels = solid. Transparent / dark = walkable.
 */
export async function loadCollisionMask(
  url: string,
): Promise<CollisionMask | null> {
  try {
    const img = await loadImage(url)
    const width = img.naturalWidth || img.width
    const height = img.naturalHeight || img.height
    if (width < 1 || height < 1) return null

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return null
    ctx.drawImage(img, 0, 0)
    const { data } = ctx.getImageData(0, 0, width, height)
    const solid = new Uint8Array(width * height)
    for (let i = 0, p = 0; i < solid.length; i++, p += 4) {
      const r = data[p]!
      const a = data[p + 3]!
      solid[i] = a >= ALPHA_SOLID || r >= ALPHA_SOLID ? 1 : 0
    }
    return { width, height, solid }
  } catch {
    return null
  }
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load ${url}`))
    img.src = url
  })
}

/** Rasterize mask to a PNG blob for download / paste into public/assets. */
export function maskToPngBlob(mask: CollisionMask): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = mask.width
  canvas.height = mask.height
  const ctx = canvas.getContext('2d')
  if (!ctx) return Promise.reject(new Error('No 2d context'))
  const image = ctx.createImageData(mask.width, mask.height)
  for (let i = 0; i < mask.solid.length; i++) {
    const on = mask.solid[i] === 1
    const p = i * 4
    image.data[p] = on ? 255 : 0
    image.data[p + 1] = on ? 255 : 0
    image.data[p + 2] = on ? 255 : 0
    image.data[p + 3] = on ? 255 : 0
  }
  ctx.putImageData(image, 0, 0)
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('toBlob failed'))
    }, 'image/png')
  })
}

/** Draw mask into a canvas sized to the world (for overlay). */
export function paintMaskToCanvas(
  canvas: HTMLCanvasElement,
  mask: CollisionMask,
) {
  if (canvas.width !== WORLD_W || canvas.height !== WORLD_H) {
    canvas.width = WORLD_W
    canvas.height = WORLD_H
  }
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.clearRect(0, 0, WORLD_W, WORLD_H)

  const tmp = document.createElement('canvas')
  tmp.width = mask.width
  tmp.height = mask.height
  const tctx = tmp.getContext('2d')
  if (!tctx) return
  const image = tctx.createImageData(mask.width, mask.height)
  for (let i = 0; i < mask.solid.length; i++) {
    const on = mask.solid[i] === 1
    const p = i * 4
    image.data[p] = 255
    image.data[p + 1] = 64
    image.data[p + 2] = 96
    image.data[p + 3] = on ? 200 : 0
  }
  tctx.putImageData(image, 0, 0)
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(tmp, 0, 0, WORLD_W, WORLD_H)
}
