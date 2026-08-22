import { useEffect, useRef, type ReactNode } from 'react'

type TaskModalProps = {
  title?: string
  onClose: () => void
  children?: ReactNode
}

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export default function TaskModal({
  title = 'Task',
  onClose,
  children,
}: TaskModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const panel = panelRef.current
    if (!panel) return

    const focusables = () =>
      Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => !el.hasAttribute('disabled') && el.offsetParent !== null,
      )

    const bodyFirst = focusables().find((el) => el !== closeRef.current)
    ;(bodyFirst ?? closeRef.current)?.focus()

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }
      if (e.key !== 'Tab' || !panel) return
      const list = focusables()
      if (list.length === 0) return
      const first = list[0]
      const last = list[list.length - 1]
      const active = document.activeElement as HTMLElement | null
      if (e.shiftKey) {
        if (active === first || !panel.contains(active)) {
          e.preventDefault()
          last.focus()
        }
      } else if (active === last) {
        e.preventDefault()
        first.focus()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div className="absolute inset-0 z-[10100] flex items-center justify-center bg-black/55 px-4">
      <div
        ref={panelRef}
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
        <div>{children}</div>
      </div>
    </div>
  )
}
