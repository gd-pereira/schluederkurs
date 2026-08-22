/**
 * Friend drops PNGs into public/assets/ using these skill filenames:
 * breaker_box, vase_pedestal, painting, gate_console, locker, cart,
 * item_lever, item_rag, item_wrench, item_fuse,
 * modal_grime_wall, modal_vase_1..4, modal_keypad
 * Missing files fall back to colored placeholders (no broken icons).
 */

const BASE = '/assets'

export function assetUrl(skillName: string): string {
  return `${BASE}/${skillName}.png`
}

/** World prop id → skill filename (crate stays color-only) */
export const PROP_ASSET: Partial<Record<string, string>> = {
  lever: 'item_lever',
  rag: 'item_rag',
  wrench: 'item_wrench',
  fuse: 'item_fuse',
  vase: 'vase_pedestal',
  keypad: 'painting',
  bypass: 'gate_console',
  locker: 'locker',
  cart: 'cart',
  breaker: 'breaker_box',
}

export const MODAL_ASSET = {
  wall: 'modal_grime_wall',
  vase: 'modal_vase_1',
  keypad: 'modal_keypad',
} as const

export function propAssetUrl(propId: string): string | null {
  const name = PROP_ASSET[propId]
  return name ? assetUrl(name) : null
}

export function modalAssetUrl(key: keyof typeof MODAL_ASSET): string {
  return assetUrl(MODAL_ASSET[key])
}
