import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { footBottom } from '../game/collision'
import {
  BLACKOUT_HOLD_MS,
  FLASHLIGHT_RADIUS,
  FUSE_RESERVE,
  GATE_SYNC_MS,
  PLAYER_FOOT_H,
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
  type MatchFlags,
} from '../game/matchFlags'
import type { Interactable, LoopControls, MatchPhase } from '../game/types'
import {
  createBypassProp,
  createFusePanelProp,
  createKeypadProp,
  createLeverProp,
  createLockerProp,
  createPlaceholderCrate,
  createVaseProp,
  createWallProp,
  createWorldSolids,
  createWrenchProp,
} from '../game/world'
import { applyMatchEvent, isSoloMode, type MatchEvent, type PodId } from '../net/matchEvents'
import {
  connectWs,
  helloHost,
  helloJoin,
  sendGhost,
  sendMatchEvent,
  sendReady,
  type WsClient,
} from '../net/wsClient'
import EscapeOverlay from './EscapeOverlay'
import GateSlamOverlay from './GateSlamOverlay'
import LobbyOverlay, { type LobbyMode } from './LobbyOverlay'
import PartnerSim from './PartnerSim'
import PowerHud from './PowerHud'
import TaskModal from './TaskModal'
import BypassTask from './tasks/BypassTask'
import FuseTask from './tasks/FuseTask'
import KeypadTask from './tasks/KeypadTask'
import LeverTask from './tasks/LeverTask'
import LockerTask from './tasks/LockerTask'
import VaseTask from './tasks/VaseTask'
import WallTask from './tasks/WallTask'
import WrenchTask from './tasks/WrenchTask'

const crate = createPlaceholderCrate()
const lever = createLeverProp()
const wrench = createWrenchProp()
const vase = createVaseProp()
const locker = createLockerProp()
const fusePanel = createFusePanelProp()
const bypass = createBypassProp()
const wall = createWallProp()
const keypad = createKeypadProp()
const solids = createWorldSolids([
  crate,
  lever,
  wrench,
  vase,
  locker,
  fusePanel,
  bypass,
  wall,
  keypad,
])
const interactProps = {
  lever,
  wrench,
  vase,
  locker,
  fuse: fusePanel,
  bypass,
  wall,
  keypad,
}

const forceSolo = isSoloMode()

