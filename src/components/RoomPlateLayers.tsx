import { useAssetReady } from '../hooks/useAssetReady'
import { roomPlateUrl } from '../game/assets'
import type { PodId } from '../net/matchEvents'

type RoomPlateLayersProps = {
  pod: PodId
}

/** Locked base plate only — never swaps for state. */
export default function RoomPlateLayers({ pod }: RoomPlateLayersProps) {
  const baseUrl = roomPlateUrl(pod)
  const baseReady = useAssetReady(baseUrl)
  if (!baseReady) return null

  return (
    <div
      className="pointer-events-none absolute inset-0 z-0"
      style={{
        backgroundImage: `url(${baseUrl})`,
        backgroundSize: '100% 100%',
        backgroundPosition: '0 0',
        backgroundRepeat: 'no-repeat',
      }}
      aria-hidden
    />
  )
}
