type PowerHudProps = {
  visible: boolean
  free: number
  reserveYou: number
  reservePartner: number
}

export default function PowerHud({
  visible,
  free,
  reserveYou,
  reservePartner,
}: PowerHudProps) {
  if (!visible) return null

  const freeClamped = Math.max(0, Math.min(100, free))
  const youClamped = Math.max(0, Math.min(100, reserveYou))
  const partnerClamped = Math.max(0, Math.min(100, reservePartner))

  return (
    <div className="pointer-events-none absolute right-3 top-3 z-[10040] w-48 rounded border border-neutral-600 bg-black/75 px-3 py-2 text-xs text-neutral-200">
      <p className="mb-2 font-semibold uppercase tracking-wider text-neutral-400">
        Shared grid
      </p>
      <div className="space-y-2">
        <Bar label="Free" value={freeClamped} colorClass="bg-teal-400" />
        <Bar label="You reserved" value={youClamped} colorClass="bg-sky-400" />
        <Bar
          label="Partner reserved"
          value={partnerClamped}
          colorClass="bg-amber-400"
        />
      </div>
    </div>
  )
}

function Bar({
  label,
  value,
  colorClass,
}: {
  label: string
  value: number
  colorClass: string
}) {
  return (
    <div>
      <div className="mb-0.5 flex justify-between">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded bg-neutral-800">
        <div
          className={`h-full transition-[width] duration-200 ${colorClass}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}
