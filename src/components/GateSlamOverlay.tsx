import { useEffect } from 'react'
import { GATE_SLAM_MS } from '../game/constants'

type GateSlamOverlayProps = {
  onDone: () => void
}

export default function GateSlamOverlay({ onDone }: GateSlamOverlayProps) {
  useEffect(() => {
    const id = window.setTimeout(onDone, GATE_SLAM_MS)
    return () => window.clearTimeout(id)
  }, [onDone])

  return (
    <div
      className="gate-slam pointer-events-none absolute inset-0 z-[10060]"
      aria-hidden
    >
      <div className="gate-slam-panel gate-slam-panel--left" />
      <div className="gate-slam-panel gate-slam-panel--right" />
      <p className="gate-slam-label absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-sm font-bold uppercase tracking-[0.25em] text-red-400">
        Blast gate
      </p>
    </div>
  )
}
