import { useState, type SyntheticEvent } from 'react'
import { useKnockoutAsset } from '../hooks/useKnockoutAsset'
import { propAssetUrl } from '../game/assets'
import { footBottom } from '../game/collision'
import type { AABB } from '../game/types'
import type { MatchFlags } from '../game/matchFlags'
import type { Prop } from '../game/types'
import type { PodWorld } from '../game/world'

const FADE_MS = 380

/**
 * Fixed on-screen widths (px) — placer slot is position only, not scale.
 * Matches the old ~40px hotspot sprite scale.
 */
const PROP_DISPLAY_W: Record<string, number> = {
  vase: 36,
  vase_shards: 46,
  wrench: 14,
  rag: 40,
}

/**
 * Slot = placement footprint. Size comes from PROP_DISPLAY_W + PNG aspect.
 * Bottom-centered on the slot so furniture contact stays put.
 */
function aspectBox(
  slot: AABB,
  natW: number,
  natH: number,
  propId: string,
): AABB {
  const targetW = PROP_DISPLAY_W[propId] ?? 40
  const w = targetW
  const h = Math.round((targetW * natH) / natW)
  return {
    x: Math.round(slot.x + (slot.w - w) / 2),
    y: Math.round(slot.y + slot.h - h),
    w,
    h,
  }
}

function OverlaySprite({
  url,
  prop,
  opacity,
  sizeKey,
}: {
  url: string
  prop: Prop
  opacity: number
  /** Which PROP_DISPLAY_W entry to use (e.g. vase vs vase_shards) */
  sizeKey: string
}) {
  const src = useKnockoutAsset(url)
  const [box, setBox] = useState<AABB | null>(null)

  if (!src) return null

  const onLoad = (e: SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    const nw = img.naturalWidth
    const nh = img.naturalHeight
    if (nw < 1 || nh < 1) return
    setBox(aspectBox(prop.sprite, nw, nh, sizeKey))
  }

  const draw = box ?? {
    x: prop.sprite.x,
    y: prop.sprite.y,
    w: PROP_DISPLAY_W[sizeKey] ?? 40,
    h: PROP_DISPLAY_W[sizeKey] ?? 40,
  }

  return (
    <img
      src={src}
      alt=""
      draggable={false}
      onLoad={onLoad}
      className="pointer-events-none absolute max-w-none will-change-[opacity]"
      style={{
        left: `${draw.x}px`,
        top: `${draw.y}px`,
        width: `${draw.w}px`,
        height: `${draw.h}px`,
        objectFit: 'contain',
        objectPosition: 'bottom center',
        opacity: box ? opacity : 0,
        transition: `opacity ${FADE_MS}ms ease-out`,
        zIndex: Math.floor(footBottom(prop.foot)),
      }}
      aria-hidden
    />
  )
}

/**
 * Transparent overlays for changeable props (wrench / rag / vase).
 * Lever stays baked into the plate — no overlay swap.
 */
export default function PodPropSprites({
  world,
  flags,
}: {
  world: PodWorld
  flags: MatchFlags
}) {
  return (
    <>
      {world.props.map((prop) => {
        if (prop.id === 'wrench') {
          const url = propAssetUrl('wrench')
          if (!url) return null
          return (
            <OverlaySprite
              key={`${prop.id}-${prop.sprite.x}-${prop.sprite.y}-${prop.sprite.w}-${prop.sprite.h}`}
              url={url}
              prop={prop}
              sizeKey="wrench"
              opacity={flags.hasWrench ? 0 : 1}
            />
          )
        }
        if (prop.id === 'rag') {
          const url = propAssetUrl('rag')
          if (!url) return null
          return (
            <OverlaySprite
              key={`${prop.id}-${prop.sprite.x}-${prop.sprite.y}-${prop.sprite.w}-${prop.sprite.h}`}
              url={url}
              prop={prop}
              sizeKey="rag"
              opacity={flags.hasRag ? 0 : 1}
            />
          )
        }
        if (prop.id === 'vase') {
          const intact = propAssetUrl('vase')
          const shards = propAssetUrl('vase_shards')
          const vaseKey = `${prop.sprite.x}-${prop.sprite.y}-${prop.sprite.w}-${prop.sprite.h}`
          return (
            <div key={prop.id}>
              {intact && (
                <OverlaySprite
                  key={`intact-${vaseKey}`}
                  url={intact}
                  prop={prop}
                  sizeKey="vase"
                  opacity={flags.vaseSmashed ? 0 : 1}
                />
              )}
              {shards && (
                <OverlaySprite
                  key={`shards-${vaseKey}`}
                  url={shards}
                  prop={prop}
                  sizeKey="vase_shards"
                  opacity={flags.vaseSmashed ? 1 : 0}
                />
              )}
            </div>
          )
        }

        return null
      })}
    </>
  )
}
