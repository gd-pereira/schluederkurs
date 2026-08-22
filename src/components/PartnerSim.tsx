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
  partnerReserve: number
  onPartnerYield: () => void
  fuseInstalled: boolean
  partnerBypassHeld: boolean
  onPartnerBypassHold: (held: boolean) => void
  escaped: boolean
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
  partnerReserve,
  onPartnerYield,
  fuseInstalled,
  partnerBypassHeld,
  onPartnerBypassHold,
  escaped,
}: PartnerSimProps) {
  if (!enabled || escaped) return null

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
      <button
        type="button"
        disabled={partnerReserve <= 0}
        onClick={onPartnerYield}
        className="rounded border border-neutral-600 bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-neutral-200 hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Partner yields power
      </button>
      {fuseInstalled && (
        <button
          type="button"
          className={`select-none rounded border px-3 py-1.5 text-xs font-semibold ${
            partnerBypassHeld
              ? 'border-amber-500 bg-amber-900/50 text-amber-100'
              : 'border-neutral-600 bg-neutral-900 text-neutral-200 hover:bg-neutral-800'
          }`}
          onPointerDown={(e) => {
            e.preventDefault()
            ;(e.target as HTMLButtonElement).setPointerCapture(e.pointerId)
            onPartnerBypassHold(true)
          }}
          onPointerUp={() => onPartnerBypassHold(false)}
          onPointerCancel={() => onPartnerBypassHold(false)}
          onLostPointerCapture={() => onPartnerBypassHold(false)}
        >
          {partnerBypassHeld ? 'Partner holding bypass…' : 'Hold partner bypass'}
        </button>
      )}
    </div>
  )
}
