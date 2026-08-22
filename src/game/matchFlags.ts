import {
  FUSE_RESERVE,
  KEYPAD_RESERVE,
  LIGHT_OFF_BELOW,
  LIGHT_ON_ABOVE,
} from './constants'
import type { Interactable } from './types'

export type MatchFlags = {
  leverA: boolean
  leverB: boolean
  /** Both levers pulled — shared grid is available */
  gridOnline: boolean
  /** Hysteresis: facility lights currently lit (requires gridOnline) */
  lightsOn: boolean
  /** L key: force dark even when lights on */
  debugForceDark: boolean
  hasWrench: boolean
  wallWiped: boolean
  vaseSmashed: boolean
  codeKnown: boolean
  keypadDone: boolean
  hasFuse: boolean
  fuseInstalled: boolean
  bypassA: boolean
  bypassB: boolean
  escaped: boolean
  startedAt: number | null
  escapedAt: number | null
  reserveA: number
  reserveB: number
}

export const VASE_CODE = '8977'

export function createFlags(): MatchFlags {
  return {
    leverA: false,
    leverB: false,
    gridOnline: false,
    lightsOn: false,
    debugForceDark: false,
    hasWrench: false,
    wallWiped: false,
    vaseSmashed: false,
    codeKnown: false,
    keypadDone: false,
    hasFuse: false,
    fuseInstalled: false,
    bypassA: false,
    bypassB: false,
    escaped: false,
    startedAt: null,
    escapedAt: null,
    reserveA: 0,
    reserveB: 0,
  }
}

export function freePower(flags: MatchFlags): number {
  return Math.max(0, 100 - flags.reserveA - flags.reserveB)
}

/** Free power if we cleared our current fuse reserve (for open checks) */
export function freePowerWithoutReserveA(flags: MatchFlags): number {
  return Math.max(0, 100 - flags.reserveB)
}

/** Update lightsOn from free power while grid is online */
export function applyLightHysteresis(flags: MatchFlags): MatchFlags {
  if (!flags.gridOnline) {
    return { ...flags, lightsOn: false }
  }
  const free = freePower(flags)
  if (free < LIGHT_OFF_BELOW) {
    return { ...flags, lightsOn: false }
  }
  if (free > LIGHT_ON_ABOVE) {
    return { ...flags, lightsOn: true }
  }
  return flags
}

/** After lockdown, dark unless lights on (or L forces dark) */
export function effectiveDark(
  flags: MatchFlags,
  lockdownStarted: boolean,
): boolean {
  if (!lockdownStarted) return false
  if (flags.debugForceDark) return true
  return !flags.lightsOn
}

/** Apply lever completion; turn grid + lights on when both pulled */
export function withLeverPulled(
  flags: MatchFlags,
  side: 'a' | 'b',
): MatchFlags {
  const next: MatchFlags = {
    ...flags,
    leverA: side === 'a' ? true : flags.leverA,
    leverB: side === 'b' ? true : flags.leverB,
  }
  if (next.leverA && next.leverB) {
    next.gridOnline = true
    next.lightsOn = true
  }
  return applyLightHysteresis(next)
}

export function withWrench(flags: MatchFlags): MatchFlags {
  return { ...flags, hasWrench: true }
}

export function withWallWiped(flags: MatchFlags): MatchFlags {
  return { ...flags, wallWiped: true }
}

export function withVaseSmashed(flags: MatchFlags): MatchFlags {
  return {
    ...flags,
    vaseSmashed: true,
    codeKnown: true,
  }
}

export function withKeypadReserve(flags: MatchFlags): MatchFlags {
  return applyLightHysteresis({
    ...flags,
    reserveB: KEYPAD_RESERVE,
  })
}

export function withKeypadDone(flags: MatchFlags): MatchFlags {
  return applyLightHysteresis({
    ...flags,
    reserveB: 0,
    keypadDone: true,
  })
}

export function withFuse(flags: MatchFlags): MatchFlags {
  return { ...flags, hasFuse: true }
}

export function withPartnerYield(flags: MatchFlags): MatchFlags {
  return applyLightHysteresis({
    ...flags,
    reserveB: 0,
  })
}

/** Reserve 70% for fuse if enough free power (excluding current A reserve) */
export function withFuseReserve(flags: MatchFlags): MatchFlags {
  if (freePowerWithoutReserveA(flags) < FUSE_RESERVE) {
    return flags
  }
  return applyLightHysteresis({
    ...flags,
    reserveA: FUSE_RESERVE,
  })
}

export function withClearFuseReserve(flags: MatchFlags): MatchFlags {
  return applyLightHysteresis({
    ...flags,
    reserveA: 0,
  })
}

export function withFuseInstalled(flags: MatchFlags): MatchFlags {
  return applyLightHysteresis({
    ...flags,
    fuseInstalled: true,
    reserveA: 0,
  })
}

export function withBypass(
  flags: MatchFlags,
  side: 'a' | 'b',
  held: boolean,
): MatchFlags {
  if (side === 'a') return { ...flags, bypassA: held }
  return { ...flags, bypassB: held }
}

export function withEscape(flags: MatchFlags, at: number): MatchFlags {
  return {
    ...flags,
    escaped: true,
    escapedAt: at,
    bypassA: false,
    bypassB: false,
  }
}

export function withStartedAt(flags: MatchFlags, at: number): MatchFlags {
  if (flags.startedAt !== null) return flags
  return { ...flags, startedAt: at }
}

export function activeInteractables(
  flags: MatchFlags,
  props: {
    lever: Interactable
    wrench: Interactable
    vase: Interactable
    locker: Interactable
    fuse: Interactable
    bypass: Interactable
    wall: Interactable
    keypad: Interactable
  },
  pod: 'a' | 'b' = 'a',
): Interactable[] {
  if (!flags.gridOnline) {
    if (pod === 'b') return flags.leverB ? [] : [props.lever]
    return flags.leverA ? [] : [props.lever]
  }
  if (flags.escaped) return []

  const list: Interactable[] = []

  if (pod === 'b') {
    if (!flags.wallWiped) list.push(props.wall)
    if (flags.codeKnown && !flags.keypadDone) list.push(props.keypad)
    if (flags.fuseInstalled && !flags.escaped) list.push(props.bypass)
    return list
  }

  // Pod A (and solo)
  if (!flags.hasWrench) list.push(props.wrench)
  if (flags.hasWrench && flags.wallWiped && !flags.vaseSmashed) {
    list.push(props.vase)
  }
  if (flags.keypadDone && !flags.hasFuse) list.push(props.locker)
  if (flags.hasFuse && !flags.fuseInstalled) list.push(props.fuse)
  if (flags.fuseInstalled && !flags.escaped) list.push(props.bypass)
  return list
}
