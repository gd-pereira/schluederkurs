import { useEffect, useRef, type ReactNode } from 'react'

type TaskModalProps = {
  title?: string
  onClose: () => void
  children?: ReactNode
}

export default function TaskModal({
  title = 'Task',
  onClose,
  children,
}: TaskModalProps) {
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    closeRef.current?.focus()

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div className="absolute inset-0 z-[10100] flex items-center justify-center bg-black/55 px-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-modal-title"
        className="w-full max-w-md rounded-lg border-4 border-neutral-600 bg-neutral-200 px-6 py-5 text-neutral-900 shadow-[0_12px_40px_rgba(0,0,0,0.55)]"
      >
        <div className="mb-4 flex items-center justify-between gap-4 border-b-2 border-neutral-400 pb-3">
          <h2 id="task-modal-title" className="text-lg font-bold tracking-tight">
            {title}
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="rounded border-2 border-neutral-700 bg-neutral-100 px-3 py-1 text-sm font-semibold hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-800"
          >
            Close
          </button>
        </div>
        {children ?? (
          <>
            <p className="text-sm leading-relaxed text-neutral-700">
              Placeholder — wiring comes later.
            </p>
            <p className="mt-3 text-xs text-neutral-500">Esc to close</p>
          </>
        )}
      </div>
    </div>
  )
}
