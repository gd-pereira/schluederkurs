import { useEffect, useState } from 'react'

/**
 * Scale a fixed design size (e.g. 1280×720) to fit the viewport while
 * preserving aspect ratio. Letterboxing is intentional cinema-style.
 */
export function useFitScale(
  designW: number,
  designH: number,
  paddingPx = 16,
): number {
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const update = () => {
      const availW = Math.max(1, window.innerWidth - paddingPx * 2)
      const availH = Math.max(1, window.innerHeight - paddingPx * 2)
      setScale(Math.min(availW / designW, availH / designH))
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [designW, designH, paddingPx])

  return scale
}
