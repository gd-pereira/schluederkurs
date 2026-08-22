import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react'
import { createPortal } from 'react-dom'
import {
  BLACKOUT_HOLD_MS,
  FLASHLIGHT_RADIUS,
  FUSE_RESERVE,
  GATE_SYNC_MS,
  KEYPAD_RESERVE,
  PLAYER_SPRITE_H,
  PLAYER_SPRITE_W,
  WORLD_H,
  WORLD_W,
} from '../game/constants'
import { playerAssetUrl, collisionMaskUrl } from '../game/assets'
import {
  createBorderMask,
  loadCollisionMask,
  type CollisionMask,
} from '../game/collisionMask'
import { HINT_DURATION_MS, hintFor, type HintId } from '../game/hints'
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
import { createPodWorld } from '../game/world'
import {
  applyMatchEvent,
  isSoloMode,
  type MatchEvent,
  type PodId,
} from '../net/matchEvents'
import {
  connectWs,
  helloHost,
  helloJoin,
  sendMatchEvent,
  sendReady,
  type WsClient,
} from '../net/wsClient'
import EscapeOverlay from './EscapeOverlay'
import BriefingSequence from './BriefingSequence'
import CollisionMaskTool from './CollisionMaskTool'
import LandingHub, { type LobbyMode } from './LandingHub'
import PartnerSim from './PartnerSim'
import PodPropSprites from './PodPropSprites'
import PowerHud from './PowerHud'
import PowerStrainBanner from './PowerStrainBanner'
import PropPlaceTool from './PropPlaceTool'
import RoomPlateLayers from './RoomPlateLayers'
import TaskModal from './TaskModal'
import TypewriterText from './TypewriterText'
import BypassTask from './tasks/BypassTask'
import FuseTask from './tasks/FuseTask'
import KeypadTask from './tasks/KeypadTask'
import LeverTask from './tasks/LeverTask'
import LockerTask from './tasks/LockerTask'
import RagTask from './tasks/RagTask'
import VaseTask from './tasks/VaseTask'
import WallTask from './tasks/WallTask'
import WrenchTask from './tasks/WrenchTask'

const forceSolo = isSoloMode()

