import type { Interactable } from './types'

export type MatchFlags = {
  leverA: boolean
  leverB: boolean
  lightsOn: boolean
  /** L key: force dark even when grid is up */
  debugForceDark: boolean
  hasWrench: boolean
  wallWiped: boolean
  vaseSmashed: boolean
  codeKnown: boolean
}

export const VASE_CODE = '8977'

export function createFlags(): MatchFlags {
  return {
    leverA: false,
    leverB: false,
    lightsOn: false,
    debugForceDark: false,
    hasWrench: false,
    wallWiped: false,
    vaseSmashed: false,
    codeKnown: false,
  }
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

/** Apply lever completion; turn lights on when both pulled */
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
    next.lightsOn = true
  }
  return next
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

export function activeInteractables(
  flags: MatchFlags,
  props: {
    lever: Interactable
    wrench: Interactable
    vase: Interactable
  },
): Interactable[] {
  if (!flags.lightsOn) {
    return flags.leverA ? [] : [props.lever]
  }
  const list: Interactable[] = []
  if (!flags.hasWrench) list.push(props.wrench)
  if (flags.hasWrench && flags.wallWiped && !flags.vaseSmashed) {
    list.push(props.vase)
  }
  return list
}
