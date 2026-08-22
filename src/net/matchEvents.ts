import type { MatchFlags } from '../game/matchFlags'
import {
  withBypass,
  withClearFuseReserve,
  withEscape,
  withFuse,
  withFuseInstalled,
  withFuseReserve,
  withKeypadDone,
  withKeypadReserve,
  withLeverPulled,
  withPartnerYield,
  withStartedAt,
  withVaseSmashed,
  withWallWiped,
  withWrench,
  withRag,
} from '../game/matchFlags'

export type PodId = 'a' | 'b'

export type MatchEvent =
  | { type: 'lever'; side: PodId }
  | { type: 'wrench' }
  | { type: 'rag' }
  | { type: 'wallWipe' }
  | { type: 'vaseSmash' }
  | { type: 'keypadReserve' }
  | { type: 'keypadDone' }
  | { type: 'fuseLoot' }
  | { type: 'fuseReserve' }
  | { type: 'clearFuseReserve' }
  | { type: 'fuseInstalled' }
  | { type: 'partnerYield' }
  | { type: 'bypass'; side: PodId; held: boolean }
  | { type: 'escape'; at: number }
  | { type: 'startedAt'; at: number }

export function applyMatchEvent(
  flags: MatchFlags,
  event: MatchEvent,
): MatchFlags {
  switch (event.type) {
    case 'lever':
      return withLeverPulled(flags, event.side)
    case 'wrench':
      return withWrench(flags)
    case 'rag':
      return withRag(flags)
    case 'wallWipe':
      return withWallWiped(flags)
    case 'vaseSmash':
      return withVaseSmashed(flags)
    case 'keypadReserve':
      return withKeypadReserve(flags)
    case 'keypadDone':
      return withKeypadDone(flags)
    case 'fuseLoot':
      return withFuse(flags)
    case 'fuseReserve':
      return withFuseReserve(flags)
    case 'clearFuseReserve':
      return withClearFuseReserve(flags)
    case 'fuseInstalled':
      return withFuseInstalled(flags)
    case 'partnerYield':
      return withPartnerYield(flags)
    case 'bypass':
      return withBypass(flags, event.side, event.held)
    case 'escape':
      return withEscape(flags, event.at)
    case 'startedAt':
      return withStartedAt(flags, event.at)
    default:
      return flags
  }
}

/** Local lever / bypass side for this pod */
export function localSide(pod: PodId): PodId {
  return pod
}

export function isSoloMode(): boolean {
  if (typeof window === 'undefined') return true
  return new URLSearchParams(window.location.search).has('solo')
}

export function defaultWsUrl(): string {
  const env = import.meta.env.VITE_WS_URL as string | undefined
  if (env) return env
  if (typeof window === 'undefined') return 'ws://localhost:8080'
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  // Vite dev → talk to Node on 8080; production → same host
  if (window.location.port === '5173' || window.location.port === '4173') {
    return `${proto}//${window.location.hostname}:8080`
  }
  return `${proto}//${window.location.host}`
}
