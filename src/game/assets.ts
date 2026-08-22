/**
 * Locked base room plates (empty furniture surfaces) + transparent prop overlays.
 * Never full-plate swap or big rectangular patches.
 *
 * Overlay filenames: item_wrench, item_rag, vase_intact, vase_shards
 * Modal art still uses modal_* names.
 */

const BASE = '/assets'

export function assetUrl(skillName: string): string {
  return `${BASE}/${skillName}.png`
}

export function roomPlateUrl(pod: 'a' | 'b'): string {
  return assetUrl(pod === 'a' ? 'pod_a' : 'pod_b')
}

/** Changeable world overlays (transparent PNGs) */
export const PROP_ASSET: Partial<Record<string, string>> = {
  wrench: 'item_wrench',
  rag: 'item_rag',
  vase: 'vase_intact',
  vase_shards: 'vase_shards',
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
