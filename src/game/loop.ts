import {
  MOVE_SPEED,
  PLAYER_FOOT_H,
  PLAYER_FOOT_W,
  PLAYER_SPRITE_H,
  PLAYER_SPRITE_W,
  PLAYER_START_X,
  PLAYER_START_Y,
} from './constants'
import { footBottom, resolveMove } from './collision'
import type { AABB, Prop } from './types'

export type LoopHandles = {
  playerEl: HTMLElement
  propEl: HTMLElement
  lockedEl: HTMLElement | null
}

export type GameLoop = {
  stop: () => void
}

function spriteTopLeftFromFoot(foot: AABB): { x: number; y: number } {
  return {
    x: foot.x + PLAYER_FOOT_W / 2 - PLAYER_SPRITE_W / 2,
    y: foot.y + PLAYER_FOOT_H - PLAYER_SPRITE_H,
  }
}

export function startGameLoop(
  handles: LoopHandles,
  solids: readonly AABB[],
  prop: Prop,
): GameLoop {
  const keys = new Set<string>()
  let inputLocked = false
  let rafId = 0
  let lastTime = performance.now()

  const foot: AABB = {
    x: PLAYER_START_X,
    y: PLAYER_START_Y,
    w: PLAYER_FOOT_W,
    h: PLAYER_FOOT_H,
  }

  const propZ = Math.floor(footBottom(prop.foot))
  handles.propEl.style.zIndex = String(propZ)

  function writePlayerDom() {
    const pos = spriteTopLeftFromFoot(foot)
    handles.playerEl.style.transform = `translate(${pos.x}px, ${pos.y}px)`
    handles.playerEl.style.zIndex = String(Math.floor(footBottom(foot)))
  }

  function writeLockedHint() {
    if (!handles.lockedEl) return
    handles.lockedEl.textContent = inputLocked ? 'INPUT LOCKED (F)' : ''
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.repeat) return
    const key = e.key.toLowerCase()
    if (key === 'f') {
      inputLocked = !inputLocked
      writeLockedHint()
      return
    }
    if (key === 'w' || key === 'a' || key === 's' || key === 'd') {
      keys.add(key)
      e.preventDefault()
    }
  }

  function onKeyUp(e: KeyboardEvent) {
    const key = e.key.toLowerCase()
    keys.delete(key)
  }

  function tick(now: number) {
    const dt = Math.min((now - lastTime) / 1000, 0.05)
    lastTime = now

    if (!inputLocked) {
      let mx = 0
      let my = 0
      if (keys.has('a')) mx -= 1
      if (keys.has('d')) mx += 1
      if (keys.has('w')) my -= 1
      if (keys.has('s')) my += 1

      if (mx !== 0 || my !== 0) {
        const len = Math.hypot(mx, my)
        const dx = (mx / len) * MOVE_SPEED * dt
        const dy = (my / len) * MOVE_SPEED * dt
        const next = resolveMove(foot, dx, dy, solids)
        foot.x = next.x
        foot.y = next.y
      }
    }

    writePlayerDom()
    rafId = requestAnimationFrame(tick)
  }

  writePlayerDom()
  writeLockedHint()
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  rafId = requestAnimationFrame(tick)

  return {
    stop() {
      cancelAnimationFrame(rafId)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      keys.clear()
    },
  }
}
