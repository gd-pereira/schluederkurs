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

type NextKind =
  | 'lever'
  | 'wipe'
  | 'waitCode'
  | 'keypadOpen'
  | 'keypadFinish'
  | 'waitFuse'
  | 'bypass'

function resolveNext(props: PartnerSimProps): NextKind {
  if (!props.partnerLeverDone) return 'lever'
  if (!props.gridOn) return 'lever'
  if (!props.wallWiped) return 'wipe'
  if (!props.keypadDone) {
    if (!props.codeKnown) return 'waitCode'
    if (!props.partnerKeypadOpen) return 'keypadOpen'
    return 'keypadFinish'
  }
  if (!props.fuseInstalled) return 'waitFuse'
  return 'bypass'
}

const NEXT_LABEL: Record<NextKind, string> = {
  lever: 'Next: partner lever',
  wipe: 'Next: wipe wall',
  waitCode: 'Next: waiting for vase code…',
  keypadOpen: 'Next: open keypad (80%)',
  keypadFinish: 'Next: finish keypad',
  waitFuse: 'Next: waiting for fuse install…',
  bypass: 'Next: hold partner bypass',
}

const btn =
  'rounded border px-3 py-1.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-40'
const primary =
  'border-amber-500/80 bg-amber-950/50 text-amber-100 hover:bg-amber-900/60'
const muted =
  'border-neutral-600 bg-neutral-900 text-neutral-200 hover:bg-neutral-800'

export default function PartnerSim(props: PartnerSimProps) {
  const {
    enabled,
    escaped,
    onPartnerLever,
    onPartnerWipe,
    onPartnerKeypadOpen,
    onPartnerKeypadFinish,
    partnerReserve,
    onPartnerYield,
    partnerBypassHeld,
    onPartnerBypassHold,
  } = props

  if (!enabled || escaped) return null

  const next = resolveNext(props)
  const showYield = partnerReserve > 0

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <span className="text-xs uppercase tracking-wider text-neutral-500">
          Solo sim
        </span>
        <span className="text-xs font-semibold text-amber-300/90">
          {NEXT_LABEL[next]}
        </span>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {next === 'lever' && (
          <button
            type="button"
            onClick={onPartnerLever}
            className={`${btn} ${primary}`}
          >
            Partner pulled lever
          </button>
        )}
        {next === 'wipe' && (
          <button
            type="button"
            onClick={onPartnerWipe}
            className={`${btn} ${primary}`}
          >
            Partner wiped wall
          </button>
        )}
        {next === 'keypadOpen' && (
          <button
            type="button"
            onClick={onPartnerKeypadOpen}
            className={`${btn} ${primary}`}
          >
            Partner opens keypad (80%)
          </button>
        )}
        {next === 'keypadFinish' && (
          <button
            type="button"
            onClick={onPartnerKeypadFinish}
            className={`${btn} ${primary}`}
          >
            Partner finishes keypad
          </button>
        )}
        {next === 'bypass' && (
          <button
            type="button"
            className={`${btn} select-none ${
              partnerBypassHeld ? primary : muted
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
        {showYield && (
          <button
            type="button"
            onClick={onPartnerYield}
            className={`${btn} ${muted}`}
          >
            Partner yields power
          </button>
        )}
      </div>
    </div>
  )
}
