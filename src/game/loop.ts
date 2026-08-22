import {
  INTERACT_RADIUS,
  MOVE_SPEED,
  PLAYER_FOOT_H,
  PLAYER_FOOT_W,
  PLAYER_SPRITE_H,
  PLAYER_SPRITE_W,
  PLAYER_START_X,
  PLAYER_START_Y,
} from './constants'
import { footBottom, resolveMove } from './collision'
import { findNearestInteractable } from './interact'
import type { AABB, Interactable, LoopControls, Prop } from './types'

export type LoopHandles = {
  playerEl: HTMLElement
  propEl: HTMLElement
  leverEl: HTMLElement
  worldEl: HTMLElement
  promptEl: HTMLElement | null
}

export type LoopOptions = {
  handles: LoopHandles
  solids: readonly AABB[]
  crate: Prop
  interactables: readonly Interactable[]
  controls: LoopControls
  onRequestTask: (taskId: string) => void
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

export function startGameLoop(options: LoopOptions): GameLoop {
  const { handles, solids, crate, interactables, controls, onRequestTask } =
    options

  const keys = new Set<string>()
  let nearestTaskId: string | null = null
  let rafId = 0
  let lastTime = performance.now()

  const foot: AABB = {
    x: PLAYER_START_X,
    y: PLAYER_START_Y,
    w: PLAYER_FOOT_W,
    h: PLAYER_FOOT_H,
  }

  handles.propEl.style.zIndex = String(Math.floor(footBottom(crate.foot)))
  const lever = interactables.find((i) => i.id === 'lever')
  if (lever) {
    handles.leverEl.style.zIndex = String(Math.floor(footBottom(lever.foot)))
  }

  function writePlayerDom() {
    const pos = spriteTopLeftFromFoot(foot)
    handles.playerEl.style.transform = `translate(${pos.x}px, ${pos.y}px)`
    handles.playerEl.style.zIndex = String(Math.floor(footBottom(foot)))

    const fx = pos.x + PLAYER_SPRITE_W / 2
    const fy = pos.y + PLAYER_SPRITE_H * 0.4
    handles.worldEl.style.setProperty('--fx', `${fx}px`)
    handles.worldEl.style.setProperty('--fy', `${fy}px`)
  }

  function writeDarkMode() {
    handles.worldEl.dataset.dark = controls.darkMode ? '1' : '0'
  }

  function writePrompt(target: Interactable | null) {
    const el = handles.promptEl
    if (!el) return

    if (!target) {
      nearestTaskId = null
      el.style.opacity = '0'
      el.textContent = ''
      return
    }

    nearestTaskId = target.taskId
    const cx = target.sprite.x + target.sprite.w / 2
    const top = target.sprite.y - 28
    el.textContent = '[E]'
    el.style.opacity = '1'
    el.style.transform = `translate(${cx}px, ${top}px) translate(-50%, 0)`
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.repeat) return
    const key = e.key.toLowerCase()

    if (key === 'l') {
      controls.darkMode = !controls.darkMode
      writeDarkMode()
      return
    }

    if (key === 'e') {
      if (
        controls.phase === 'play' &&
        !controls.inputLocked &&
        nearestTaskId
      ) {
        onRequestTask(nearestTaskId)
      }
      e.preventDefault()
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

    const canMove = controls.phase === 'play' && !controls.inputLocked

    if (canMove) {
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

    if (controls.phase === 'play' && !controls.inputLocked) {
      writePrompt(
        findNearestInteractable(foot, interactables, INTERACT_RADIUS),
      )
    } else {
      writePrompt(null)
    }

    writeDarkMode()
    writePlayerDom()
    rafId = requestAnimationFrame(tick)
  }

  writePlayerDom()
  writeDarkMode()
  writePrompt(null)
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
