import {
  INTERACT_RADIUS,
  MOVE_SPEED,
  PLAYER_FOOT_H,
  PLAYER_FOOT_W,
  PLAYER_SPRITE_H,
  PLAYER_SPRITE_W,
  PLAYER_START_X,
  PLAYER_START_Y,
  PLAYER_WALK_BOB_PX,
  PLAYER_WALK_FPS,
} from './constants'
import { PLAYER_WALK_FRAMES } from './assets'
import { footBottom } from './collision'
import {
  findClearFootSpawn,
  footBlocked,
  resolveMoveMask,
  type CollisionMask,
} from './collisionMask'
import { findNearestInteractable } from './interact'
import type { AABB, Interactable, LoopControls } from './types'

const PROMPT_LABEL: Record<string, string> = {
  lever: 'Lever',
  wrench: 'Wrench',
  rag: 'Rag',
  vase: 'Vase',
  wall: 'Wall',
  keypad: 'Keypad',
  locker: 'Locker',
  fuse: 'Fuse',
  bypass: 'Bypass',
}

export type LoopHandles = {
  playerEl: HTMLElement
  worldEl: HTMLElement
  promptEl: HTMLElement | null
}

export type LoopOptions = {
  handles: LoopHandles
  /** Painted / border collision mask — mutate in place while painting */
  maskRef: { current: CollisionMask }
  interactablesRef: { current: readonly Interactable[] }
  onToggleDebugDark?: () => void
  onPose?: (x: number, y: number) => void
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
  const {
    handles,
    maskRef,
    interactablesRef,
    controls,
    onRequestTask,
    onToggleDebugDark,
    onPose,
  } = options

  const keys = new Set<string>()
  let nearestTaskId: string | null = null
  let rafId = 0
  let lastTime = performance.now()
  let lastPoseSent = 0
  let walkPhase = 0
  let facing: 1 | -1 = 1
  let frame = 0

  const foot: AABB = {
    x: PLAYER_START_X,
    y: PLAYER_START_Y,
    w: PLAYER_FOOT_W,
    h: PLAYER_FOOT_H,
  }

  /** Reseat when preferred spawn sits on solids (mask load / paint). */
  function seatOnClearGround() {
    const mask = maskRef.current
    if (!footBlocked(mask, foot)) return
    const clear = findClearFootSpawn(mask)
    foot.x = clear.x
    foot.y = clear.y
  }

  seatOnClearGround()
  let seatedMask: CollisionMask | null = maskRef.current

  function writePlayerDom(bobY = 0) {
    const pos = spriteTopLeftFromFoot(foot)
    const flip = facing < 0 ? ' scaleX(-1)' : ''
    handles.playerEl.style.transform = `translate(${pos.x}px, ${pos.y + bobY}px)${flip}`
    handles.playerEl.style.zIndex = String(Math.floor(footBottom(foot)))
    handles.playerEl.dataset.frame = String(frame)

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
    const label = PROMPT_LABEL[target.taskId] ?? target.taskId
    el.textContent = `[E] ${label}`
    el.style.opacity = '1'
    el.style.transform = `translate(${cx}px, ${top}px) translate(-50%, 0)`
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.repeat) return
    const target = e.target as HTMLElement | null
    if (
      target &&
      (target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable)
    ) {
      return
    }
    const key = e.key.toLowerCase()

    if (key === 'l') {
      if (onToggleDebugDark) {
        onToggleDebugDark()
      } else {
        controls.darkMode = !controls.darkMode
        writeDarkMode()
      }
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

    if (maskRef.current !== seatedMask) {
      seatedMask = maskRef.current
      seatOnClearGround()
    }

    const canMove = controls.phase === 'play' && !controls.inputLocked

    let moving = false
    let bobY = 0

    if (canMove) {
      let mx = 0
      let my = 0
      if (keys.has('a')) mx -= 1
      if (keys.has('d')) mx += 1
      if (keys.has('w')) my -= 1
      if (keys.has('s')) my += 1

      if (mx !== 0 || my !== 0) {
        moving = true
        if (mx !== 0) facing = mx < 0 ? -1 : 1
        const len = Math.hypot(mx, my)
        const dx = (mx / len) * MOVE_SPEED * dt
        const dy = (my / len) * MOVE_SPEED * dt
        const next = resolveMoveMask(foot, dx, dy, maskRef.current)
        foot.x = next.x
        foot.y = next.y
      }
    }

    if (moving) {
      walkPhase += dt * PLAYER_WALK_FPS
      // Frames 1–3 are stride poses; wrap within that band
      const stride = 1 + (Math.floor(walkPhase) % (PLAYER_WALK_FRAMES - 1))
      frame = stride
      bobY = Math.sin(walkPhase * Math.PI) * PLAYER_WALK_BOB_PX
    } else {
      walkPhase = 0
      frame = 0
      bobY = 0
    }

    if (controls.phase === 'play' && !controls.inputLocked) {
      writePrompt(
        findNearestInteractable(
          foot,
          interactablesRef.current,
          INTERACT_RADIUS,
        ),
      )
    } else {
      writePrompt(null)
    }

    writeDarkMode()
    writePlayerDom(bobY)
    if (onPose && now - lastPoseSent > 100) {
      lastPoseSent = now
      onPose(foot.x + foot.w / 2, foot.y + foot.h / 2)
    }
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
