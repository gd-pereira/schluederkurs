import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { WORLD_H, WORLD_W } from '../game/constants'
import {
  createBorderMask,
  maskToPngBlob,
  paintMaskToCanvas,
  stampMask,
  type CollisionMask,
} from '../game/collisionMask'

function clientToWorld(
  el: HTMLElement,
  clientX: number,
  clientY: number,
): { x: number; y: number } {
  const rect = el.getBoundingClientRect()
  const x = ((clientX - rect.left) / rect.width) * WORLD_W
  const y = ((clientY - rect.top) / rect.height) * WORLD_H
  return {
    x: Math.min(WORLD_W, Math.max(0, x)),
    y: Math.min(WORLD_H, Math.max(0, y)),
  }
}

type CollisionMaskToolProps = {
  pod: 'a' | 'b'
  maskRef: { current: CollisionMask }
  /** Bump after external mask load so canvas redraws */
  maskEpoch: number
  onMaskEdited?: () => void
}

/**
 * Dev tool: C toggles collision mask overlay / paint.
 * LMB paint solid · RMB / Shift erase · ↑↓ brush · Q download PNG · R reset border
 * Works for the active pod (A or B) — Solo Ready as B, or join as B, then paint + Q.
 */
export default function CollisionMaskTool({
  pod,
  maskRef,
  maskEpoch,
  onMaskEdited,
}: CollisionMaskToolProps) {
  const [active, setActive] = useState(false)
  const [brush, setBrush] = useState(18)
  const [status, setStatus] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const painting = useRef(false)
  const erase = useRef(false)

  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !active) return
    paintMaskToCanvas(canvas, maskRef.current)
  }, [active, maskRef])

  useEffect(() => {
    redraw()
  }, [redraw, maskEpoch, active])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return

      if (!e.repeat && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault()
        setActive((v) => !v)
        setStatus(null)
        return
      }
      if (!active) return

      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setBrush((b) => Math.min(64, b + 4))
        return
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setBrush((b) => Math.max(4, b - 4))
        return
      }

      if (e.repeat) return

      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault()
        maskRef.current = createBorderMask()
        onMaskEdited?.()
        setStatus('Reset to border walls')
        queueMicrotask(redraw)
      }
      if (e.key === 'q' || e.key === 'Q') {
        e.preventDefault()
        void (async () => {
          try {
            const blob = await maskToPngBlob(maskRef.current)
            const a = document.createElement('a')
            a.href = URL.createObjectURL(blob)
            a.download = `pod_${pod}_collision.png`
            a.click()
            URL.revokeObjectURL(a.href)
            setStatus(
              `Downloaded pod_${pod}_collision.png → drop into public/assets/`,
            )
          } catch {
            setStatus('Download failed')
          }
        })()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [active, maskRef, onMaskEdited, pod, redraw])

  const applyAt = useCallback(
    (clientX: number, clientY: number, el: HTMLElement) => {
      const p = clientToWorld(el, clientX, clientY)
      stampMask(maskRef.current, p.x, p.y, brush, erase.current ? 0 : 1)
      redraw()
    },
    [brush, maskRef, redraw],
  )

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLCanvasElement>) => {
      e.preventDefault()
      e.stopPropagation()
      e.currentTarget.setPointerCapture(e.pointerId)
      painting.current = true
      erase.current = e.button === 2 || e.shiftKey
      applyAt(e.clientX, e.clientY, e.currentTarget)
    },
    [applyAt],
  )

  const onPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLCanvasElement>) => {
      if (!painting.current) return
      applyAt(e.clientX, e.clientY, e.currentTarget)
    },
    [applyAt],
  )

  const onPointerUp = useCallback((e: ReactPointerEvent<HTMLCanvasElement>) => {
    painting.current = false
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      /* already released */
    }
  }, [])

  const onContextMenu = useCallback((e: ReactMouseEvent) => {
    e.preventDefault()
  }, [])

  if (!active) {
    return (
      <p className="pointer-events-none absolute bottom-2 left-2 z-[10080] rounded bg-black/70 px-2 py-1 text-[11px] text-neutral-400">
        C · collision mask (pod {pod.toUpperCase()})
      </p>
    )
  }

  return (
    <>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-[10070] cursor-crosshair"
        width={WORLD_W}
        height={WORLD_H}
        style={{ width: WORLD_W, height: WORLD_H, imageRendering: 'pixelated' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onContextMenu={onContextMenu}
      />
      <div className="pointer-events-none absolute bottom-2 left-2 right-2 z-[10081] flex flex-wrap items-end justify-between gap-2">
        <div className="rounded bg-black/85 px-3 py-2 font-mono text-xs text-rose-100">
          <div className="text-[10px] uppercase tracking-wide text-rose-300/90">
            Pod {pod.toUpperCase()} collision · LMB solid · RMB/Shift erase · ↑↓
            brush {brush}px · Q download · R reset · C off
          </div>
          {status && <div className="mt-1 text-lime-300">{status}</div>}
          <div className="mt-1 text-[10px] text-neutral-400">
            Live collision — walk to test, then Q →{' '}
            <span className="text-neutral-200">pod_{pod}_collision.png</span> in
            public/assets/
          </div>
        </div>
        <button
          type="button"
          className="pointer-events-auto rounded bg-neutral-800 px-2 py-1 text-[11px] text-neutral-200 hover:bg-neutral-700"
          onClick={(e) => {
            e.stopPropagation()
            maskRef.current = createBorderMask()
            onMaskEdited?.()
            setStatus('Reset to border walls')
            redraw()
          }}
        >
          Reset border
        </button>
      </div>
    </>
  )
}
