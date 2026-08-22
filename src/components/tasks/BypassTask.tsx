import { GATE_SYNC_MS } from '../../game/constants'
import {
  FacilityBody,
  FacilityBtn,
  FacilityCopy,
  FacilityHint,
} from '../FacilityUi'

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
    <FacilityBody>
      <FacilityCopy>
        Dual bypass. Both pods have to hold. Let go and it resets.
      </FacilityCopy>

      <div className="grid grid-cols-2 gap-2 text-xs uppercase tracking-[0.14em]">
        <div
          className={`border px-3 py-2 ${
            localHeld
              ? 'border-teal-400/50 bg-teal-500/15 text-teal-200'
              : 'border-neutral-600/80 bg-black/30 text-neutral-500'
          }`}
        >
          You · {localHeld ? 'Holding' : 'Released'}
        </div>
        <div
          className={`border px-3 py-2 ${
            partnerHeld
              ? 'border-amber-400/50 bg-amber-500/15 text-amber-200'
              : 'border-neutral-600/80 bg-black/30 text-neutral-500'
          }`}
        >
          Partner · {partnerHeld ? 'Holding' : 'Released'}
        </div>
      </div>

      {showSyncBar ? (
        <div>
          <div className="h-2 overflow-hidden border border-neutral-700 bg-black/60">
            <div
              className={`h-full transition-[width] duration-75 ${
                both ? 'bg-teal-400' : 'bg-neutral-600'
              }`}
              style={{ width: `${both ? pct : 0}%` }}
            />
          </div>
          <p className="mt-1.5 text-center font-[family-name:var(--font-game-ui)] text-sm tracking-[0.12em] text-neutral-400">
            {both ? `${pct}% synced` : 'Waiting for both holds…'}
          </p>
        </div>
      ) : (
        <p className="text-center text-sm text-neutral-400">
          {both
            ? pct < 40
              ? 'Tone rising…'
              : pct < 80
                ? 'Keep holding.'
                : "Almost. Don't let go."
            : localHeld
              ? 'Waiting on partner…'
              : 'Hold when your partner is ready.'}
        </p>
      )}

      <FacilityBtn
        tone="hold"
        data-held={localHeld ? '1' : '0'}
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
      </FacilityBtn>
      <FacilityHint>
        {solo
          ? 'Hold here. Use Partner sim for the other side.'
          : `Hold about ${GATE_SYNC_MS / 1000}s together.`}
      </FacilityHint>
    </FacilityBody>
  )
}
