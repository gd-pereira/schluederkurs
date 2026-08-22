import type { PodId } from '../net/matchEvents'

export type HintId =
  | 'gridOnline'
  | 'codeKnown'
  | 'fuseLoot'
  | 'escaped'
  | 'syncLost'
  | 'lightsOut'
  | 'wallWiped'
  | 'lightsDimmed'
  | 'lightsRestored'
  | 'partnerDrawing'
  | 'waitingPartnerLever'
  | 'keypadFail'

/** Incomplete facility PA — never names the other pod’s next prop */
const HINTS_A: Record<HintId, string | null> = {
  gridOnline:
    'Grid is shared. Heavy devices eat free power and kill the lights for both of you.',
  codeKnown: "Don't lose those shards.",
  fuseLoot: 'Fuse acquired. Install it at the fuse bay when free power is high enough.',
  escaped: "You're out.",
  syncLost: 'Sync dropped. Hold again.',
  lightsOut: 'Lights out. Flashlight only.',
  wallWiped: 'Partner wiped something. Check the pedestal.',
  lightsDimmed: 'Free power tanked. Lights stay dead until it recovers.',
  lightsRestored: 'Lights are back.',
  partnerDrawing: 'Partner took grid power. You are in the dark.',
  waitingPartnerLever: 'Your lever is down. Waiting on the other pod.',
  keypadFail: 'Grid stuttered. Partner botched an input.',
}

const HINTS_B: Record<HintId, string | null> = {
  gridOnline:
    'Grid is shared. Keypad takes 80% while open. Partner goes dark.',
  codeKnown: 'Keypad wants four digits.',
  fuseLoot: null,
  escaped: "You're out.",
  syncLost: 'Partner let go. Start the hold again.',
  lightsOut: 'Lights out. Flashlight only.',
  wallWiped: 'That was only half the code.',
  lightsDimmed: 'Free power tanked. Lights stay dead until it recovers.',
  lightsRestored: 'Lights are back.',
  partnerDrawing: 'Partner took grid power. You are in the dark.',
  waitingPartnerLever: 'Your lever is down. Waiting on the other pod.',
  keypadFail: 'Wrong code. Wait for the fault to clear, then try again.',
}

export const HINT_DURATION_MS: Record<HintId, number> = {
  gridOnline: 3500,
  codeKnown: 2800,
  fuseLoot: 3800,
  escaped: 0,
  syncLost: 1800,
  lightsOut: 2200,
  wallWiped: 2800,
  lightsDimmed: 2200,
  lightsRestored: 1800,
  partnerDrawing: 2800,
  waitingPartnerLever: 2500,
  keypadFail: 2200,
}

/** Pod-local PA line, or null if this pod should hear nothing */
export function hintFor(pod: PodId, id: HintId): string | null {
  return pod === 'a' ? HINTS_A[id] : HINTS_B[id]
}