export default function WorldView() {
  const [phase, setPhase] = useState<MatchPhase>('lobby')
  const [openTaskId, setOpenTaskId] = useState<string | null>(null)
  const [aiToast, setAiToast] = useState<string | null>(null)
  const [flags, setFlags] = useState<MatchFlags>(() => createFlags())
  const [syncProgress, setSyncProgress] = useState(0)

  const [lobbyMode, setLobbyMode] = useState<LobbyMode>(
    forceSolo ? 'solo' : 'pick',
  )
  const [connectionMode, setConnectionMode] = useState<'solo' | 'online' | null>(
    forceSolo ? 'solo' : null,
  )
  const [pod, setPod] = useState<PodId>('a')
  const [roomCode, setRoomCode] = useState<string | null>(null)
  const [peers, setPeers] = useState(0)
  const [localReady, setLocalReady] = useState(false)
  const [peerReady, setPeerReady] = useState(false)
  const [lobbyStatus, setLobbyStatus] = useState<string | null>(null)

  const worldRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<HTMLDivElement>(null)
  const propRef = useRef<HTMLDivElement>(null)
  const leverRef = useRef<HTMLDivElement>(null)
  const promptRef = useRef<HTMLDivElement>(null)
  const ghostRef = useRef<HTMLDivElement>(null)
  const controlsRef = useRef<LoopControls>({
    phase: 'lobby',
    inputLocked: false,
    darkMode: false,
  })
  const interactablesRef = useRef<readonly Interactable[]>(
    activeInteractables(createFlags(), interactProps, 'a'),
  )
  const phaseRef = useRef(phase)
  const openTaskRef = useRef(openTaskId)
  const flagsRef = useRef(flags)
  const podRef = useRef(pod)
  const connectionRef = useRef(connectionMode)
  const wsRef = useRef<WsClient | null>(null)
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
  podRef.current = pod
  connectionRef.current = connectionMode

  const lockdownStarted =
    phase === 'blackout' || phase === 'play' || lockdownStartedRef.current

  controlsRef.current.phase = phase
  controlsRef.current.inputLocked = openTaskId !== null || flags.escaped
  controlsRef.current.darkMode = effectiveDark(flags, lockdownStarted)
  interactablesRef.current = activeInteractables(flags, interactProps, pod)

  const syncDarkToDom = useCallback((nextFlags: MatchFlags, lockedDown: boolean) => {
    const dark = effectiveDark(nextFlags, lockedDown)
    controlsRef.current.darkMode = dark
    if (worldRef.current) worldRef.current.dataset.dark = dark ? '1' : '0'
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

  const dispatch = useCallback(
    (event: MatchEvent, opts?: { remote?: boolean }) => {
      applyFlags((prev) => applyMatchEvent(prev, event))
      if (
        !opts?.remote &&
        connectionRef.current === 'online' &&
        wsRef.current
      ) {
        sendMatchEvent(wsRef.current, event)
      }
    },
    [applyFlags],
  )

  const closeWs = useCallback(() => {
    wsRef.current?.close()
    wsRef.current = null
  }, [])

  const openConnection = useCallback(
    (role: 'host' | 'join', code?: string) => {
      closeWs()
      const client = connectWs({
        onWelcome: ({ code: c, pod: assigned, peers: p }) => {
          setRoomCode(c)
          setPod(assigned)
          setPeers(p)
          setLobbyStatus(null)
          setConnectionMode('online')
          setLobbyMode(role === 'host' ? 'host' : 'join')
        },
        onError: (message) => setLobbyStatus(message),
        onPeerJoined: (p) => setPeers(p),
        onPeerLeft: (p) => {
          setPeers(p)
          setPeerReady(false)
          setLocalReady(false)
          setLobbyStatus('Partner left')
        },
        onReadyState: ({ pod: p, ready }) => {
          if (p !== podRef.current) setPeerReady(ready)
        },
        onStartLockdown: () => setPhase('gateSlam'),
        onMatchEvent: (event) => dispatch(event, { remote: true }),
        onGhost: (x, y) => {
          const el = ghostRef.current
          if (!el) return
          const gx = x - PLAYER_SPRITE_W / 2
          const gy = y + PLAYER_FOOT_H / 2 - PLAYER_SPRITE_H
          el.style.transform = `translate(${gx}px, ${gy}px)`
          el.style.opacity = '0.55'
          el.style.zIndex = String(Math.floor(y + PLAYER_FOOT_H / 2))
        },
        onClose: () => {
          if (phaseRef.current === 'lobby') setLobbyStatus('Disconnected')
        },
      })
      wsRef.current = client
      if (role === 'host') helloHost(client)
      else if (code) helloJoin(client, code)
    },
    [closeWs, dispatch],
  )

  const requestTask = useCallback((taskId: string) => {
    if (phaseRef.current !== 'play') return
    if (openTaskRef.current !== null) return
    if (flagsRef.current.escaped) return
    const f = flagsRef.current
    if (taskId === 'lever') {
      if (podRef.current === 'a' && f.leverA) return
      if (podRef.current === 'b' && f.leverB) return
    }
    if (taskId === 'wrench' && f.hasWrench) return
    if (taskId === 'vase' && f.vaseSmashed) return
    if (taskId === 'locker' && f.hasFuse) return
    if (taskId === 'fuse' && f.fuseInstalled) return
    if (taskId === 'wall' && f.wallWiped) return
    if (taskId === 'keypad' && f.keypadDone) return
    setOpenTaskId(taskId)
  }, [])

  const closeTask = useCallback(() => setOpenTaskId(null), [])

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
        dispatch({ type: 'escape', at: Date.now() })
      }
    }, 50)

    return () => window.clearInterval(id)
  }, [flags.bypassA, flags.bypassB, flags.fuseInstalled, flags.escaped, dispatch])

  const completeLocalLever = useCallback(() => {
    dispatch({ type: 'lever', side: podRef.current })
    setOpenTaskId(null)
  }, [dispatch])

  const completePartnerLever = useCallback(() => {
    dispatch({ type: 'lever', side: 'b' })
  }, [dispatch])

  const completePartnerWipe = useCallback(() => {
    dispatch({ type: 'wallWipe' })
  }, [dispatch])

  const completePartnerKeypadOpen = useCallback(() => {
    dispatch({ type: 'keypadReserve' })
  }, [dispatch])

  const completePartnerKeypadFinish = useCallback(() => {
    dispatch({ type: 'keypadDone' })
  }, [dispatch])

  const completePartnerYield = useCallback(() => {
    dispatch({ type: 'partnerYield' })
  }, [dispatch])

  const setPartnerBypass = useCallback(
    (held: boolean) => {
      dispatch({ type: 'bypass', side: 'b', held })
    },
    [dispatch],
  )

  const setLocalBypass = useCallback(
    (held: boolean) => {
      dispatch({ type: 'bypass', side: podRef.current, held })
    },
    [dispatch],
  )

  const completeWrench = useCallback(() => {
    dispatch({ type: 'wrench' })
    setOpenTaskId(null)
  }, [dispatch])

  const completeVaseSmash = useCallback(() => {
    dispatch({ type: 'vaseSmash' })
  }, [dispatch])

  const completeLocker = useCallback(() => {
    dispatch({ type: 'fuseLoot' })
    setOpenTaskId(null)
  }, [dispatch])

  const completeWall = useCallback(() => {
    dispatch({ type: 'wallWipe' })
    setOpenTaskId(null)
  }, [dispatch])

  const reserveFuse = useCallback(() => {
    dispatch({ type: 'fuseReserve' })
  }, [dispatch])

  const clearFuseReserve = useCallback(() => {
    if (flagsRef.current.fuseInstalled) return
    dispatch({ type: 'clearFuseReserve' })
  }, [dispatch])

  const installFuse = useCallback(() => {
    dispatch({ type: 'fuseInstalled' })
    setOpenTaskId(null)
  }, [dispatch])

  const reserveKeypad = useCallback(() => {
    dispatch({ type: 'keypadReserve' })
  }, [dispatch])

  const clearKeypadReserve = useCallback(() => {
    if (flagsRef.current.keypadDone) return
    dispatch({ type: 'partnerYield' })
  }, [dispatch])

  const completeKeypad = useCallback(() => {
    dispatch({ type: 'keypadDone' })
    setOpenTaskId(null)
  }, [dispatch])

  const toggleDebugDark = useCallback(() => {
    applyFlags((prev) => ({
      ...prev,
      debugForceDark: !prev.debugForceDark,
    }))
  }, [applyFlags])

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
      dispatch({ type: 'startedAt', at: Date.now() })
    }, BLACKOUT_HOLD_MS)
    return () => window.clearTimeout(id)
  }, [phase, dispatch])

  const onPose = useCallback((x: number, y: number) => {
    if (connectionRef.current !== 'online' || !wsRef.current) return
    sendGhost(wsRef.current, x, y)
  }, [])

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
      onPose,
    })

    return () => loop.stop()
  }, [requestTask, toggleDebugDark, onPose])

  const free = freePower(flags)
  const canReserveFuse = freePowerWithoutReserveA(flags) >= FUSE_RESERVE
  const escapeTimeMs =
    flags.escapedAt !== null && flags.startedAt !== null
      ? flags.escapedAt - flags.startedAt
      : 0
  const showPartnerSim = connectionMode === 'solo' && phase === 'play'

  function resetLobby() {
    closeWs()
    setLobbyMode(forceSolo ? 'solo' : 'pick')
    setConnectionMode(forceSolo ? 'solo' : null)
    setRoomCode(null)
    setPeers(0)
    setLocalReady(false)
    setPeerReady(false)
    setLobbyStatus(null)
    setPod('a')
  }

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
              opacity: (pod === 'b' ? flags.leverB : flags.leverA) ? 0.45 : 1,
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
              opacity: flags.hasWrench ? 0 : pod === 'b' ? 0.25 : 1,
              zIndex: Math.floor(footBottom(wrench.foot)),
            }}
            aria-hidden
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
              opacity: flags.vaseSmashed ? 0.5 : pod === 'b' ? 0.25 : 1,
              zIndex: Math.floor(footBottom(vase.foot)),
            }}
            aria-hidden
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
              opacity: flags.hasFuse ? 0.55 : pod === 'b' ? 0.25 : 1,
              zIndex: Math.floor(footBottom(locker.foot)),
            }}
            aria-hidden
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
              opacity: flags.fuseInstalled
                ? 0.55
                : flags.hasFuse && pod === 'a'
                  ? 1
                  : 0.3,
              zIndex: Math.floor(footBottom(fusePanel.foot)),
            }}
            aria-hidden
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
            className="absolute left-0 top-0 will-change-transform"
            style={{
              width: wall.sprite.w,
              height: wall.sprite.h,
              transform: `translate(${wall.sprite.x}px, ${wall.sprite.y}px)`,
              backgroundColor: wall.color,
              boxShadow: 'inset 0 0 0 2px #2a2418',
              borderRadius: 4,
              opacity: flags.wallWiped ? 0.4 : pod === 'b' || connectionMode === 'solo' ? 1 : 0.3,
              zIndex: Math.floor(footBottom(wall.foot)),
            }}
            aria-hidden
          />

          <div
            className="absolute left-0 top-0 will-change-transform"
            style={{
              width: keypad.sprite.w,
              height: keypad.sprite.h,
              transform: `translate(${keypad.sprite.x}px, ${keypad.sprite.y}px)`,
              backgroundColor: keypad.color,
              boxShadow: 'inset 0 0 0 2px #1a2030',
              borderRadius: 4,
              opacity: flags.keypadDone ? 0.45 : pod === 'b' || connectionMode === 'solo' ? 1 : 0.3,
              zIndex: Math.floor(footBottom(keypad.foot)),
            }}
            aria-hidden
          />

          <div
            ref={ghostRef}
            className="pointer-events-none absolute left-0 top-0 rounded-lg opacity-0 will-change-transform"
            style={{
              width: PLAYER_SPRITE_W,
              height: PLAYER_SPRITE_H,
              backgroundColor: '#c4a04b',
              boxShadow: 'inset 0 0 0 2px #3a2a08',
            }}
            aria-hidden
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

          {phase === 'lobby' && (
            <LobbyOverlay
              mode={lobbyMode}
              roomCode={roomCode}
              pod={pod}
              peers={peers}
              localReady={localReady}
              peerReady={peerReady}
              status={lobbyStatus}
              onChooseSolo={() => {
                setLobbyMode('solo')
                setConnectionMode('solo')
              }}
              onChooseHost={() => {
                setLobbyMode('host')
                setLobbyStatus(null)
                openConnection('host')
              }}
              onChooseJoin={() => {
                setLobbyMode('join')
                setLobbyStatus(null)
              }}
              onJoinSubmit={(code) => {
                if (code.length < 4) return
                openConnection('join', code)
              }}
              onToggleReady={() => {
                const next = !localReady
                setLocalReady(next)
                if (wsRef.current) sendReady(wsRef.current, next)
              }}
              onSoloReady={() => setPhase('gateSlam')}
              onBack={resetLobby}
            />
          )}
          {phase === 'gateSlam' && <GateSlamOverlay onDone={handleSlamDone} />}

          {aiToast && !flags.escaped && (
            <p className="pointer-events-none absolute bottom-8 left-1/2 z-[10070] -translate-x-1/2 rounded bg-black/80 px-4 py-2 text-sm text-amber-200">
              {aiToast}
            </p>
          )}

          {connectionMode === 'online' && phase === 'play' && (
            <p className="pointer-events-none absolute left-3 top-3 z-[10040] rounded bg-black/70 px-2 py-1 text-xs text-neutral-300">
              Pod {pod.toUpperCase()} · {roomCode}
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
          {openTaskId === 'wall' && (
            <TaskModal title="Grimy wall" onClose={closeTask}>
              <WallTask onComplete={completeWall} />
            </TaskModal>
          )}
          {openTaskId === 'keypad' && (
            <TaskModal title="Keypad" onClose={closeTask}>
              <KeypadTask
                reserved={flags.reserveB >= 80}
                onReserve={reserveKeypad}
                onClearReserve={clearKeypadReserve}
                onSuccess={completeKeypad}
              />
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
                localHeld={pod === 'a' ? flags.bypassA : flags.bypassB}
                partnerHeld={pod === 'a' ? flags.bypassB : flags.bypassA}
                syncProgress={syncProgress}
                onHoldChange={setLocalBypass}
              />
            </TaskModal>
          )}

          {flags.escaped && (
            <EscapeOverlay timeMs={escapeTimeMs} roomCode={roomCode} />
          )}
        </div>
      </div>

      <PartnerSim
        enabled={showPartnerSim}
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
