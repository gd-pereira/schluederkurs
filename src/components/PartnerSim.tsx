type PartnerSimProps = {
  enabled: boolean
  partnerLeverDone: boolean
  onPartnerLever: () => void
}

export default function PartnerSim({
  enabled,
  partnerLeverDone,
  onPartnerLever,
}: PartnerSimProps) {
  if (!enabled) return null

  return (
    <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
      <span className="text-xs uppercase tracking-wider text-neutral-500">
        Solo sim
      </span>
      <button
        type="button"
        disabled={partnerLeverDone}
        onClick={onPartnerLever}
        className="rounded border border-neutral-600 bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-neutral-200 hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {partnerLeverDone ? 'Partner lever done' : 'Partner pulled lever'}
      </button>
    </div>
  )
}
