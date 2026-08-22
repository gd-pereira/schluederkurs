import { useState, type CSSProperties, type SyntheticEvent } from 'react'
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
 * Grade bright cutouts toward the dark industrial plate so they sit in-scene.
 * Shadows stay separate (in-engine ellipse under the sprite).
 */
const PROP_BLEND: Record<string, CSSProperties> = {
  vase: {
    filter: 'brightness(0.72) contrast(0.9) saturate(0.58) sepia(0.14)',
    opacity: 0.92,
  },
  vase_shards: {
    filter: 'brightness(0.7) contrast(0.88) saturate(0.5) sepia(0.12)',
    opacity: 0.9,
  },
  wrench: {
    filter: 'brightness(0.74) contrast(0.86) saturate(0.35)',
    opacity: 0.9,
  },
  rag: {
    filter: 'brightness(0.78) contrast(0.92) saturate(0.7) sepia(0.08)',
    opacity: 0.94,
  },
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

  const blend = PROP_BLEND[sizeKey] ?? {}
  const blendOpacity =
    typeof blend.opacity === 'number' ? blend.opacity : 1
  const visible = box ? opacity * blendOpacity : 0
  const z = Math.floor(footBottom(prop.foot))

  // Soft contact shadow — anchors prop to floor like baked plate furniture
  const shadowW = Math.max(10, Math.round(draw.w * 0.72))
  const shadowH = Math.max(4, Math.round(draw.w * 0.22))
  const shadowLeft = draw.x + (draw.w - shadowW) / 2
  const shadowTop = draw.y + draw.h - shadowH * 0.55

  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute will-change-[opacity]"
        style={{
          left: `${shadowLeft}px`,
          top: `${shadowTop}px`,
          width: `${shadowW}px`,
          height: `${shadowH}px`,
          borderRadius: '50%',
          background:
            'radial-gradient(ellipse at center, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.18) 45%, transparent 72%)',
          opacity: visible,
          transition: `opacity ${FADE_MS}ms ease-out`,
          zIndex: z - 1,
        }}
      />
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
          opacity: visible,
          transition: `opacity ${FADE_MS}ms ease-out`,
          zIndex: z,
          filter: blend.filter,
        }}
        aria-hidden
      />
    </>
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
