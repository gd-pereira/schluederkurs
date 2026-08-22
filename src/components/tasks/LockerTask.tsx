type LockerTaskProps = {
  onComplete: () => void
}

export default function LockerTask({ onComplete }: LockerTaskProps) {
  return (
    <div>
      <p className="text-sm leading-relaxed text-neutral-700">
        Locker latch just clicked. Something useful is waiting inside.
      </p>
      <button
        type="button"
        onClick={onComplete}
        className="mt-5 w-full rounded-md border-2 border-neutral-800 bg-emerald-500 px-4 py-3 text-sm font-bold uppercase tracking-wide text-neutral-900 hover:bg-emerald-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-800"
      >
        Open locker
      </button>
    </div>
  )
}
