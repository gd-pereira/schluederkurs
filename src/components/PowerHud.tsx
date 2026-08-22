import {
  FUSE_RESERVE,
  KEYPAD_RESERVE,
  LIGHT_OFF_BELOW,
  LIGHT_ON_ABOVE,
} from '../game/constants'

type PowerHudProps = {
  visible: boolean
  free: number
  reserveYou: number
  reservePartner: number
  penalty?: number
  lightsOn: boolean
  /** Which heavy device labels to show */
  youDevice?: string | null
  partnerDevice?: string | null
}

/**
 * Shared 100% pie as one stacked bar + plain English.
 * Free power buys lights; big devices steal free power from both pods.
 */
export default function PowerHud({
  visible,
  free,
  reserveYou,
  reservePartner,
  penalty = 0,
  lightsOn,
  youDevice = null,
  partnerDevice = null,
}: PowerHudProps) {
  if (!visible) return null

  const you = clamp(reserveYou)
  const partner = clamp(reservePartner)
  const fault = clamp(penalty)
  const freeClamped = clamp(free)
  const used = you + partner + fault
  const freeSeg = Math.max(0, 100 - used)

  const status = describeStatus({
    free: freeClamped,
    lightsOn,
    you,
    partner,
    fault,
    youDevice,
    partnerDevice,
  })

  return (
    <div className="facility-hud absolute right-3 top-3 z-[10040] w-56 px-3 py-2.5 text-xs text-neutral-200">
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <p className="facility-hud__label">Shared grid</p>
        <p
          className={`font-[family-name:var(--font-game-ui)] text-sm font-semibold tracking-[0.08em] ${
            lightsOn ? 'text-teal-300' : 'text-red-400'
          }`}
        >
          {lightsOn ? 'LIGHTS ON' : 'LIGHTS OUT'}
        </p>
      </div>

      <div
        className="flex h-3 overflow-hidden border border-neutral-700 bg-neutral-950"
        title="One shared 100% — both pods draw from this"
      >
        {you > 0 && (
          <div
            className="h-full bg-sky-400 transition-[width] duration-200"
            style={{ width: `${you}%` }}
            title={`You ${you}%`}
          />
        )}
        {partner > 0 && (
          <div
            className="h-full bg-amber-400 transition-[width] duration-200"
            style={{ width: `${partner}%` }}
            title={`Partner ${partner}%`}
          />
        )}
        {fault > 0 && (
          <div
            className="h-full bg-red-500 transition-[width] duration-200"
            style={{ width: `${fault}%` }}
            title={`Fault ${fault}%`}
          />
        )}
        <div
          className="h-full bg-teal-500/80 transition-[width] duration-200"
          style={{ width: `${freeSeg}%` }}
          title={`Free ${freeSeg}%`}
        />
      </div>

      <div className="mt-1.5 flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] text-neutral-400">
        <Legend swatch="bg-teal-500/80" label={`Free ${freeClamped}%`} />
        {you > 0 && (
          <Legend
            swatch="bg-sky-400"
            label={`You ${you}%${youDevice ? ` · ${youDevice}` : ''}`}
          />
        )}
        {partner > 0 && (
          <Legend
            swatch="bg-amber-400"
            label={`Partner ${partner}%${partnerDevice ? ` · ${partnerDevice}` : ''}`}
          />
        )}
        {fault > 0 && (
          <Legend swatch="bg-red-500" label={`Fault ${fault}%`} />
        )}
      </div>

      <p
        className={`mt-2 text-[11px] leading-snug ${
          lightsOn ? 'text-neutral-400' : 'font-semibold text-amber-200'
        }`}
      >
        {status}
      </p>
      <p className="mt-1 text-[10px] leading-snug text-neutral-500">
        Lights need ≥{LIGHT_ON_ABOVE}% free (die below {LIGHT_OFF_BELOW}%).
        Keypad {KEYPAD_RESERVE}% · Fuse {FUSE_RESERVE}% — can’t run both.
      </p>
    </div>
  )
}

function clamp(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)))
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={`inline-block h-1.5 w-1.5 ${swatch}`} />
      {label}
    </span>
  )
}

function describeStatus({
  free,
  lightsOn,
  you,
  partner,
  fault,
  youDevice,
  partnerDevice,
}: {
  free: number
  lightsOn: boolean
  you: number
  partner: number
  fault: number
  youDevice: string | null
  partnerDevice: string | null
}): string {
  if (fault > 0) {
    return 'Fault spike — wrong keypad input. Grid browning out.'
  }
  if (partner >= KEYPAD_RESERVE) {
    return `Partner’s ${partnerDevice ?? 'device'} is eating the grid. Your lights stay dead until they finish or yield.`
  }
  if (you >= KEYPAD_RESERVE) {
    return `Your ${youDevice ?? 'device'} is hogging power — partner is in the dark. Finish or close.`
  }
  if (partner >= FUSE_RESERVE) {
    return `Partner reserved ${partner}% for ${partnerDevice ?? 'fuse'}. Free is ${free}% — wait or talk.`
  }
  if (you >= FUSE_RESERVE) {
    return `You’re holding ${you}% for ${youDevice ?? 'fuse'}. Partner can’t run heavy devices.`
  }
  if (!lightsOn) {
    return `Only ${free}% free — lights out. Flashlight only until free climbs.`
  }
  if (free < 50) {
    return `${free}% free. Heavy devices will kill the lights for both pods.`
  }
  return `${free}% free. Shared — whatever you reserve, partner loses.`
}
