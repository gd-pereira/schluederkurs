import { useEffect, useRef, type ReactNode } from 'react'

type TaskModalProps = {
  title?: string
  eyebrow?: string
  /** Tighter panel for hardware UIs (keypad) */
  device?: boolean
  onClose: () => void
  children?: ReactNode
}

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export default function TaskModal({
  title = 'Task',
  eyebrow = 'Facility terminal',
  device = false,
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
    <div className="facility-scrim">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-modal-title"
        className={`facility-panel ${device ? 'facility-panel--device' : ''}`}
      >
        <div className="facility-panel__grain" aria-hidden />
        <div className="facility-panel__head">
          <div>
            <p className="facility-panel__eyebrow">{eyebrow}</p>
            <h2 id="task-modal-title" className="facility-panel__title">
              {title}
            </h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="facility-panel__close"
          >
            Esc
          </button>
        </div>
        <div className="facility-panel__body">{children}</div>
      </div>
    </div>
  )
}
