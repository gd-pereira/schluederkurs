type WrenchTaskProps = {
  onComplete: () => void
}

export default function WrenchTask({ onComplete }: WrenchTaskProps) {
  return (
    <div>
      <p className="text-sm leading-relaxed text-neutral-700">
        A heavy wrench. Probably for smashing things you are not supposed to smash.
      </p>
      <button
        type="button"
        onClick={onComplete}
        className="mt-5 w-full rounded-md border-2 border-neutral-800 bg-slate-400 px-4 py-3 text-sm font-bold uppercase tracking-wide text-neutral-900 hover:bg-slate-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-800"
      >
        Take wrench
      </button>
    </div>
  )
}
