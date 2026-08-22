type RagTaskProps = {
  onComplete: () => void
}

export default function RagTask({ onComplete }: RagTaskProps) {
  return (
    <div>
      <p className="text-sm leading-relaxed text-neutral-700">
        A greasy rag sits on the cart. Good enough to wipe that wall.
      </p>
      <button
        type="button"
        onClick={onComplete}
        className="mt-5 w-full rounded-md border-2 border-neutral-800 bg-stone-300 px-4 py-3 text-sm font-bold uppercase tracking-wide text-neutral-900 hover:bg-stone-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-800"
      >
        Take rag
      </button>
    </div>
  )
}
