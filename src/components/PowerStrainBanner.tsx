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
    <div className="pointer-events-none absolute left-1/2 top-3 z-[10045] w-[min(92%,28rem)] -translate-x-1/2 rounded border border-red-500/60 bg-red-950/90 px-4 py-2 text-center shadow-lg">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-red-300">
        Facility brownout
      </p>
      <p className="mt-0.5 text-sm font-semibold text-red-100">
        Lights dead · {free}% free · flashlight only
      </p>
      <p className="mt-0.5 text-[11px] text-red-200/80">{cause}</p>
    </div>
  )
}
