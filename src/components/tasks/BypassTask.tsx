import { GATE_SYNC_MS } from '../../game/constants'

type BypassTaskProps = {
  localHeld: boolean
  partnerHeld: boolean
  syncProgress: number
  onHoldChange: (held: boolean) => void
  solo: boolean
  /** Pod A sees the sync bar; Pod B only hears tone cues */
  showSyncBar: boolean
}

export default function BypassTask({
  localHeld,
  partnerHeld,
  syncProgress,
  onHoldChange,
  solo,
  showSyncBar,
}: BypassTaskProps) {
  const both = localHeld && partnerHeld
  const pct = Math.min(100, Math.round(syncProgress * 100))

  return (
    <div>
      <p className="text-sm leading-relaxed text-neutral-700">
        Dual bypass. Both pods must hold — let go and the window resets.
      </p>

      <div className="mt-4 space-y-2 text-xs text-neutral-600">
        <p>
          You:{' '}
          <span className={localHeld ? 'font-bold text-teal-700' : ''}>
            {localHeld ? 'HOLDING' : 'released'}
          </span>
        </p>
        <p>
          Partner:{' '}
          <span className={partnerHeld ? 'font-bold text-amber-700' : ''}>
            {partnerHeld ? 'HOLDING' : 'released'}
          </span>
        </p>
      </div>

      {showSyncBar ? (
        <>
          <div className="mt-3 h-3 overflow-hidden rounded bg-neutral-300">
            <div
              className={`h-full transition-[width] duration-75 ${
                both ? 'bg-emerald-500' : 'bg-neutral-400'
              }`}
              style={{ width: `${both ? pct : 0}%` }}
            />
          </div>
          <p className="mt-1 text-center text-xs text-neutral-500">
            {both ? `${pct}% synced` : 'Waiting for both holds…'}
          </p>
        </>
      ) : (
        <p className="mt-3 text-center text-sm text-neutral-600">
          {both
            ? pct < 40
              ? 'Tone rising…'
              : pct < 80
                ? 'Tone climbing — hold!'
                : 'Almost — don’t let go!'
            : localHeld
              ? 'Waiting on partner…'
              : 'Hold when your partner is ready.'}
        </p>
      )}

      <button
        type="button"
        className="mt-5 w-full select-none rounded-md border-2 border-neutral-800 bg-sky-500 px-4 py-4 text-sm font-bold uppercase tracking-wide text-neutral-900 hover:bg-sky-400 active:bg-sky-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-800"
        onPointerDown={(e) => {
          e.preventDefault()
          ;(e.target as HTMLButtonElement).setPointerCapture(e.pointerId)
          onHoldChange(true)
        }}
        onPointerUp={() => onHoldChange(false)}
        onPointerCancel={() => onHoldChange(false)}
        onLostPointerCapture={() => onHoldChange(false)}
      >
        {localHeld ? 'Holding bypass…' : 'Hold bypass'}
      </button>
      <p className="mt-2 text-center text-xs text-neutral-500">
        {solo
          ? 'Press and hold — use Partner sim for the other side'
          : `Hold ~${GATE_SYNC_MS / 1000}s together — talk it out`}
      </p>
    </div>
  )
}
