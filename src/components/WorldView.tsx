import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { footBottom } from '../game/collision'
import {
  BLACKOUT_HOLD_MS,
  FLASHLIGHT_RADIUS,
  FUSE_RESERVE,
  GATE_SYNC_MS,
  PLAYER_SPRITE_H,
  PLAYER_SPRITE_W,
  WALL_THICKNESS,
  WORLD_H,
  WORLD_W,
} from '../game/constants'
import { startGameLoop } from '../game/loop'
import {
  activeInteractables,
  createFlags,
  effectiveDark,
  freePower,
  freePowerWithoutReserveA,
  withBypass,
  withClearFuseReserve,
  withEscape,
  withFuse,
  withFuseInstalled,
  withFuseReserve,
  withKeypadDone,
  withKeypadReserve,
  withLeverPulled,
  withPartnerYield,
  withStartedAt,
  withVaseSmashed,
  withWallWiped,
  withWrench,
  type MatchFlags,
} from '../game/matchFlags'
import type { Interactable, LoopControls, MatchPhase } from '../game/types'
import {
  createBypassProp,
  createFusePanelProp,
  createLeverProp,
  createLockerProp,
  createPlaceholderCrate,
  createVaseProp,
  createWorldSolids,
  createWrenchProp,
} from '../game/world'
import EscapeOverlay from './EscapeOverlay'
import GateSlamOverlay from './GateSlamOverlay'
import LobbyOverlay from './LobbyOverlay'
import PartnerSim from './PartnerSim'
import PowerHud from './PowerHud'
import TaskModal from './TaskModal'
import BypassTask from './tasks/BypassTask'
import FuseTask from './tasks/FuseTask'
import LeverTask from './tasks/LeverTask'
import LockerTask from './tasks/LockerTask'
import VaseTask from './tasks/VaseTask'
import WrenchTask from './tasks/WrenchTask'

const crate = createPlaceholderCrate()
const lever = createLeverProp()
const wrench = createWrenchProp()
const vase = createVaseProp()
const locker = createLockerProp()
const fusePanel = createFusePanelProp()
const bypass = createBypassProp()
const solids = createWorldSolids([
  crate,
  lever,
  wrench,
  vase,
  locker,
  fusePanel,
  bypass,
])
const interactProps = {
  lever,
  wrench,
  vase,
  locker,
  fuse: fusePanel,
  bypass,
}

