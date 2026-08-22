type LobbyOverlayProps = {
  onReady: () => void
}

export default function LobbyOverlay({ onReady }: LobbyOverlayProps) {
  return (
    <div className="absolute inset-0 z-[10050] flex flex-col items-center justify-center bg-black/70 px-6">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
        Incompetent Chambers
      </p>
      <h2 className="text-2xl font-semibold tracking-tight text-neutral-50">
        Pod lockdown pending
      </h2>
      <p className="mt-2 max-w-sm text-center text-sm text-neutral-400">
        Both contractors ready? Slam the blast gate and hope the grid comes back.
      </p>
      <button
        type="button"
        onClick={onReady}
        className="mt-8 rounded-md border-2 border-amber-500/80 bg-amber-500/15 px-8 py-3 text-sm font-bold uppercase tracking-wider text-amber-300 transition hover:bg-amber-500/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
      >
        Ready
      </button>
    </div>
  )
}
