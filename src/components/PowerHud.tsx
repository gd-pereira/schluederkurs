type PowerHudProps = {
  visible: boolean
  free: number
  reservePartner: number
}

export default function PowerHud({
  visible,
  free,
  reservePartner,
}: PowerHudProps) {
  if (!visible) return null

  const freeClamped = Math.max(0, Math.min(100, free))
  const partnerClamped = Math.max(0, Math.min(100, reservePartner))

  return (
    <div className="pointer-events-none absolute right-3 top-3 z-[10040] w-44 rounded border border-neutral-600 bg-black/75 px-3 py-2 text-xs text-neutral-200">
      <p className="mb-2 font-semibold uppercase tracking-wider text-neutral-400">
        Shared grid
      </p>
      <div className="space-y-2">
        <div>
          <div className="mb-0.5 flex justify-between">
            <span>Free</span>
            <span>{freeClamped}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded bg-neutral-800">
            <div
              className="h-full bg-teal-400 transition-[width] duration-200"
              style={{ width: `${freeClamped}%` }}
            />
          </div>
        </div>
        <div>
          <div className="mb-0.5 flex justify-between">
            <span>Partner reserved</span>
            <span>{partnerClamped}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded bg-neutral-800">
            <div
              className="h-full bg-amber-400 transition-[width] duration-200"
              style={{ width: `${partnerClamped}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
