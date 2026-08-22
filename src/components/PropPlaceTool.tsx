import { useCallback, useEffect, useState, type MouseEvent } from 'react'
import { WORLD_H, WORLD_W } from '../game/constants'
import type { AABB } from '../game/types'

type Point = { x: number; y: number }
type Rect = { x: number; y: number; w: number; h: number }

export type PlaceMarker = {
  id: string
  /** Interact / collision foot */
  foot: AABB
  /** Sprite / overlay slot (shown dashed) */
  sprite?: AABB
}

function clientToWorld(
  el: HTMLElement,
  clientX: number,
  clientY: number,
): Point {
  const rect = el.getBoundingClientRect()
  const x = ((clientX - rect.left) / rect.width) * WORLD_W
  const y = ((clientY - rect.top) / rect.height) * WORLD_H
  return {
    x: Math.round(Math.min(WORLD_W, Math.max(0, x))),
    y: Math.round(Math.min(WORLD_H, Math.max(0, y))),
  }
}

function toRect(a: Point, b: Point): Rect {
  const x = Math.min(a.x, b.x)
  const y = Math.min(a.y, b.y)
  return {
    x,
    y,
    w: Math.max(1, Math.abs(b.x - a.x)),
    h: Math.max(1, Math.abs(b.y - a.y)),
  }
}

function formatRect(r: Rect) {
  return `{ x: ${r.x}, y: ${r.y}, w: ${r.w}, h: ${r.h} }`
}

function formatHotspot(r: Rect) {
  return `hotspot('ID', 'TASK', ${r.x}, ${r.y}, ${r.w}, ${r.h})`
}

/**
 * Dev placer: P to toggle.
 * Click 1 = top-left, click 2 = bottom-right → copies full sprite/foot rect.
 * Existing interact markers stay visible so you can nudge against the plate.
 * Paste the line back into chat (with prop name).
 */
export default function PropPlaceTool({
  markers = [],
}: {
  markers?: readonly PlaceMarker[]
}) {
  const [active, setActive] = useState(false)
  const [cursor, setCursor] = useState<Point | null>(null)
  const [cornerA, setCornerA] = useState<Point | null>(null)
  const [rects, setRects] = useState<Rect[]>([])
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.repeat) return
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return
      if (e.key === 'p' || e.key === 'P') {
        e.preventDefault()
        setActive((v) => !v)
        setCursor(null)
        setCornerA(null)
        setCopied(null)
      }
      if (e.key === 'Escape') {
        setCornerA(null)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const onMove = useCallback((e: MouseEvent<HTMLDivElement>) => {
    setCursor(clientToWorld(e.currentTarget, e.clientX, e.clientY))
  }, [])

  const onClick = useCallback(
    async (e: MouseEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      const p = clientToWorld(e.currentTarget, e.clientX, e.clientY)

      if (!cornerA) {
        setCornerA(p)
        setCopied(null)
        return
      }

      const rect = toRect(cornerA, p)
      const line = formatRect(rect)
      const hotspotLine = formatHotspot(rect)
      setRects((prev) => [...prev, rect])
      setCornerA(null)
      setCopied(line)
      console.info('[prop-place] overlay', line)
      console.info('[prop-place] hotspot', hotspotLine)
      try {
        await navigator.clipboard.writeText(line)
      } catch {
        /* clipboard may be blocked; HUD still shows the value */
      }
    },
    [cornerA],
  )

  const draft =
    cornerA && cursor ? toRect(cornerA, cursor) : null

  if (!active) {
    return (
      <p className="pointer-events-none absolute bottom-2 right-2 z-[10080] rounded bg-black/70 px-2 py-1 text-[11px] text-neutral-400">
        P · place rect
      </p>
    )
  }

  return (
    <>
      <div
        className="absolute inset-0 z-[10080] cursor-crosshair"
        onMouseMove={onMove}
        onMouseLeave={() => setCursor(null)}
        onClick={onClick}
        role="presentation"
      >
        {markers.map((m) => (
          <div key={m.id} className="pointer-events-none absolute inset-0">
            {m.sprite && (
              <div
                className="absolute border border-dashed border-sky-300/70 bg-sky-400/10"
                style={{
                  left: m.sprite.x,
                  top: m.sprite.y,
                  width: m.sprite.w,
                  height: m.sprite.h,
                }}
              />
            )}
            <div
              className="absolute border border-fuchsia-400/90 bg-fuchsia-500/20"
              style={{
                left: m.foot.x,
                top: m.foot.y,
                width: m.foot.w,
                height: m.foot.h,
              }}
            >
              <span className="absolute -top-5 left-0 whitespace-nowrap rounded bg-black/85 px-1.5 py-0.5 text-[10px] font-mono text-fuchsia-200">
                {m.id} foot
              </span>
            </div>
          </div>
        ))}

        {rects.map((r, i) => (
          <div
            key={`${r.x}-${r.y}-${r.w}-${r.h}-${i}`}
            className="pointer-events-none absolute border border-lime-300/90 bg-lime-400/15"
            style={{ left: r.x, top: r.y, width: r.w, height: r.h }}
          >
            <span className="absolute -top-5 left-0 whitespace-nowrap rounded bg-black/85 px-1.5 py-0.5 text-[10px] font-mono text-lime-200">
              {i + 1}: {r.w}×{r.h} @ {r.x},{r.y}
            </span>
          </div>
        ))}

        {draft && (
          <div
            className="pointer-events-none absolute border border-dashed border-amber-300 bg-amber-300/10"
            style={{
              left: draft.x,
              top: draft.y,
              width: draft.w,
              height: draft.h,
            }}
          />
        )}

        {cornerA && (
          <div
            className="pointer-events-none absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-300"
            style={{ left: cornerA.x, top: cornerA.y }}
          />
        )}

        {cursor && (
          <div
            className="pointer-events-none absolute"
            style={{
              left: cursor.x,
              top: cursor.y,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <span className="block h-px w-6 bg-amber-300" />
            <span className="absolute left-1/2 top-1/2 block h-6 w-px -translate-x-1/2 -translate-y-1/2 bg-amber-300" />
          </div>
        )}
      </div>

      <div className="pointer-events-none absolute bottom-2 left-2 right-2 z-[10081] flex flex-wrap items-end justify-between gap-2">
        <div className="rounded bg-black/85 px-3 py-2 font-mono text-xs text-amber-100">
          <div className="text-[10px] uppercase tracking-wide text-amber-400/90">
            Place mode · magenta = current feet · dashed cyan = sprite slot · P
            off
          </div>
          <div className="mt-1 text-sm">
            {!cornerA &&
              (cursor
                ? `Corner A (top-left): { x: ${cursor.x}, y: ${cursor.y} }`
                : 'Click top-left of where the prop / foot should sit…')}
            {cornerA &&
              (draft
                ? `Corner B → ${formatRect(draft)}`
                : `Corner A locked ${cornerA.x},${cornerA.y} — click bottom-right`)}
          </div>
          {copied && (
            <div className="mt-1 text-lime-300">
              Copied overlay: {copied}
              <div className="text-[10px] text-neutral-400">
                Hotspot form also logged in console
              </div>
            </div>
          )}
        </div>
        {rects.length > 0 && (
          <button
            type="button"
            className="pointer-events-auto rounded bg-neutral-800 px-2 py-1 text-[11px] text-neutral-200 hover:bg-neutral-700"
            onClick={(e) => {
              e.stopPropagation()
              setRects([])
              setCopied(null)
              setCornerA(null)
            }}
          >
            Clear
          </button>
        )}
      </div>
    </>
  )
}
