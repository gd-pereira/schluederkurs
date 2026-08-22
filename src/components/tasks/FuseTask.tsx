import { useEffect } from 'react'
import { FUSE_RESERVE } from '../../game/constants'

type FuseTaskProps = {
  canReserve: boolean
  reserved: boolean
  onReserve: () => void
  onInstall: () => void
  onClearReserve: () => void
}

export default function FuseTask({
  canReserve,
  reserved,
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
          Not enough free power — partner must yield (need {FUSE_RESERVE}% free).
        </p>
        <p className="mt-3 text-xs text-neutral-500">
          Close this, hit Partner yields power, then try again.
        </p>
      </div>
    )
  }

  return (
    <div>
      <p className="text-sm leading-relaxed text-neutral-700">
        Fuse bay online. Installing draws {FUSE_RESERVE}% of the shared grid.
      </p>
      {reserved && (
        <p className="mt-2 text-xs font-semibold text-amber-700">
          Power reserved — finish or close to release.
        </p>
      )}
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
