import { useAssetReady } from '../hooks/useAssetReady'
import { propAssetUrl } from '../game/assets'
import { footBottom } from '../game/collision'
import type { MatchFlags } from '../game/matchFlags'
import type { Prop } from '../game/types'
import type { PodWorld } from '../game/world'
import type { PodId } from '../net/matchEvents'

function OverlaySprite({
  url,
  prop,
  opacity,
}: {
  url: string
  prop: Prop
  opacity: number
}) {
  const ready = useAssetReady(url)
  if (!ready || opacity <= 0) return null
  return (
    <div
      className="pointer-events-none absolute left-0 top-0"
      style={{
        width: prop.sprite.w,
        height: prop.sprite.h,
        transform: `translate(${prop.sprite.x}px, ${prop.sprite.y}px)`,
        backgroundImage: `url(${url})`,
        backgroundSize: 'contain',
        backgroundPosition: 'center bottom',
        backgroundRepeat: 'no-repeat',
        opacity,
        transition: 'opacity 200ms ease-out',
        zIndex: Math.floor(footBottom(prop.foot)),
      }}
      aria-hidden
    />
  )
}

/**
 * Transparent overlays for changeable props only.
 * Plate holds empty furniture; wrench/rag/vase sit on top.
 */
export function renderPodProps(
  world: PodWorld,
  flags: MatchFlags,
  _pod: PodId,
) {
  return world.props.map((prop) => {
    if (prop.id === 'wrench') {
      const url = propAssetUrl('wrench')
      if (!url) return null
      return (
        <OverlaySprite
          key={prop.id}
          url={url}
          prop={prop}
          opacity={flags.hasWrench ? 0 : 1}
        />
      )
    }
    if (prop.id === 'rag') {
      const url = propAssetUrl('rag')
      if (!url) return null
      return (
        <OverlaySprite
          key={prop.id}
          url={url}
          prop={prop}
          opacity={flags.hasRag ? 0 : 1}
        />
      )
    }
    if (prop.id === 'vase') {
      const intact = propAssetUrl('vase')
      const shards = propAssetUrl('vase_shards')
      return (
        <div key={prop.id}>
          {intact && (
            <OverlaySprite
              url={intact}
              prop={prop}
              opacity={flags.vaseSmashed ? 0 : 1}
            />
          )}
          {shards && (
            <OverlaySprite
              url={shards}
              prop={prop}
              opacity={flags.vaseSmashed ? 1 : 0}
            />
          )}
        </div>
      )
    }

    // Lever/locker/fuse/bypass/wall/keypad: baked into plate — invisible hotspot only
    return (
      <div
        key={prop.id}
        className="pointer-events-none absolute left-0 top-0 opacity-0"
        style={{
          width: prop.sprite.w,
          height: prop.sprite.h,
          transform: `translate(${prop.sprite.x}px, ${prop.sprite.y}px)`,
          zIndex: Math.floor(footBottom(prop.foot)),
        }}
        aria-hidden
      />
    )
  })
}
