export type Vec2 = {
  x: number
  y: number
}

/** Axis-aligned bounding box: x/y = top-left */
export type AABB = {
  x: number
  y: number
  w: number
  h: number
}

/** World prop: tall sprite + small foot collider for solids / Y-sort */
export type Prop = {
  id: string
  /** Sprite top-left and size (visual only) */
  sprite: AABB
  /** Footprint used for collision and Y-sort (foot bottom = y + h) */
  foot: AABB
  color: string
}

export type MatchPhase = 'landing' | 'blackout' | 'briefing' | 'play'

/** Prop that can open a task modal when in range */
export type Interactable = Prop & {
  taskId: string
}

/** Shared mutable controls read by the rAF loop (written by React) */
export type LoopControls = {
  phase: MatchPhase
  inputLocked: boolean
  darkMode: boolean
}
