type PartnerSimProps = {
  enabled: boolean
  partnerLeverDone: boolean
  onPartnerLever: () => void
  gridOn: boolean
  wallWiped: boolean
  onPartnerWipe: () => void
  codeKnown: boolean
  keypadDone: boolean
  partnerKeypadOpen: boolean
  onPartnerKeypadOpen: () => void
  onPartnerKeypadFinish: () => void
}

export default function PartnerSim({
  enabled,
  partnerLeverDone,
  onPartnerLever,
  gridOn,
  wallWiped,
  onPartnerWipe,
  codeKnown,
  keypadDone,
  partnerKeypadOpen,
  onPartnerKeypadOpen,
  onPartnerKeypadFinish,
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
      <button
        type="button"
        disabled={!gridOn || wallWiped}
        onClick={onPartnerWipe}
        className="rounded border border-neutral-600 bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-neutral-200 hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {wallWiped ? 'Wall wiped' : 'Partner wiped wall'}
      </button>
      {!partnerKeypadOpen && !keypadDone && (
        <button
          type="button"
          disabled={!codeKnown}
          onClick={onPartnerKeypadOpen}
          className="rounded border border-neutral-600 bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-neutral-200 hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Partner opens keypad (80%)
        </button>
      )}
      {partnerKeypadOpen && !keypadDone && (
        <button
          type="button"
          onClick={onPartnerKeypadFinish}
          className="rounded border border-amber-600/80 bg-amber-950/50 px-3 py-1.5 text-xs font-semibold text-amber-200 hover:bg-amber-900/60"
        >
          Partner finishes keypad
        </button>
      )}
      {keypadDone && (
        <span className="rounded border border-neutral-700 px-3 py-1.5 text-xs text-neutral-500">
          Keypad done
        </span>
      )}
    </div>
  )
}
