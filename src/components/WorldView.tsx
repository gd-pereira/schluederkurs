import { useEffect, useRef, type CSSProperties } from 'react'
import {
  FLASHLIGHT_RADIUS,
  PLAYER_SPRITE_H,
  PLAYER_SPRITE_W,
  WALL_THICKNESS,
  WORLD_H,
  WORLD_W,
} from '../game/constants'
import { startGameLoop } from '../game/loop'
import { createPlaceholderCrate, createWorldSolids } from '../game/world'

const prop = createPlaceholderCrate()
const solids = createWorldSolids([prop])

export default function WorldView() {
  const worldRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<HTMLDivElement>(null)
  const propRef = useRef<HTMLDivElement>(null)
  const lockedRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    const worldEl = worldRef.current
    const playerEl = playerRef.current
    const propEl = propRef.current
    if (!worldEl || !playerEl || !propEl) return

    const loop = startGameLoop(
      {
        worldEl,
        playerEl,
        propEl,
        lockedEl: lockedRef.current,
      },
      solids,
      prop,
    )

    return () => loop.stop()
  }, [])

  return (
    <div className="relative" style={{ width: WORLD_W, height: WORLD_H }}>
      <div
        ref={worldRef}
        className="pod-world relative overflow-hidden rounded-sm border border-neutral-700 bg-neutral-900"
        data-dark="0"
        style={
          {
            width: WORLD_W,
            height: WORLD_H,
            '--fx': `${WORLD_W / 2}px`,
            '--fy': `${WORLD_H / 2}px`,
            '--flashlight-r': `${FLASHLIGHT_RADIUS}px`,
          } as CSSProperties
        }
      >
        {/* Wall visuals (match collision thickness) */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 bg-neutral-700"
          style={{ height: WALL_THICKNESS }}
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 bg-neutral-700"
          style={{ height: WALL_THICKNESS }}
        />
        <div
          className="pointer-events-none absolute inset-y-0 left-0 bg-neutral-700"
          style={{ width: WALL_THICKNESS }}
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 bg-neutral-700"
          style={{ width: WALL_THICKNESS }}
        />

        {/* Floor hint grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            top: WALL_THICKNESS,
            left: WALL_THICKNESS,
            right: WALL_THICKNESS,
            bottom: WALL_THICKNESS,
            backgroundImage:
              'linear-gradient(to right, #3f3f46 1px, transparent 1px), linear-gradient(to bottom, #3f3f46 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />

        <div
          ref={propRef}
          className="absolute left-0 top-0 will-change-transform"
          style={{
            width: prop.sprite.w,
            height: prop.sprite.h,
            transform: `translate(${prop.sprite.x}px, ${prop.sprite.y}px)`,
            backgroundColor: prop.color,
            boxShadow: 'inset 0 0 0 2px #1a1208',
          }}
          aria-hidden
        />

        <div
          ref={playerRef}
          className="absolute left-0 top-0 will-change-transform"
          style={{
            width: PLAYER_SPRITE_W,
            height: PLAYER_SPRITE_H,
            backgroundColor: '#4bc4c0',
            boxShadow: 'inset 0 0 0 2px #0c1014',
            borderRadius: 8,
          }}
          aria-label="Player"
        />

        {/* CSS flashlight: full dark when data-dark=1; hole follows --fx/--fy from rAF */}
        <div className="flashlight-overlay" aria-hidden />
      </div>

      <p
        ref={lockedRef}
        className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 text-sm font-semibold tracking-wide text-amber-400"
      />
    </div>
  )
}
