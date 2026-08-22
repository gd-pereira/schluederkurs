import { useEffect, useState } from 'react'

/**
 * Soften silhouette against transparency so cutouts don't read as hard stickers.
 * One pass: opaque pixels next to empty get partial alpha.
 */
function featherEdges(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  radius = 1.6,
): void {
  const alpha = new Uint8Array(w * h)
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    alpha[p] = data[i + 3]
  }

  const r = Math.ceil(radius)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = y * w + x
      const a = alpha[p]
      if (a === 0) continue

      let nearestEmpty = Infinity
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const nx = x + dx
          const ny = y + dy
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) {
            nearestEmpty = Math.min(nearestEmpty, Math.hypot(dx, dy))
            continue
          }
          if (alpha[ny * w + nx] === 0) {
            const dist = Math.hypot(dx, dy)
            if (dist < nearestEmpty) nearestEmpty = dist
          }
        }
      }

      if (nearestEmpty <= radius) {
        const t = nearestEmpty / radius
        // Smoothstep: keep core solid, ease only the rim
        const soft = t * t * (3 - 2 * t)
        data[p * 4 + 3] = Math.round(a * (0.35 + 0.65 * soft))
      }
    }
  }
}

/**
 * Loads a PNG, knocks near-black to transparent, then feathers the silhouette.
 * Prop cutouts were exported with opaque black instead of transparency.
 */
export function useKnockoutAsset(
  url: string | null | undefined,
  threshold = 22,
): string | null {
  const [src, setSrc] = useState<string | null>(null)

  useEffect(() => {
    if (!url) {
      setSrc(null)
      return
    }

    let cancelled = false
    let objectUrl: string | null = null
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => {
      if (cancelled) return
      try {
        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          setSrc(url)
          return
        }
        ctx.drawImage(img, 0, 0)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const d = imageData.data
        const softBand = 18
        for (let i = 0; i < d.length; i += 4) {
          const max = Math.max(d[i], d[i + 1], d[i + 2])
          if (max <= threshold) {
            d[i + 3] = 0
          } else if (max < threshold + softBand && d[i + 3] > 0) {
            // Soft fringe on near-black anti-alias instead of a hard cut
            const t = (max - threshold) / softBand
            d[i + 3] = Math.round(d[i + 3] * t * t * (3 - 2 * t))
          }
        }
        featherEdges(d, canvas.width, canvas.height, 1.75)
        ctx.putImageData(imageData, 0, 0)
        canvas.toBlob((blob) => {
          if (cancelled || !blob) return
          objectUrl = URL.createObjectURL(blob)
          setSrc(objectUrl)
        }, 'image/png')
      } catch {
        if (!cancelled) setSrc(url)
      }
    }
    img.onerror = () => {
      if (!cancelled) setSrc(null)
    }
    img.src = url

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [url, threshold])

  return src
}
