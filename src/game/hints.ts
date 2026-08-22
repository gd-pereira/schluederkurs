export type HintId =
  | 'gridOnline'
  | 'codeKnown'
  | 'fuseLoot'
  | 'escaped'
  | 'syncLost'
  | 'lightsOut'
  | 'wallWiped'
  | 'lightsDimmed'
  | 'waitingPartnerLever'

export const HINTS: Record<HintId, string> = {
  gridOnline: "Grid online. Don't waste it.",
  codeKnown: 'Remember that. The other pod will need it.',
  fuseLoot: "Fuse acquired. Don't drop it.",
  escaped: 'Blast gate open. Try not to trip on the way out.',
  syncLost: 'Sync lost.',
  lightsOut: 'Lights out. Try not to trip.',
  wallWiped: 'Wall clear. Smash that vase when you have a wrench.',
  lightsDimmed: 'Grid strained. Free power dropped — lights may stay dark.',
  waitingPartnerLever: 'Your lever is down. Waiting on the other pod…',
}

export const HINT_DURATION_MS: Record<HintId, number> = {
  gridOnline: 2000,
  codeKnown: 2500,
  fuseLoot: 2500,
  escaped: 0,
  syncLost: 1500,
  lightsOut: 2000,
  wallWiped: 2500,
  lightsDimmed: 2000,
  waitingPartnerLever: 2500,
}

export function hintText(id: HintId): string {
  return HINTS[id]
}
