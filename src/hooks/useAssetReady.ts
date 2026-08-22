import { useEffect, useState } from 'react'

/** True only after the image loads successfully; false if missing/broken. */
export function useAssetReady(url: string | null | undefined): boolean {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!url) {
      setReady(false)
      return
    }
    let cancelled = false
    setReady(false)
    const img = new Image()
    img.onload = () => {
      if (!cancelled) setReady(true)
    }
    img.onerror = () => {
      if (!cancelled) setReady(false)
    }
    img.src = url
    return () => {
      cancelled = true
    }
  }, [url])

  return ready
}