export default function WorldView() {
  const [phase, setPhase] = useState<MatchPhase>('lobby')
  const [openTaskId, setOpenTaskId] = useState<string | null>(null)
  const [aiToast, setAiToast] = useState<string | null>(null)
  const [flags, setFlags] = useState<MatchFlags>(() => createFlags())
  const [syncProgress, setSyncProgress] = useState(0)

  const worldRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<HTMLDivElement>(null)
  const propRef = useRef<HTMLDivElement>(null)
  const leverRef = useRef<HTMLDivElement>(null)
  const promptRef = useRef<HTMLDivElement>(null)
  const controlsRef = useRef<LoopControls>({
    phase: 'lobby',
    inputLocked: false,
    darkMode: false,
  })
  const interactablesRef = useRef<readonly Interactable[]>(
    activeInteractables(createFlags(), interactProps),
  )
  const phaseRef = useRef(phase)
  const openTaskRef = useRef(openTaskId)
  const flagsRef = useRef(flags)
  const lockdownStartedRef = useRef(false)
  const sawGridToast = useRef(false)
  const sawCodeToast = useRef(false)
  const sawFuseToast = useRef(false)
  const sawEscapeToast = useRef(false)
  const syncStartedAtRef = useRef<number | null>(null)
  const wasSyncingRef = useRef(false)

  phaseRef.current = phase
  openTaskRef.current = openTaskId
  flagsRef.current = flags

  const lockdownStarted =
    phase === 'blackout' || phase === 'play' || lockdownStartedRef.current

  controlsRef.current.phase = phase
  controlsRef.current.inputLocked = openTaskId !== null || flags.escaped
  controlsRef.current.darkMode = effectiveDark(flags, lockdownStarted)
  interactablesRef.current = activeInteractables(flags, interactProps)

  const syncDarkToDom = useCallback((nextFlags: MatchFlags, lockedDown: boolean) => {
    const dark = effectiveDark(nextFlags, lockedDown)
    controlsRef.current.darkMode = dark
    if (worldRef.current) worldRef.current.dataset.dark = dark ? '1' : '0'
  }, [])

  const requestTask = useCallback((taskId: string) => {
    if (phaseRef.current !== 'play') return
    if (openTaskRef.current !== null) return
    if (flagsRef.current.escaped) return
    const f = flagsRef.current
    if (taskId === 'lever' && f.leverA) return
    if (taskId === 'wrench' && f.hasWrench) return
    if (taskId === 'vase' && f.vaseSmashed) return
    if (taskId === 'locker' && f.hasFuse) return
    if (taskId === 'fuse' && f.fuseInstalled) return
    if (taskId === 'bypass' && f.escaped) return
    setOpenTaskId(taskId)
  }, [])

  const closeTask = useCallback(() => {
    setOpenTaskId(null)
  }, [])

  const applyFlags = useCallback(
    (updater: (prev: MatchFlags) => MatchFlags) => {
      setFlags((prev) => {
        const next = updater(prev)
        const locked =
          lockdownStartedRef.current ||
          phaseRef.current === 'blackout' ||
          phaseRef.current === 'play'
        syncDarkToDom(next, locked)
        return next
      })
    },
    [syncDarkToDom],
  )

  useEffect(() => {
    if (!flags.gridOnline || sawGridToast.current) return
    sawGridToast.current = true
    setAiToast("Grid online. Don't waste it.")
    const id = window.setTimeout(() => setAiToast(null), 2000)
    return () => window.clearTimeout(id)
  }, [flags.gridOnline])

  useEffect(() => {
    if (!flags.codeKnown || sawCodeToast.current) return
    sawCodeToast.current = true
    setAiToast('Remember that. The other pod will need it.')
    const id = window.setTimeout(() => setAiToast(null), 2500)
    return () => window.clearTimeout(id)
  }, [flags.codeKnown])

  useEffect(() => {
    if (!flags.hasFuse || sawFuseToast.current) return
    sawFuseToast.current = true
    setAiToast("Fuse acquired. Don't drop it.")
    const id = window.setTimeout(() => setAiToast(null), 2500)
    return () => window.clearTimeout(id)
  }, [flags.hasFuse])

  useEffect(() => {
    if (!flags.escaped || sawEscapeToast.current) return
    sawEscapeToast.current = true
    setAiToast('Blast gate open. Try not to trip on the way out.')
    setOpenTaskId(null)
  }, [flags.escaped])

  // Dual bypass sync timer
  useEffect(() => {
    if (flags.escaped || !flags.fuseInstalled) {
      syncStartedAtRef.current = null
      setSyncProgress(0)
      wasSyncingRef.current = false
      return
    }

    const both = flags.bypassA && flags.bypassB
    if (!both) {
      if (wasSyncingRef.current) {
        setAiToast('Sync lost.')
        window.setTimeout(() => setAiToast(null), 1500)
      }
      wasSyncingRef.current = false
      syncStartedAtRef.current = null
      setSyncProgress(0)
      return
    }

    wasSyncingRef.current = true
    if (syncStartedAtRef.current === null) {
      syncStartedAtRef.current = performance.now()
    }

    const id = window.setInterval(() => {
      const start = syncStartedAtRef.current
      if (start === null) return
      if (!flagsRef.current.bypassA || !flagsRef.current.bypassB) return
      const elapsed = performance.now() - start
      setSyncProgress(Math.min(1, elapsed / GATE_SYNC_MS))
      if (elapsed >= GATE_SYNC_MS && !flagsRef.current.escaped) {
        applyFlags((prev) => withEscape(prev, Date.now()))
      }
    }, 50)

    return () => window.clearInterval(id)
  }, [flags.bypassA, flags.bypassB, flags.fuseInstalled, flags.escaped, applyFlags])

  const completeLocalLever = useCallback(() => {
    applyFlags((prev) => withLeverPulled(prev, 'a'))
    setOpenTaskId(null)
  }, [applyFlags])

  const completePartnerLever = useCallback(() => {
    applyFlags((prev) => withLeverPulled(prev, 'b'))
  }, [applyFlags])

  const completePartnerWipe = useCallback(() => {
    applyFlags((prev) => withWallWiped(prev))
  }, [applyFlags])

  const completePartnerKeypadOpen = useCallback(() => {
    applyFlags((prev) => withKeypadReserve(prev))
  }, [applyFlags])

  const completePartnerKeypadFinish = useCallback(() => {
    applyFlags((prev) => withKeypadDone(prev))
  }, [applyFlags])

  const completePartnerYield = useCallback(() => {
    applyFlags((prev) => withPartnerYield(prev))
  }, [applyFlags])

  const setPartnerBypass = useCallback(
    (held: boolean) => {
      applyFlags((prev) => withBypass(prev, 'b', held))
    },
    [applyFlags],
  )

  const setLocalBypass = useCallback(
    (held: boolean) => {
      applyFlags((prev) => withBypass(prev, 'a', held))
    },
    [applyFlags],
  )

  const completeWrench = useCallback(() => {
    applyFlags((prev) => withWrench(prev))
    setOpenTaskId(null)
  }, [applyFlags])

  const completeVaseSmash = useCallback(() => {
    applyFlags((prev) => withVaseSmashed(prev))
  }, [applyFlags])

  const completeLocker = useCallback(() => {
    applyFlags((prev) => withFuse(prev))
    setOpenTaskId(null)
  }, [applyFlags])

  const reserveFuse = useCallback(() => {
    applyFlags((prev) => withFuseReserve(prev))
  }, [applyFlags])

  const clearFuseReserve = useCallback(() => {
    applyFlags((prev) =>
      prev.fuseInstalled ? prev : withClearFuseReserve(prev),
    )
  }, [applyFlags])

  const installFuse = useCallback(() => {
    applyFlags((prev) => withFuseInstalled(prev))
    setOpenTaskId(null)
  }, [applyFlags])

  const toggleDebugDark = useCallback(() => {
    applyFlags((prev) => ({
      ...prev,
      debugForceDark: !prev.debugForceDark,
    }))
  }, [applyFlags])

  const handleReady = useCallback(() => {
    setPhase('gateSlam')
  }, [])

  const handleSlamDone = useCallback(() => {
    lockdownStartedRef.current = true
    controlsRef.current.darkMode = true
    if (worldRef.current) worldRef.current.dataset.dark = '1'
    setPhase('blackout')
    setAiToast('Lights out. Try not to trip.')
  }, [])

  useEffect(() => {
    if (phase !== 'blackout') return
    const id = window.setTimeout(() => {
      setPhase('play')
      setAiToast(null)
      applyFlags((prev) => withStartedAt(prev, Date.now()))
    }, BLACKOUT_HOLD_MS)
    return () => window.clearTimeout(id)
  }, [phase, applyFlags])

  useEffect(() => {
    const worldEl = worldRef.current
    const playerEl = playerRef.current
    const propEl = propRef.current
    const leverEl = leverRef.current
    if (!worldEl || !playerEl || !propEl || !leverEl) return

    const loop = startGameLoop({
      handles: {
        worldEl,
        playerEl,
        propEl,
        leverEl,
        promptEl: promptRef.current,
      },
      solids,
      crate,
      interactablesRef,
      controls: controlsRef.current,
      onRequestTask: requestTask,
      onToggleDebugDark: toggleDebugDark,
    })

    return () => loop.stop()
  }, [requestTask, toggleDebugDark])

  const free = freePower(flags)
  const canReserveFuse = freePowerWithoutReserveA(flags) >= FUSE_RESERVE
  const escapeTimeMs =
    flags.escapedAt !== null && flags.startedAt !== null
      ? flags.escapedAt - flags.startedAt
      : 0

  return (
    <div>
      <div className="relative" style={{ width: WORLD_W, height: WORLD_H }}>
        <div
          ref={worldRef}
          className="pod-world relative overflow-hidden rounded-sm border border-neutral-700 bg-neutral-900"
          data-dark="0"
          style={
            {
              width: WORLD_W,
              height: WORLD_H,
              '--fx': `${WORLD_W / 2}px`,
              '--fy': `${WORLD_H / 2}px`,
              '--flashlight-r': `${FLASHLIGHT_RADIUS}px`,
            } as CSSProperties
          }
        >
          <div
            className="pointer-events-none absolute inset-x-0 top-0 bg-neutral-700"
            style={{ height: WALL_THICKNESS }}
          />
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 bg-neutral-700"
            style={{ height: WALL_THICKNESS }}
          />
          <div
            className="pointer-events-none absolute inset-y-0 left-0 bg-neutral-700"
            style={{ width: WALL_THICKNESS }}
          />
          <div
            className="pointer-events-none absolute inset-y-0 right-0 bg-neutral-700"
            style={{ width: WALL_THICKNESS }}
          />

          <div
            className="pointer-events-none absolute inset-0 opacity-30"
            style={{
              top: WALL_THICKNESS,
              left: WALL_THICKNESS,
              right: WALL_THICKNESS,
              bottom: WALL_THICKNESS,
              backgroundImage:
                'linear-gradient(to right, #3f3f46 1px, transparent 1px), linear-gradient(to bottom, #3f3f46 1px, transparent 1px)',
              backgroundSize: '64px 64px',
            }}
          />

          <div
            ref={propRef}
            className="absolute left-0 top-0 will-change-transform"
            style={{
              width: crate.sprite.w,
              height: crate.sprite.h,
              transform: `translate(${crate.sprite.x}px, ${crate.sprite.y}px)`,
              backgroundColor: crate.color,
              boxShadow: 'inset 0 0 0 2px #1a1208',
              zIndex: Math.floor(footBottom(crate.foot)),
            }}
            aria-hidden
          />

          <div
            ref={leverRef}
            className="absolute left-0 top-0 will-change-transform"
            style={{
              width: lever.sprite.w,
              height: lever.sprite.h,
              transform: `translate(${lever.sprite.x}px, ${lever.sprite.y}px)`,
              backgroundColor: lever.color,
              boxShadow: 'inset 0 0 0 2px #3a1808',
              borderRadius: 4,
              opacity: flags.leverA ? 0.45 : 1,
              zIndex: Math.floor(footBottom(lever.foot)),
            }}
            aria-label="Lever"
          />

          <div
            className="absolute left-0 top-0 will-change-transform"
            style={{
              width: wrench.sprite.w,
              height: wrench.sprite.h,
              transform: `translate(${wrench.sprite.x}px, ${wrench.sprite.y}px)`,
              backgroundColor: wrench.color,
              boxShadow: 'inset 0 0 0 2px #2a3038',
              borderRadius: 4,
              opacity: flags.hasWrench ? 0 : 1,
              zIndex: Math.floor(footBottom(wrench.foot)),
            }}
            aria-label="Wrench"
            aria-hidden={flags.hasWrench}
          />

          <div
            className="absolute left-0 top-0 will-change-transform"
            style={{
              width: vase.sprite.w,
              height: vase.sprite.h,
              transform: `translate(${vase.sprite.x}px, ${vase.sprite.y}px)`,
              backgroundColor: flags.vaseSmashed ? '#3a2848' : vase.color,
              boxShadow: 'inset 0 0 0 2px #2a1838',
              borderRadius: 6,
              opacity: flags.vaseSmashed ? 0.5 : 1,
              zIndex: Math.floor(footBottom(vase.foot)),
            }}
            aria-label="Vase"
          />

          <div
            className="absolute left-0 top-0 will-change-transform"
            style={{
              width: locker.sprite.w,
              height: locker.sprite.h,
              transform: `translate(${locker.sprite.x}px, ${locker.sprite.y}px)`,
              backgroundColor: flags.hasFuse ? '#2a3a32' : locker.color,
              boxShadow: 'inset 0 0 0 2px #1a2820',
              borderRadius: 4,
              opacity: flags.hasFuse ? 0.55 : 1,
              zIndex: Math.floor(footBottom(locker.foot)),
            }}
            aria-label="Locker"
          />

          <div
            className="absolute left-0 top-0 will-change-transform"
            style={{
              width: fusePanel.sprite.w,
              height: fusePanel.sprite.h,
              transform: `translate(${fusePanel.sprite.x}px, ${fusePanel.sprite.y}px)`,
              backgroundColor: flags.fuseInstalled ? '#5c3d0e' : fusePanel.color,
              boxShadow: 'inset 0 0 0 2px #3a2208',
              borderRadius: 4,
              opacity: flags.fuseInstalled ? 0.55 : flags.hasFuse ? 1 : 0.35,
              zIndex: Math.floor(footBottom(fusePanel.foot)),
            }}
            aria-label="Fuse panel"
          />

          <div
            className="absolute left-0 top-0 will-change-transform"
            style={{
              width: bypass.sprite.w,
              height: bypass.sprite.h,
              transform: `translate(${bypass.sprite.x}px, ${bypass.sprite.y}px)`,
              backgroundColor: flags.escaped ? '#0f2940' : bypass.color,
              boxShadow: 'inset 0 0 0 2px #0a1a2e',
              borderRadius: 6,
              opacity: flags.fuseInstalled ? 1 : 0.35,
              zIndex: Math.floor(footBottom(bypass.foot)),
            }}
            aria-label="Bypass console"
          />

          <div
            ref={playerRef}
            className="absolute left-0 top-0 will-change-transform"
            style={{
              width: PLAYER_SPRITE_W,
              height: PLAYER_SPRITE_H,
              backgroundColor: '#4bc4c0',
              boxShadow: 'inset 0 0 0 2px #0c1014',
              borderRadius: 8,
            }}
            aria-label="Player"
          />

          <div
            ref={promptRef}
            className="pointer-events-none absolute left-0 top-0 z-[5000] text-sm font-bold tracking-wide text-amber-300 opacity-0 will-change-transform"
            style={{ textShadow: '0 1px 2px #000' }}
            aria-hidden
          />

          <div className="flashlight-overlay" aria-hidden />

          <PowerHud
            visible={flags.gridOnline}
            free={free}
            reserveYou={flags.reserveA}
            reservePartner={flags.reserveB}
          />

          {phase === 'lobby' && <LobbyOverlay onReady={handleReady} />}
          {phase === 'gateSlam' && <GateSlamOverlay onDone={handleSlamDone} />}

          {aiToast && !flags.escaped && (
            <p className="pointer-events-none absolute bottom-8 left-1/2 z-[10070] -translate-x-1/2 rounded bg-black/80 px-4 py-2 text-sm text-amber-200">
              {aiToast}
            </p>
          )}

          {openTaskId === 'lever' && (
            <TaskModal title="Local lever" onClose={closeTask}>
              <LeverTask onComplete={completeLocalLever} />
            </TaskModal>
          )}
          {openTaskId === 'wrench' && (
            <TaskModal title="Wrench" onClose={closeTask}>
              <WrenchTask onComplete={completeWrench} />
            </TaskModal>
          )}
          {openTaskId === 'vase' && (
            <TaskModal title="Vase" onClose={closeTask}>
              <VaseTask
                alreadySmashed={flags.vaseSmashed}
                canSmash={flags.hasWrench && flags.wallWiped}
                onSmash={completeVaseSmash}
              />
            </TaskModal>
          )}
          {openTaskId === 'locker' && (
            <TaskModal title="Locker" onClose={closeTask}>
              <LockerTask onComplete={completeLocker} />
            </TaskModal>
          )}
          {openTaskId === 'fuse' && (
            <TaskModal title="Fuse bay" onClose={closeTask}>
              <FuseTask
                canReserve={canReserveFuse}
                reserved={flags.reserveA >= FUSE_RESERVE}
                onReserve={reserveFuse}
                onInstall={installFuse}
                onClearReserve={clearFuseReserve}
              />
            </TaskModal>
          )}
          {openTaskId === 'bypass' && (
            <TaskModal
              title="Gate bypass"
              onClose={() => {
                setLocalBypass(false)
                closeTask()
              }}
            >
              <BypassTask
                localHeld={flags.bypassA}
                partnerHeld={flags.bypassB}
                syncProgress={syncProgress}
                onHoldChange={setLocalBypass}
              />
            </TaskModal>
          )}

          {flags.escaped && <EscapeOverlay timeMs={escapeTimeMs} />}
        </div>
      </div>

      <PartnerSim
        enabled={phase === 'play'}
        partnerLeverDone={flags.leverB}
        onPartnerLever={completePartnerLever}
        gridOn={flags.gridOnline}
        wallWiped={flags.wallWiped}
        onPartnerWipe={completePartnerWipe}
        codeKnown={flags.codeKnown}
        keypadDone={flags.keypadDone}
        partnerKeypadOpen={flags.reserveB > 0 && !flags.keypadDone}
        onPartnerKeypadOpen={completePartnerKeypadOpen}
        onPartnerKeypadFinish={completePartnerKeypadFinish}
        partnerReserve={flags.reserveB}
        onPartnerYield={completePartnerYield}
        fuseInstalled={flags.fuseInstalled}
        partnerBypassHeld={flags.bypassB}
        onPartnerBypassHold={setPartnerBypass}
        escaped={flags.escaped}
      />
    </div>
  )
}
