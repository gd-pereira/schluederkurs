import {
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
    reserveA: 0,
    reserveB: 0,
  }
}

export function freePower(flags: MatchFlags): number {
  return Math.max(0, 100 - flags.reserveA - flags.reserveB)
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

export function activeInteractables(
  flags: MatchFlags,
  props: {
    lever: Interactable
    wrench: Interactable
    vase: Interactable
    locker: Interactable
  },
): Interactable[] {
  if (!flags.gridOnline) {
    return flags.leverA ? [] : [props.lever]
  }
  const list: Interactable[] = []
  if (!flags.hasWrench) list.push(props.wrench)
  if (flags.hasWrench && flags.wallWiped && !flags.vaseSmashed) {
    list.push(props.vase)
  }
  if (flags.keypadDone && !flags.hasFuse) list.push(props.locker)
  return list
}
