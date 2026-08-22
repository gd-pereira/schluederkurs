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
    'Grid shared 100%. Heavy devices steal free power — lights die for both of you.',
  codeKnown: 'Don’t lose those shards.',
  fuseLoot: 'Fuse bay needs 70% free. If partner’s keypad is open, make them yield.',
  escaped: "You're out. Try not to trip on the way.",
  syncLost: 'Tone dropped. Hold again.',
  lightsOut: 'Lights out. Flashlight only.',
  wallWiped: 'Partner cleared something. Check what’s on the pedestal.',
  lightsDimmed: 'Free power collapsed — lights dead until the grid recovers.',
  lightsRestored: 'Lights back. Free power climbed again.',
  partnerDrawing: 'Partner just hogged the grid. You’re in the dark.',
  waitingPartnerLever: 'Your lever is down. Waiting on the other pod…',
  keypadFail: 'Grid stuttered. Partner mangled an input.',
}

const HINTS_B: Record<HintId, string | null> = {
  gridOnline:
    'Grid shared 100%. Your keypad eats 80% while open — partner goes dark.',
  codeKnown: 'Painting circuit armed. It wants four digits.',
  fuseLoot: null,
  escaped: "You're out. Try not to trip on the way.",
  syncLost: 'Partner slipped. Reset the hold.',
  lightsOut: 'Lights out. Flashlight only.',
  wallWiped: 'You wiped an order, not a full code.',
  lightsDimmed: 'Free power collapsed — lights dead until the grid recovers.',
  lightsRestored: 'Lights back. Free power climbed again.',
  partnerDrawing: 'Partner just hogged the grid. You’re in the dark.',
  waitingPartnerLever: 'Your lever is down. Waiting on the other pod…',
  keypadFail: 'Wrong input. Grid hiccup — try again when it settles.',
}

export const HINT_DURATION_MS: Record<HintId, number> = {
  gridOnline: 3500,
  codeKnown: 2800,
  fuseLoot: 3200,
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
