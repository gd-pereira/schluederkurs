export type HintId =
  | 'gridOnline'
  | 'codeKnown'
  | 'fuseLoot'
  | 'escaped'
  | 'syncLost'
  | 'lightsOut'

export const HINTS: Record<HintId, string> = {
  gridOnline: "Grid online. Don't waste it.",
  codeKnown: 'Remember that. The other pod will need it.',
  fuseLoot: "Fuse acquired. Don't drop it.",
  escaped: 'Blast gate open. Try not to trip on the way out.',
  syncLost: 'Sync lost.',
  lightsOut: 'Lights out. Try not to trip.',
}

export const HINT_DURATION_MS: Record<HintId, number> = {
  gridOnline: 2000,
  codeKnown: 2500,
  fuseLoot: 2500,
  escaped: 0,
  syncLost: 1500,
  lightsOut: 0,
}

export function hintText(id: HintId): string {
  return HINTS[id]
}
