import { useEffect } from 'react'
import { FUSE_RESERVE } from '../../game/constants'

type FuseTaskProps = {
  canReserve: boolean
  reserved: boolean
  freePower: number
  partnerReserve: number
  lightsOn: boolean
  onReserve: () => void
  onInstall: () => void
  onClearReserve: () => void
}

export default function FuseTask({
  canReserve,
  reserved,
  freePower,
  partnerReserve,
  lightsOn,
  onReserve,
  onInstall,
  onClearReserve,
}: FuseTaskProps) {
  useEffect(() => {
    if (canReserve) onReserve()
    return () => {
      onClearReserve()
    }
  }, [canReserve, onReserve, onClearReserve])

  if (!canReserve && !reserved) {
    return (
      <div>
        <p className="text-sm leading-relaxed text-neutral-700">
          Fuse bay locked. Needs <strong>{FUSE_RESERVE}% free</strong> on the
          shared grid.
        </p>
        <div className="mt-3 rounded border-2 border-red-700/40 bg-red-50 px-3 py-2 text-xs text-red-950">
          <p>
            Free now: <strong>{Math.round(freePower)}%</strong>
            {partnerReserve > 0 && (
              <>
                {' '}
                · Partner holding <strong>{partnerReserve}%</strong>
              </>
            )}
          </p>
          <p className="mt-1 font-semibold">
            {partnerReserve >= 80
              ? 'Partner’s keypad is open — they must close or yield before you can install.'
              : `Need ${FUSE_RESERVE - Math.round(freePower)}% more free. Talk to your partner.`}
          </p>
        </div>
        <p className="mt-3 text-xs text-neutral-500">
          Close this and wait — opening it again retries the reserve.
        </p>
      </div>
    )
  }

  return (
    <div>
      <p className="text-sm leading-relaxed text-neutral-700">
        Fuse bay online. Install holds <strong>{FUSE_RESERVE}%</strong> until
        you finish — partner’s lights will die while you work.
      </p>
      <div className="mt-3 rounded border-2 border-amber-700/40 bg-amber-50 px-3 py-2 text-xs text-amber-950">
        <p>
          Free left: <strong>{Math.round(freePower)}%</strong>
          {' · '}
          Lights:{' '}
          <strong className={lightsOn ? 'text-teal-700' : 'text-red-700'}>
            {lightsOn ? 'ON' : 'OUT (both pods)'}
          </strong>
        </p>
        {reserved && (
          <p className="mt-1 font-semibold">
            Holding {FUSE_RESERVE}% — install now or close to release.
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={onInstall}
        disabled={!reserved}
        className="mt-5 w-full rounded-md border-2 border-neutral-800 bg-orange-400 px-4 py-3 text-sm font-bold uppercase tracking-wide text-neutral-900 hover:bg-orange-300 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-800"
      >
        Install fuse
      </button>
    </div>
  )
}
