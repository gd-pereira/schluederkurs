type LeverTaskProps = {
  onComplete: () => void
}

export default function LeverTask({ onComplete }: LeverTaskProps) {
  return (
    <div>
      <p className="text-sm leading-relaxed text-neutral-700">
        Local breaker lever. Pull it and hope the other pod does the same.
      </p>
      <button
        type="button"
        onClick={onComplete}
        className="mt-5 w-full rounded-md border-2 border-neutral-800 bg-amber-400 px-4 py-3 text-sm font-bold uppercase tracking-wide text-neutral-900 hover:bg-amber-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-800"
      >
        Pull lever
      </button>
    </div>
  )
}
