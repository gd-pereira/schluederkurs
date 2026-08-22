import { useAssetReady } from '../hooks/useAssetReady'
import { propAssetUrl } from '../game/assets'
import { footBottom } from '../game/collision'
import type { MatchFlags } from '../game/matchFlags'
import type { PodWorld } from '../game/world'
import type { PodId } from '../net/matchEvents'

function propVisualState(
  id: string,
  flags: MatchFlags,
  pod: PodId,
): { opacity: number; backgroundColor?: string } {
  switch (id) {
    case 'lever':
      return {
        opacity: (pod === 'b' ? flags.leverB : flags.leverA) ? 0.45 : 1,
      }
    case 'wrench':
      return { opacity: flags.hasWrench ? 0 : 1 }
    case 'rag':
      return { opacity: flags.hasRag ? 0 : 1 }
    case 'vase':
      return {
        opacity: flags.vaseSmashed ? 0.5 : 1,
        backgroundColor: flags.vaseSmashed ? '#3a2848' : undefined,
      }
    case 'locker':
      return {
        opacity: flags.hasFuse ? 0.55 : 1,
        backgroundColor: flags.hasFuse ? '#2a3a32' : undefined,
      }
    case 'fuse':
      return {
        opacity: flags.fuseInstalled ? 0.55 : flags.hasFuse ? 1 : 0.45,
        backgroundColor: flags.fuseInstalled ? '#5c3d0e' : undefined,
      }
    case 'bypass':
      return {
        opacity: flags.fuseInstalled ? 1 : 0.35,
        backgroundColor: flags.escaped ? '#0f2940' : undefined,
      }
    case 'wall':
      return { opacity: flags.wallWiped ? 0.4 : 1 }
    case 'keypad':
      return { opacity: flags.keypadDone ? 0.45 : 1 }
    default:
      return { opacity: 1 }
  }
}

function PodPropSprite({
  prop,
  flags,
  pod,
}: {
  prop: PodWorld['props'][number]
  flags: MatchFlags
  pod: PodId
}) {
  const url = propAssetUrl(prop.id)
  const imageReady = useAssetReady(url)
  const visual = propVisualState(prop.id, flags, pod)

  return (
    <div
      className="absolute left-0 top-0 will-change-transform"
      style={{
        width: prop.sprite.w,
        height: prop.sprite.h,
        transform: `translate(${prop.sprite.x}px, ${prop.sprite.y}px)`,
        backgroundColor: visual.backgroundColor ?? prop.color,
        backgroundImage: imageReady && url ? `url(${url})` : undefined,
        backgroundSize: 'contain',
        backgroundPosition: 'center bottom',
        backgroundRepeat: 'no-repeat',
        boxShadow: imageReady ? undefined : 'inset 0 0 0 2px #1a1208',
        borderRadius: 4,
        opacity: visual.opacity,
        zIndex: Math.floor(footBottom(prop.foot)),
      }}
      aria-hidden={prop.id !== 'lever' && prop.id !== 'bypass'}
      aria-label={
        prop.id === 'lever'
          ? 'Lever'
          : prop.id === 'bypass'
            ? 'Bypass console'
            : undefined
      }
    />
  )
}

export function renderPodProps(world: PodWorld, flags: MatchFlags, pod: PodId) {
  return world.props.map((prop) => (
    <PodPropSprite key={prop.id} prop={prop} flags={flags} pod={pod} />
  ))
}
