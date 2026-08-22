export type MatchFlags = {
  leverA: boolean
  leverB: boolean
  lightsOn: boolean
  /** L key: force dark even when grid is up */
  debugForceDark: boolean
}

export function createFlags(): MatchFlags {
  return {
    leverA: false,
    leverB: false,
    lightsOn: false,
    debugForceDark: false,
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