export default function WorldView() {
  const [phase, setPhase] = useState<MatchPhase>('landing')
  const [openTaskId, setOpenTaskId] = useState<string | null>(null)
  const [aiToast, setAiToast] = useState<string | null>(null)
  const [flags, setFlags] = useState<MatchFlags>(() => createFlags())
  const [syncProgress, setSyncProgress] = useState(0)
  const [matchBroken, setMatchBroken] = useState(false)
  const [facilityFlicker, setFacilityFlicker] = useState(0)
  const [lightsReveal, setLightsReveal] = useState(0)

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
  const promptRef = useRef<HTMLDivElement>(null)
  const ghostRef = useRef<HTMLDivElement>(null)
  const controlsRef = useRef<LoopControls>({
    phase: 'landing',
    inputLocked: false,
    darkMode: false,
  })
  // Recreate each render — layout constants are tiny and HMR must pick up pin tweaks
  const podWorld = createPodWorld(pod)
  const maskRef = useRef<CollisionMask>(createBorderMask())
  const [maskEpoch, setMaskEpoch] = useState(0)
  const interactablesRef = useRef<readonly Interactable[]>(
    activeInteractables(createFlags(), createPodWorld('a').byId, 'a'),
  )
  const phaseRef = useRef(phase)
  const openTaskRef = useRef(openTaskId)
  const flagsRef = useRef(flags)
  const podRef = useRef(pod)
  const connectionRef = useRef(connectionMode)
  const wsRef = useRef<WsClient | null>(null)
  const intentionalCloseRef = useRef(false)
  const lockdownStartedRef = useRef(false)
  const sawGridToast = useRef(false)
  const sawCodeToast = useRef(false)
  const sawFuseToast = useRef(false)
  const sawWallToast = useRef(false)
  const sawDimToast = useRef(false)
  const sawWaitLeverToast = useRef(false)
  const sawKeypadFailToast = useRef(false)
  const lightsWereOnRef = useRef(false)
  const prevLightsOnRef = useRef(false)
  const prevPartnerReserveRef = useRef(0)
  const syncStartedAtRef = useRef<number | null>(null)
  const wasSyncingRef = useRef(false)
  const toastClearRef = useRef<number | null>(null)
  const toastHoldMsRef = useRef(0)

  phaseRef.current = phase
  openTaskRef.current = openTaskId
  flagsRef.current = flags
  podRef.current = pod
  connectionRef.current = connectionMode

  const lockdownStarted =
    phase === 'blackout' ||
    phase === 'briefing' ||
    phase === 'play' ||
    lockdownStartedRef.current
  const worldVisible = phase === 'play'

  controlsRef.current.phase = phase
  controlsRef.current.inputLocked =
    openTaskId !== null || flags.escaped || matchBroken
  controlsRef.current.darkMode = effectiveDark(flags, lockdownStarted)
  interactablesRef.current = activeInteractables(flags, podWorld.byId, pod)

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
          phaseRef.current === 'briefing' ||
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
    intentionalCloseRef.current = true
    const prev = wsRef.current
    wsRef.current = null
    prev?.close()
    // close() is async — keep the flag until after the close event can fire
    window.setTimeout(() => {
      intentionalCloseRef.current = false
    }, 50)
  }, [])

  const resetMatch = useCallback(() => {
    if (toastClearRef.current !== null) {
      window.clearTimeout(toastClearRef.current)
      toastClearRef.current = null
    }
    closeWs()
    setFlags(createFlags())
    setPhase('landing')
    setOpenTaskId(null)
    setAiToast(null)
    setSyncProgress(0)
    setMatchBroken(false)
    setLightsReveal(0)
    lockdownStartedRef.current = false
    sawGridToast.current = false
    sawCodeToast.current = false
    sawFuseToast.current = false
    sawWallToast.current = false
    sawDimToast.current = false
    sawWaitLeverToast.current = false
    sawKeypadFailToast.current = false
    lightsWereOnRef.current = false
    syncStartedAtRef.current = null
    wasSyncingRef.current = false
    if (worldRef.current) worldRef.current.dataset.dark = '0'
    controlsRef.current.darkMode = false
    setLobbyMode(forceSolo ? 'solo' : 'pick')
    setConnectionMode(forceSolo ? 'solo' : null)
    setRoomCode(null)
    setPeers(0)
    setLocalReady(false)
    setPeerReady(false)
    setLobbyStatus(null)
    setPod('a')
    if (ghostRef.current) ghostRef.current.style.opacity = '0'
  }, [closeWs])

  const breakMatch = useCallback(() => {
    if (phaseRef.current === 'landing') return
    setMatchBroken(true)
    setOpenTaskId(null)
  }, [])

  const startLockdownRef = useRef<() => void>(() => {})

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
        onError: (message) => {
          setLobbyStatus(message)
          // Failed join must not keep a stale hosted code on screen
          if (role === 'join') {
            setRoomCode(null)
            setPeers(0)
          }
        },
        onPeerJoined: (p) => setPeers(p),
        onPeerLeft: (p) => {
          setPeers(p)
          setPeerReady(false)
          setLocalReady(false)
          if (phaseRef.current === 'landing') {
            setLobbyStatus('Partner left')
          } else {
            breakMatch()
          }
        },
        onReadyState: ({ pod: p, ready }) => {
          if (p !== podRef.current) setPeerReady(ready)
        },
        onStartLockdown: () => startLockdownRef.current(),
        onMatchEvent: (event) => dispatch(event, { remote: true }),
        onGhost: () => {
          // Separate chambers — partner stays fully invisible (no DOM updates).
        },
        onClose: () => {
          if (intentionalCloseRef.current) return
          if (phaseRef.current === 'landing') {
            // Stale codes after a drop cause "Room not found" for the joiner
            setRoomCode(null)
            setPeers(0)
            setLocalReady(false)
            setPeerReady(false)
            setLobbyStatus('Connection lost. Start or join again.')
          } else {
            breakMatch()
          }
        },
      })
      wsRef.current = client
      if (role === 'host') helloHost(client)
      else if (code) helloJoin(client, code)
    },
    [breakMatch, closeWs, dispatch],
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
    if (taskId === 'rag' && f.hasRag) return
    if (taskId === 'vase') {
      if (!f.vaseSmashed && !(f.hasWrench && f.wallWiped)) return
    }
    if (taskId === 'locker' && f.hasFuse) return
    if (taskId === 'fuse' && f.fuseInstalled) return
    if (taskId === 'wall' && !f.hasRag) return
    if (taskId === 'keypad' && f.keypadDone) return
    setOpenTaskId(taskId)
  }, [])

  const closeTask = useCallback(() => setOpenTaskId(null), [])

  const showToast = useCallback((id: HintId) => {
    const line = hintFor(podRef.current, id)
    if (!line) return
    if (toastClearRef.current !== null) {
      window.clearTimeout(toastClearRef.current)
      toastClearRef.current = null
    }
    toastHoldMsRef.current = HINT_DURATION_MS[id]
    setAiToast(line)
  }, [])

  const onToastTyped = useCallback(() => {
    const hold = toastHoldMsRef.current
    if (hold <= 0) return
    if (toastClearRef.current !== null) {
      window.clearTimeout(toastClearRef.current)
    }
    toastClearRef.current = window.setTimeout(() => {
      setAiToast(null)
      toastClearRef.current = null
    }, hold)
  }, [])

  useEffect(() => {
    if (!flags.gridOnline || sawGridToast.current) return
    sawGridToast.current = true
    showToast('gridOnline')
  }, [flags.gridOnline, showToast])

  useEffect(() => {
    if (!flags.codeKnown || sawCodeToast.current) return
    sawCodeToast.current = true
    showToast('codeKnown')
  }, [flags.codeKnown, showToast])

  useEffect(() => {
    if (!flags.hasFuse || sawFuseToast.current) return
    sawFuseToast.current = true
    showToast('fuseLoot')
  }, [flags.hasFuse, showToast])

  useEffect(() => {
    if (!flags.wallWiped || sawWallToast.current) return
    sawWallToast.current = true
    showToast('wallWiped')
  }, [flags.wallWiped, showToast])

  useEffect(() => {
    if (flags.lightsOn) lightsWereOnRef.current = true
    if (
      !flags.gridOnline ||
      flags.lightsOn ||
      !lightsWereOnRef.current ||
      sawDimToast.current
    ) {
      return
    }
    // Don't treat keypad-fail brownouts as the one-shot "lights dimmed" coach
    if (flags.penaltyReserve > 0) return
    sawDimToast.current = true
    showToast('lightsDimmed')
  }, [flags.gridOnline, flags.lightsOn, flags.penaltyReserve, showToast])

  useEffect(() => {
    if (sawWaitLeverToast.current || flags.gridOnline) return
    const localDone = pod === 'a' ? flags.leverA : flags.leverB
    const partnerDone = pod === 'a' ? flags.leverB : flags.leverA
    if (!localDone || partnerDone) return
    sawWaitLeverToast.current = true
    showToast('waitingPartnerLever')
  }, [flags.leverA, flags.leverB, flags.gridOnline, pod, showToast])

  useEffect(() => {
    if (flags.penaltyReserve <= 0) {
      sawKeypadFailToast.current = false
      return
    }
    if (sawKeypadFailToast.current) return
    sawKeypadFailToast.current = true
    showToast('keypadFail')
  }, [flags.penaltyReserve, showToast])

  // Partner hogging power → local blackout toast + flicker
  useEffect(() => {
    if (!flags.gridOnline || phase !== 'play') {
      prevLightsOnRef.current = flags.lightsOn
      prevPartnerReserveRef.current =
        pod === 'a' ? flags.reserveB : flags.reserveA
      return
    }
    const partnerReserve = pod === 'a' ? flags.reserveB : flags.reserveA
    const partnerRose =
      partnerReserve > prevPartnerReserveRef.current && partnerReserve >= 70
    const lightsDied = prevLightsOnRef.current && !flags.lightsOn

    if (partnerRose && lightsDied) {
      showToast('partnerDrawing')
      setFacilityFlicker((n) => n + 1)
    } else if (
      !prevLightsOnRef.current &&
      flags.lightsOn &&
      prevPartnerReserveRef.current > 0 &&
      partnerReserve === 0
    ) {
      showToast('lightsRestored')
    }

    prevLightsOnRef.current = flags.lightsOn
    prevPartnerReserveRef.current = partnerReserve
  }, [
    flags.gridOnline,
    flags.lightsOn,
    flags.reserveA,
    flags.reserveB,
    pod,
    phase,
    showToast,
  ])

  useEffect(() => {
    if (flags.escaped) setOpenTaskId(null)
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
        showToast('syncLost')
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
  }, [flags.bypassA, flags.bypassB, flags.fuseInstalled, flags.escaped, dispatch, showToast])

  const triggerFacilityFlicker = useCallback(() => {
    setFacilityFlicker((n) => n + 1)
  }, [])

  const completeLocalLever = useCallback(() => {
    dispatch({ type: 'lever', side: podRef.current })
    triggerFacilityFlicker()
    setOpenTaskId(null)
  }, [dispatch, triggerFacilityFlicker])

  const completePartnerLever = useCallback(() => {
    const partnerSide = podRef.current === 'a' ? 'b' : 'a'
    dispatch({ type: 'lever', side: partnerSide })
    triggerFacilityFlicker()
  }, [dispatch, triggerFacilityFlicker])

  const completePartnerWipe = useCallback(() => {
    dispatch({ type: 'wallWipe' })
  }, [dispatch])

  const completePartnerVaseSmash = useCallback(() => {
    dispatch({ type: 'vaseSmash' })
    triggerFacilityFlicker()
  }, [dispatch, triggerFacilityFlicker])

  const completePartnerFuseLoot = useCallback(() => {
    dispatch({ type: 'fuseLoot' })
  }, [dispatch])

  const completePartnerFuseInstall = useCallback(() => {
    dispatch({ type: 'fuseInstalled' })
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
      const partnerSide = podRef.current === 'a' ? 'b' : 'a'
      dispatch({ type: 'bypass', side: partnerSide, held })
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
    triggerFacilityFlicker()
    setOpenTaskId(null)
  }, [dispatch, triggerFacilityFlicker])

  const completeRag = useCallback(() => {
    dispatch({ type: 'rag' })
    triggerFacilityFlicker()
    setOpenTaskId(null)
  }, [dispatch, triggerFacilityFlicker])

  const completeVaseSmash = useCallback(() => {
    dispatch({ type: 'vaseSmash' })
    triggerFacilityFlicker()
  }, [dispatch, triggerFacilityFlicker])

  const completeLocker = useCallback(() => {
    dispatch({ type: 'fuseLoot' })
    setOpenTaskId(null)
  }, [dispatch])

  const completeWall = useCallback(() => {
    dispatch({ type: 'wallWipe' })
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

  const failKeypad = useCallback(() => {
    dispatch({ type: 'keypadFail' })
  }, [dispatch])

  const clearKeypadFail = useCallback(() => {
    dispatch({ type: 'clearKeypadFail' })
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

  const startLockdown = useCallback(() => {
    lockdownStartedRef.current = true
    controlsRef.current.darkMode = true
    if (worldRef.current) worldRef.current.dataset.dark = '1'
    setPhase('blackout')
  }, [])
  startLockdownRef.current = startLockdown

  const handleBriefingDone = useCallback(() => {
    setPhase('play')
    setLightsReveal((n) => n + 1)
    showToast('lightsOut')
    const soloOrHost =
      connectionRef.current !== 'online' || podRef.current === 'a'
    if (soloOrHost) {
      dispatch({ type: 'startedAt', at: Date.now() })
    }
  }, [dispatch, showToast])

  useEffect(() => {
    if (phase !== 'blackout') return
    const id = window.setTimeout(() => {
      setPhase('briefing')
    }, BLACKOUT_HOLD_MS)
    return () => window.clearTimeout(id)
  }, [phase])

  useEffect(() => {
    let cancelled = false
    maskRef.current = createBorderMask()
    setMaskEpoch((n) => n + 1)

    void loadCollisionMask(collisionMaskUrl(pod)).then((loaded) => {
      if (cancelled) return
      if (loaded) {
        maskRef.current = loaded
        setMaskEpoch((n) => n + 1)
      }
    })

    return () => {
      cancelled = true
    }
  }, [pod])

  const onMaskEdited = useCallback(() => {
    setMaskEpoch((n) => n + 1)
  }, [])

  useEffect(() => {
    const worldEl = worldRef.current
    const playerEl = playerRef.current
    if (!worldEl || !playerEl) return

    const loop = startGameLoop({
      handles: {
        worldEl,
        playerEl,
        promptEl: promptRef.current,
      },
      maskRef,
      interactablesRef,
      controls: controlsRef.current,
      onRequestTask: requestTask,
      // Dev-only flashlight cheat (L) — omitted from production builds
      onToggleDebugDark: import.meta.env.DEV ? toggleDebugDark : undefined,
    })

    return () => loop.stop()
  }, [requestTask, toggleDebugDark])

  const free = freePower(flags)
  const canReserveFuse = freePowerWithoutReserveA(flags) >= FUSE_RESERVE
  const escapeTimeMs =
    flags.escapedAt !== null && flags.startedAt !== null
      ? flags.escapedAt - flags.startedAt
      : 0
  const showPartnerSim =
    connectionMode === 'solo' && phase === 'play' && !matchBroken
  const reserveYou = pod === 'b' ? flags.reserveB : flags.reserveA
  const reservePartner = pod === 'b' ? flags.reserveA : flags.reserveB
  const youDevice =
    pod === 'b'
      ? flags.reserveB >= 80
        ? 'keypad'
        : null
      : flags.reserveA >= FUSE_RESERVE
        ? 'fuse'
        : null
  const partnerDevice =
    pod === 'a'
      ? flags.reserveB >= 80
        ? 'keypad'
        : flags.reserveB > 0
          ? 'device'
          : null
      : flags.reserveA >= FUSE_RESERVE
        ? 'fuse'
        : flags.reserveA > 0
          ? 'device'
          : null
  const darkNow = effectiveDark(flags, lockdownStarted)
  const flashlightR = !darkNow
    ? FLASHLIGHT_RADIUS
    : free < 15
      ? Math.round(FLASHLIGHT_RADIUS * 0.55)
      : free < 30
        ? Math.round(FLASHLIGHT_RADIUS * 0.72)
        : FLASHLIGHT_RADIUS
  const showStrainBanner =
    flags.gridOnline &&
    !flags.lightsOn &&
    phase === 'play' &&
    !matchBroken &&
    !flags.escaped &&
    openTaskId === null

  return (
    <div className="relative" style={{ width: WORLD_W, height: WORLD_H }}>
      <div
        className="relative shrink-0"
        style={{ width: WORLD_W, height: WORLD_H }}
      >
        <div
          ref={worldRef}
          className="pod-world relative overflow-hidden bg-black shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_24px_80px_rgba(0,0,0,0.65)]"
          data-dark="0"
          data-cinematic-hide={worldVisible ? '0' : '1'}
          data-lights-reveal={worldVisible && lightsReveal > 0 ? '1' : '0'}
          style={
            {
              width: WORLD_W,
              height: WORLD_H,
              '--fx': `${WORLD_W / 2}px`,
              '--fy': `${WORLD_H / 2}px`,
              '--flashlight-r': `${flashlightR}px`,
            } as CSSProperties
          }
        >
          <RoomPlateLayers pod={pod} />

          <PodPropSprites world={podWorld} flags={flags} />

          <div
            ref={ghostRef}
            hidden
            className="player-sprite pointer-events-none absolute left-0 top-0 opacity-0 will-change-transform"
            style={
              {
                width: PLAYER_SPRITE_W,
                height: PLAYER_SPRITE_H,
                '--player-sheet': `url(${playerAssetUrl(pod === 'a' ? 'b' : 'a')})`,
              } as CSSProperties
            }
            data-frame="0"
            data-facing="1"
            aria-hidden
          />

          <div
            ref={playerRef}
            className="player-sprite absolute left-0 top-0 will-change-transform"
            style={
              {
                width: PLAYER_SPRITE_W,
                height: PLAYER_SPRITE_H,
                '--player-sheet': `url(${playerAssetUrl(pod)})`,
              } as CSSProperties
            }
            data-frame="0"
            aria-label="Player"
          />

          <div
            ref={promptRef}
            className="pointer-events-none absolute left-0 top-0 z-[5000] whitespace-nowrap font-[family-name:var(--font-game-ui)] text-base font-semibold uppercase tracking-[0.12em] text-amber-300 opacity-0 will-change-transform"
            style={{ textShadow: '0 2px 6px #000' }}
            aria-hidden
          />

          <div className="flashlight-overlay" aria-hidden />
          <div
            key={facilityFlicker}
            className="facility-flicker"
            data-on={facilityFlicker > 0 ? '1' : '0'}
            aria-hidden
          />

          {import.meta.env.DEV && (
            <>
              <CollisionMaskTool
                pod={pod}
                maskRef={maskRef}
                maskEpoch={maskEpoch}
                onMaskEdited={onMaskEdited}
              />

              <PropPlaceTool
                markers={podWorld.interactables.map((item) => ({
                  id: item.id,
                  foot: item.foot,
                  sprite: item.sprite,
                }))}
              />
            </>
          )}

          <PowerHud
            visible={flags.gridOnline && phase === 'play' && !flags.escaped}
            free={free}
            reserveYou={reserveYou}
            reservePartner={reservePartner}
            penalty={flags.penaltyReserve}
            lightsOn={flags.lightsOn}
            youDevice={youDevice}
            partnerDevice={partnerDevice}
          />

          <PowerStrainBanner
            visible={showStrainBanner}
            free={free}
            reservePartner={reservePartner}
            reserveYou={reserveYou}
            partnerDevice={partnerDevice}
            youDevice={youDevice}
          />

          {aiToast && !flags.escaped && !matchBroken && phase === 'play' && (
            <p className="facility-hud pointer-events-none absolute bottom-8 left-1/2 z-[10070] -translate-x-1/2 border-amber-500/30 px-4 py-2 font-[family-name:var(--font-game-ui)] text-base tracking-[0.04em] text-amber-200">
              <TypewriterText text={aiToast} onComplete={onToastTyped} />
            </p>
          )}

          {connectionMode === 'online' && phase === 'play' && !matchBroken && (
            <p className="facility-hud pointer-events-none absolute left-3 top-3 z-[10040] px-2.5 py-1 font-[family-name:var(--font-game-ui)] text-sm tracking-[0.12em] text-neutral-300">
              Pod {pod.toUpperCase()} · {roomCode}
            </p>
          )}

          {openTaskId === 'lever' && (
            <TaskModal
              title="Breaker lever"
              eyebrow="Local power"
              onClose={closeTask}
            >
              <LeverTask onComplete={completeLocalLever} />
            </TaskModal>
          )}
          {openTaskId === 'wrench' && (
            <TaskModal title="Wrench" eyebrow="Tool locker" onClose={closeTask}>
              <WrenchTask onComplete={completeWrench} />
            </TaskModal>
          )}
          {openTaskId === 'rag' && (
            <TaskModal title="Service rag" eyebrow="Cart" onClose={closeTask}>
              <RagTask onComplete={completeRag} />
            </TaskModal>
          )}
          {openTaskId === 'vase' && (
            <TaskModal
              title="Display vase"
              eyebrow="Pedestal"
              onClose={closeTask}
            >
              <VaseTask
                alreadySmashed={flags.vaseSmashed}
                canSmash={flags.hasWrench && flags.wallWiped}
                onSmash={completeVaseSmash}
              />
            </TaskModal>
          )}
          {openTaskId === 'locker' && (
            <TaskModal
              title="Crew locker"
              eyebrow="Storage"
              onClose={closeTask}
            >
              <LockerTask onComplete={completeLocker} />
            </TaskModal>
          )}
          {openTaskId === 'wall' && (
            <TaskModal
              title="Grime panel"
              eyebrow="Corridor"
              onClose={closeTask}
            >
              <WallTask
                hasRag={flags.hasRag}
                wallWiped={flags.wallWiped}
                onComplete={completeWall}
              />
            </TaskModal>
          )}
          {openTaskId === 'keypad' && (
            <TaskModal
              title="Painting keypad"
              eyebrow={`Grid draw · ${KEYPAD_RESERVE}%`}
              device
              onClose={closeTask}
            >
              <KeypadTask
                reserved={flags.reserveB >= 80}
                freePower={free}
                lightsOn={flags.lightsOn}
                onReserve={reserveKeypad}
                onClearReserve={clearKeypadReserve}
                onFail={failKeypad}
                onClearFail={clearKeypadFail}
                onSuccess={completeKeypad}
              />
            </TaskModal>
          )}
          {openTaskId === 'fuse' && (
            <TaskModal
              title="Fuse bay"
              eyebrow={`Grid draw · ${FUSE_RESERVE}%`}
              onClose={closeTask}
            >
              <FuseTask
                canReserve={canReserveFuse}
                reserved={flags.reserveA >= FUSE_RESERVE}
                freePower={free}
                partnerReserve={flags.reserveB}
                lightsOn={flags.lightsOn}
                onReserve={reserveFuse}
                onInstall={installFuse}
                onClearReserve={clearFuseReserve}
              />
            </TaskModal>
          )}
          {openTaskId === 'bypass' && (
            <TaskModal
              title="Gate bypass"
              eyebrow="Dual sync"
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
                solo={connectionMode === 'solo'}
                showSyncBar={pod === 'a'}
              />
            </TaskModal>
          )}

          {matchBroken && (
            <div className="absolute inset-0 z-[10250] flex flex-col items-center justify-center bg-black/85 px-6">
              <div className="facility-panel w-full max-w-sm">
                <div className="facility-panel__grain" aria-hidden />
                <div className="relative z-[1] px-6 py-7 text-center">
                  <p className="facility-panel__eyebrow">Link fault</p>
                  <h2 className="facility-panel__title mt-1">
                    Partner disconnected
                  </h2>
                  <p className="mt-3 text-sm text-neutral-400">
                    Match over. You can&apos;t rejoin mid-run. Head back to the
                    lobby and start again.
                  </p>
                  <button
                    type="button"
                    onClick={resetMatch}
                    className="facility-btn facility-btn--amber mt-6"
                  >
                    Back to lobby
                  </button>
                </div>
              </div>
            </div>
          )}

          {flags.escaped && !matchBroken && (
            <EscapeOverlay
              timeMs={escapeTimeMs}
              roomCode={roomCode}
              onPlayAgain={resetMatch}
            />
          )}
        </div>
      </div>

      {/* Full-viewport cinematic layers (escape letterbox scale) */}
      {phase === 'landing' &&
        createPortal(
          <LandingHub
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
            onSoloReady={(asPod) => {
              setPod(asPod)
              startLockdown()
            }}
            onBack={resetMatch}
          />,
          document.body,
        )}

      {phase === 'blackout' &&
        createPortal(
          <div
            className="fixed inset-0 z-[20000] bg-black"
            aria-hidden
          />,
          document.body,
        )}

      {phase === 'briefing' &&
        createPortal(
          <BriefingSequence pod={pod} onDone={handleBriefingDone} />,
          document.body,
        )}

      {/* Portal out of the CSS scale transform so letterbox chrome stays viewport-fixed */}
      {createPortal(
        <div className="pointer-events-none fixed inset-x-0 bottom-3 z-[10300] flex justify-center">
          <div className="pointer-events-auto">
            <PartnerSim
              enabled={showPartnerSim}
              localPod={pod}
              partnerLeverDone={pod === 'a' ? flags.leverB : flags.leverA}
              onPartnerLever={completePartnerLever}
              gridOn={flags.gridOnline}
              wallWiped={flags.wallWiped}
              onPartnerWipe={completePartnerWipe}
              codeKnown={flags.codeKnown}
              keypadDone={flags.keypadDone}
              partnerKeypadOpen={flags.reserveB > 0 && !flags.keypadDone}
              onPartnerKeypadOpen={completePartnerKeypadOpen}
              onPartnerKeypadFinish={completePartnerKeypadFinish}
              partnerReserve={pod === 'a' ? flags.reserveB : flags.reserveA}
              onPartnerYield={completePartnerYield}
              fuseInstalled={flags.fuseInstalled}
              partnerBypassHeld={pod === 'a' ? flags.bypassB : flags.bypassA}
              onPartnerBypassHold={setPartnerBypass}
              vaseSmashed={flags.vaseSmashed}
              onPartnerVaseSmash={completePartnerVaseSmash}
              partnerHasFuse={flags.hasFuse}
              onPartnerFuseLoot={completePartnerFuseLoot}
              onPartnerFuseInstall={completePartnerFuseInstall}
              escaped={flags.escaped}
            />
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}
