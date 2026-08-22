type PowerHudProps = {
  visible: boolean
}

export default function PowerHud({ visible }: PowerHudProps) {
  if (!visible) return null

  return (
    <div className="pointer-events-none absolute right-3 top-3 z-[10040] w-44 rounded border border-neutral-600 bg-black/75 px-3 py-2 text-xs text-neutral-200">
      <p className="mb-2 font-semibold uppercase tracking-wider text-neutral-400">
        Shared grid
      </p>
      <div className="space-y-2">
        <div>
          <div className="mb-0.5 flex justify-between">
            <span>You</span>
            <span>50%</span>
          </div>
          <div className="h-2 overflow-hidden rounded bg-neutral-800">
            <div className="h-full w-1/2 bg-teal-400" />
          </div>
        </div>
        <div>
          <div className="mb-0.5 flex justify-between">
            <span>Partner</span>
            <span>50%</span>
          </div>
          <div className="h-2 overflow-hidden rounded bg-neutral-800">
            <div className="h-full w-1/2 bg-amber-400" />
          </div>
        </div>
      </div>
    </div>
  )
}
