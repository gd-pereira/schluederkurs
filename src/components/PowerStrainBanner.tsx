/**
 * Full-width strip when the grid is online but lights are dead because
 * someone is drawing power — makes the tug-of-war impossible to miss.
 */
export default function PowerStrainBanner({
  visible,
  free,
  reservePartner,
  reserveYou,
  partnerDevice,
  youDevice,
}: {
  visible: boolean
  free: number
  reservePartner: number
  reserveYou: number
  partnerDevice: string | null
  youDevice: string | null
}) {
  if (!visible) return null

  const cause =
    reservePartner > 0
      ? `Partner drawing ${reservePartner}%${partnerDevice ? ` (${partnerDevice})` : ''}`
      : reserveYou > 0
        ? `You drawing ${reserveYou}%${youDevice ? ` (${youDevice})` : ''}`
        : 'Free power too low'

  return (
    <div className="facility-strain absolute left-1/2 top-3 z-[10045] w-[min(92%,28rem)] -translate-x-1/2 px-4 py-2">
      <p className="font-[family-name:var(--font-game-ui)] text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-red-300">
        Facility brownout
      </p>
      <p className="mt-0.5 font-[family-name:var(--font-game-ui)] text-lg font-semibold leading-none tracking-[0.04em] text-red-100">
        Lights dead · {free}% free · flashlight only
      </p>
      <p className="mt-1 text-[11px] text-red-200/75">{cause}</p>
    </div>
  )
}
