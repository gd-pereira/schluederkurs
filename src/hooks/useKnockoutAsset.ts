import { useEffect, useState } from 'react'

/**
 * Loads a PNG and knocks near-black pixels to alpha 0.
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
        for (let i = 0; i < d.length; i += 4) {
          if (d[i] <= threshold && d[i + 1] <= threshold && d[i + 2] <= threshold) {
            d[i + 3] = 0
          }
        }
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
