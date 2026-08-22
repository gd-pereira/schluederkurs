type PartnerSimProps = {
  enabled: boolean
  /** Local player pod — partner buttons drive the other side */
  localPod: 'a' | 'b'
  escaped: boolean
  // Shared / either
  gridOn: boolean
  fuseInstalled: boolean
  // When local is A → partner is B
  partnerLeverDone: boolean
  onPartnerLever: () => void
  wallWiped: boolean
  onPartnerWipe: () => void
  codeKnown: boolean
  keypadDone: boolean
  partnerKeypadOpen: boolean
  onPartnerKeypadOpen: () => void
  onPartnerKeypadFinish: () => void
  partnerReserve: number
  onPartnerYield: () => void
  partnerBypassHeld: boolean
  onPartnerBypassHold: (held: boolean) => void
  // When local is B → partner is A
  vaseSmashed: boolean
  onPartnerVaseSmash: () => void
  partnerHasFuse: boolean
  onPartnerFuseLoot: () => void
  onPartnerFuseInstall: () => void
}

type NextKindA =
  | 'lever'
  | 'wipe'
  | 'waitCode'
  | 'keypadOpen'
  | 'keypadFinish'
  | 'waitFuse'
  | 'bypass'

type NextKindB =
  | 'lever'
  | 'waitWipe'
  | 'vase'
  | 'fuseLoot'
  | 'fuseInstall'
  | 'bypass'

function resolveNextA(props: PartnerSimProps): NextKindA {
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

function resolveNextB(props: PartnerSimProps): NextKindB {
  if (!props.partnerLeverDone) return 'lever'
  if (!props.gridOn) return 'lever'
  if (!props.wallWiped) return 'waitWipe'
  if (!props.vaseSmashed) return 'vase'
  if (!props.partnerHasFuse) return 'fuseLoot'
  if (!props.fuseInstalled) return 'fuseInstall'
  return 'bypass'
}

const LABEL_A: Record<NextKindA, string> = {
  lever: 'Next: partner lever',
  wipe: 'Next: wipe wall',
  waitCode: 'Next: waiting for vase code…',
  keypadOpen: 'Next: open keypad (80%)',
  keypadFinish: 'Next: finish keypad',
  waitFuse: 'Next: waiting for fuse install…',
  bypass: 'Next: hold partner bypass',
}

const LABEL_B: Record<NextKindB, string> = {
  lever: 'Next: partner lever',
  waitWipe: 'Next: waiting for your wall wipe…',
  vase: 'Next: partner smash vase',
  fuseLoot: 'Next: partner take fuse',
  fuseInstall: 'Next: partner install fuse',
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
    localPod,
    escaped,
    onPartnerLever,
    onPartnerWipe,
    onPartnerKeypadOpen,
    onPartnerKeypadFinish,
    partnerReserve,
    onPartnerYield,
    partnerBypassHeld,
    onPartnerBypassHold,
    onPartnerVaseSmash,
    onPartnerFuseLoot,
    onPartnerFuseInstall,
  } = props

  if (!enabled || escaped) return null

  if (localPod === 'b') {
    const next = resolveNextB(props)
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="text-xs uppercase tracking-wider text-neutral-500">
            Solo sim · you Pod B
          </span>
          <span className="text-xs font-semibold text-amber-300/90">
            {LABEL_B[next]}
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
          {next === 'vase' && (
            <button
              type="button"
              onClick={onPartnerVaseSmash}
              className={`${btn} ${primary}`}
            >
              Partner smashed vase
            </button>
          )}
          {next === 'fuseLoot' && (
            <button
              type="button"
              onClick={onPartnerFuseLoot}
              className={`${btn} ${primary}`}
            >
              Partner took fuse
            </button>
          )}
          {next === 'fuseInstall' && (
            <button
              type="button"
              onClick={onPartnerFuseInstall}
              className={`${btn} ${primary}`}
            >
              Partner installed fuse
            </button>
          )}
          {next === 'bypass' && (
            <BypassHoldButton
              held={partnerBypassHeld}
              onHoldChange={onPartnerBypassHold}
            />
          )}
        </div>
      </div>
    )
  }

  const next = resolveNextA(props)
  const showYield = partnerReserve > 0

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <span className="text-xs uppercase tracking-wider text-neutral-500">
          Solo sim · you Pod A
        </span>
        <span className="text-xs font-semibold text-amber-300/90">
          {LABEL_A[next]}
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
          <BypassHoldButton
            held={partnerBypassHeld}
            onHoldChange={onPartnerBypassHold}
          />
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

function BypassHoldButton({
  held,
  onHoldChange,
}: {
  held: boolean
  onHoldChange: (held: boolean) => void
}) {
  return (
    <button
      type="button"
      className={`${btn} select-none ${held ? primary : muted}`}
      onPointerDown={(e) => {
        e.preventDefault()
        ;(e.target as HTMLButtonElement).setPointerCapture(e.pointerId)
        onHoldChange(true)
      }}
      onPointerUp={() => onHoldChange(false)}
      onPointerCancel={() => onHoldChange(false)}
      onLostPointerCapture={() => onHoldChange(false)}
    >
      {held ? 'Partner holding bypass…' : 'Hold partner bypass'}
    </button>
  )
}
