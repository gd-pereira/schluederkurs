import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
} from 'react'
import { playerAssetUrl, roomPlateUrl, titleIntroUrl } from '../game/assets'
import { gsap, prefersReducedMotion, useGSAP } from '../lib/gsap'

export type LobbyMode = 'pick' | 'solo' | 'host' | 'join'

type LandingHubProps = {
  mode: LobbyMode
  roomCode: string | null
  pod: 'a' | 'b' | null
  peers: number
  localReady: boolean
  peerReady: boolean
  status: string | null
  onChooseSolo: () => void
  onChooseHost: () => void
  onChooseJoin: () => void
  onJoinSubmit: (code: string) => void
  onToggleReady: () => void
  onSoloReady: (asPod: 'a' | 'b') => void
  onBack: () => void
}

/**
 * Door slam + camera pullback cue in title_intro.mp4 (seconds).
 */
const INTRO_REVEAL_AT_S = 2.35
/** Hold the settled lit wide shot — before the dark ending (~10s total). */
const INTRO_FREEZE_AT_S = 6.5

function captureVideoFrame(video: HTMLVideoElement): string | null {
  if (video.videoWidth < 2 || video.videoHeight < 2) return null
  try {
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.drawImage(video, 0, 0)
    return canvas.toDataURL('image/jpeg', 0.92)
  } catch {
    return null
  }
}

function MenuItem({
  label,
  active,
  accent = 'neutral',
  onClick,
  disabled,
}: {
  label: string
  active?: boolean
  accent?: 'neutral' | 'amber' | 'teal'
  onClick?: () => void
  disabled?: boolean
}) {
  const ref = useRef<HTMLButtonElement>(null)

  const onMove = (e: MouseEvent) => {
    if (disabled || prefersReducedMotion()) return
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const x = (e.clientX - r.left - r.width / 2) * 0.08
    gsap.to(el, { x, duration: 0.25, ease: 'power2.out' })
  }

  const onLeave = () => {
    gsap.to(ref.current, { x: 0, duration: 0.4, ease: 'power3.out' })
  }

  const color =
    accent === 'amber'
      ? 'text-amber-300 hover:text-amber-200'
      : accent === 'teal'
        ? 'text-teal-300 hover:text-teal-200'
        : 'text-neutral-100 hover:text-white'

  return (
    <button
      ref={ref}
      type="button"
      disabled={disabled}
      onClick={onClick}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`title-menu-item title-reveal group relative block w-full py-1.5 text-left font-[family-name:var(--font-game-ui)] text-[clamp(1.35rem,2.6vw,1.85rem)] font-semibold uppercase leading-none tracking-[0.06em] transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-35 ${color} ${
        active ? 'text-amber-300' : ''
      }`}
    >
      <span
        className={`pointer-events-none absolute -left-5 top-1/2 h-[2px] w-3 -translate-y-1/2 bg-current opacity-0 transition-opacity duration-200 group-hover:opacity-100 ${
          active ? 'opacity-100' : ''
        }`}
        aria-hidden
      />
      {label}
    </button>
  )
}

function CrewSlot({
  podId,
  occupied,
  ready,
  isYou,
}: {
  podId: 'a' | 'b'
  occupied: boolean
  ready: boolean
  isYou: boolean
}) {
  const accent = podId === 'a' ? 'amber' : 'teal'
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`relative flex h-36 w-28 items-end justify-center overflow-hidden ${
          occupied ? 'opacity-100' : 'opacity-30'
        }`}
      >
        {occupied ? (
          <div
            className="player-sprite h-full w-full"
            style={
              {
                '--player-sheet': `url(${playerAssetUrl(podId)})`,
              } as CSSProperties
            }
            data-frame="0"
            aria-hidden
          />
        ) : (
          <div className="mb-2 h-24 w-16 rounded-t-[40%] bg-neutral-800/70" />
        )}
        {ready && (
          <span
            className={`absolute right-1 top-2 h-2.5 w-2.5 rounded-full ${
              accent === 'amber' ? 'bg-amber-400' : 'bg-teal-400'
            } shadow-[0_0_10px_currentColor]`}
          />
        )}
      </div>
      <p
        className={`font-[family-name:var(--font-game-ui)] text-sm font-semibold uppercase tracking-[0.18em] ${
          accent === 'amber' ? 'text-amber-300' : 'text-teal-300'
        }`}
      >
        Pod {podId.toUpperCase()}
      </p>
      <p className="font-[family-name:var(--font-game-ui)] text-xs uppercase tracking-[0.16em] text-neutral-500">
        {!occupied ? 'Empty' : ready ? 'Ready' : isYou ? 'You' : 'Waiting'}
      </p>
    </div>
  )
}

function IdleCrewSprite({
  podId,
  className,
}: {
  podId: 'a' | 'b'
  className?: string
}) {
  const [frame, setFrame] = useState(0)

  useEffect(() => {
    let phase = 0
    let last = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const dt = (now - last) / 1000
      last = now
      // Slow in-place shuffle (standing idle)
      phase += dt * 2.4
      const step = Math.floor(phase) % 4
      setFrame(step === 0 ? 0 : step)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div className={className}>
      <div className="title-crew-bob h-full w-full">
        <div
          className="player-sprite h-full w-full drop-shadow-[0_20px_28px_rgba(0,0,0,0.8)]"
          style={
            {
              '--player-sheet': `url(${playerAssetUrl(podId)})`,
            } as CSSProperties
          }
          data-frame={String(frame)}
          aria-hidden
        />
      </div>
    </div>
  )
}

export default function LandingHub({
  mode,
  roomCode,
  pod,
  peers,
  localReady,
  peerReady,
  status,
  onChooseSolo,
  onChooseHost,
  onChooseJoin,
  onJoinSubmit,
  onToggleReady,
  onSoloReady,
  onBack,
}: LandingHubProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const washRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const revealedRef = useRef(false)
  const frozenRef = useRef(false)

  const [joinCode, setJoinCode] = useState('')
  const [copied, setCopied] = useState(false)
  const [copyFailed, setCopyFailed] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [videoFailed, setVideoFailed] = useState(false)
  /** Locked still from the intro — menu stays on this, never cuts to room plate. */
  const [freezePoster, setFreezePoster] = useState<string | null>(null)
  const copiedTimerRef = useRef<number | null>(null)

  const artPod: 'a' | 'b' = pod === 'b' ? 'b' : 'a'
  // Sub-screens always need the menu; intro only gates the pick screen.
  const showMenu = menuOpen || mode !== 'pick'

  const freezeVideo = useCallback(() => {
    const video = videoRef.current
    if (!video || frozenRef.current) return
    frozenRef.current = true

    const dur = video.duration
    const target =
      Number.isFinite(dur) && dur > 0
        ? Math.min(INTRO_FREEZE_AT_S, Math.max(0, dur - 0.05))
        : INTRO_FREEZE_AT_S

    const lockFrame = () => {
      try {
        video.pause()
      } catch {
        /* ignore */
      }
      const poster = captureVideoFrame(video)
      if (poster) setFreezePoster(poster)
    }

    if (Math.abs(video.currentTime - target) > 0.05) {
      const onSeeked = () => {
        video.removeEventListener('seeked', onSeeked)
        lockFrame()
      }
      video.addEventListener('seeked', onSeeked)
      try {
        video.currentTime = target
      } catch {
        video.removeEventListener('seeked', onSeeked)
        lockFrame()
      }
      return
    }

    lockFrame()
  }, [])

  const runReveal = useCallback(() => {
    if (revealedRef.current) return
    revealedRef.current = true
    setMenuOpen(true)

    // Video keeps playing until INTRO_FREEZE_AT_S — hold that frame.
    const reduced = prefersReducedMotion()
    const stage = stageRef.current
    const wash = washRef.current
    const menu = menuRef.current
    const items = menu?.querySelectorAll('.title-reveal')

    if (reduced) {
      freezeVideo()
      gsap.set(stage, { scale: 1, xPercent: 0 })
      gsap.set(wash, { opacity: 1 })
      gsap.set(menu, { opacity: 1, x: 0, clearProps: 'filter' })
      gsap.set(items ?? [], { opacity: 1, x: 0, y: 0, scale: 1, rotateX: 0 })
      return
    }

    gsap.set(menu, { opacity: 1, pointerEvents: 'auto' })
    gsap.set(items ?? [], {
      opacity: 0,
      x: 56,
      y: 18,
      scale: 0.92,
      rotateX: -28,
      transformOrigin: 'right center',
    })

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

    tl.to(
      stage,
      {
        scale: 1,
        xPercent: 0,
        duration: 1.55,
        ease: 'power2.inOut',
      },
      0,
    )
    tl.to(wash, { opacity: 1, duration: 1.0, ease: 'power2.out' }, 0.2)
    tl.to(
      items ?? [],
      {
        opacity: 1,
        x: 0,
        y: 0,
        scale: 1,
        rotateX: 0,
        duration: 0.7,
        stagger: 0.09,
        ease: 'back.out(1.55)',
      },
      0.28,
    )
  }, [freezeVideo])

  useEffect(() => {
    return () => {
      if (copiedTimerRef.current !== null) {
        window.clearTimeout(copiedTimerRef.current)
      }
    }
  }, [])

  // Autoplay intro; if blocked, park on freeze frame (do not swap to room plate)
  useEffect(() => {
    if (mode !== 'pick' || menuOpen) return
    if (prefersReducedMotion()) {
      freezeVideo()
      runReveal()
      return
    }
    const video = videoRef.current
    if (!video || videoFailed) {
      runReveal()
      return
    }
    video.currentTime = 0
    const play = video.play()
    if (play && typeof play.catch === 'function') {
      play.catch(() => {
        freezeVideo()
        runReveal()
      })
    }
  }, [mode, menuOpen, videoFailed, runReveal, freezeVideo])

  // If player is already past pick (host/join/solo), ensure menu visible
  useEffect(() => {
    if (mode !== 'pick' && !revealedRef.current) {
      revealedRef.current = true
      setMenuOpen(true)
      freezeVideo()
      gsap.set(stageRef.current, { scale: 1, xPercent: 0 })
      gsap.set(washRef.current, { opacity: 1 })
      gsap.set(menuRef.current, { opacity: 1, clearProps: 'transform' })
      gsap.set('.title-reveal', {
        opacity: 1,
        x: 0,
        y: 0,
        scale: 1,
        rotateX: 0,
      })
    }
  }, [mode, freezeVideo])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!menuOpen && (e.code === 'Space' || e.code === 'Enter' || e.code === 'Escape')) {
        e.preventDefault()
        runReveal()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen, runReveal])

  useGSAP(
    () => {
      if (!showMenu || mode === 'pick') return
      if (prefersReducedMotion()) {
        gsap.set('.title-reveal', { opacity: 1, x: 0, y: 0, scale: 1 })
        return
      }
      gsap.from('.title-reveal', {
        opacity: 0,
        x: 28,
        y: 12,
        scale: 0.94,
        duration: 0.55,
        stagger: 0.07,
        ease: 'back.out(1.4)',
      })
    },
    { scope: rootRef, dependencies: [mode, showMenu] },
  )

  // Poster crew — rise in with the menu, then idle bob
  useGSAP(
    () => {
      if (!showMenu || (mode !== 'pick' && mode !== 'solo')) return
      const crew = rootRef.current?.querySelectorAll('.title-crew')
      if (!crew?.length) return

      if (prefersReducedMotion()) {
        gsap.set(crew, { opacity: 1, y: 0, scale: 1 })
        return
      }

      gsap.fromTo(
        crew,
        { opacity: 0, y: 48, scale: 0.88 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.85,
          stagger: 0.14,
          delay: 0.4,
          ease: 'back.out(1.5)',
        },
      )
      gsap.to('.title-crew-bob', {
        y: -7,
        duration: 2.15,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
        stagger: 0.45,
        delay: 1.1,
      })
    },
    { scope: rootRef, dependencies: [showMenu, mode] },
  )

  const onVideoTimeUpdate = () => {
    const video = videoRef.current
    if (!video) return

    if (!revealedRef.current && video.currentTime >= INTRO_REVEAL_AT_S) {
      runReveal()
    }

    if (!frozenRef.current && video.currentTime >= INTRO_FREEZE_AT_S) {
      freezeVideo()
    }
  }

  const copyRoomCode = useCallback(async () => {
    if (!roomCode) return
    try {
      await navigator.clipboard.writeText(roomCode)
      setCopyFailed(false)
      setCopied(true)
      if (copiedTimerRef.current !== null) {
        window.clearTimeout(copiedTimerRef.current)
      }
      copiedTimerRef.current = window.setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
      setCopyFailed(true)
      if (copiedTimerRef.current !== null) {
        window.clearTimeout(copiedTimerRef.current)
      }
      copiedTimerRef.current = window.setTimeout(() => setCopyFailed(false), 1500)
    }
  }, [roomCode])

  const partnerIsReady = peers >= 2 && peerReady
  const aOccupied =
    Boolean(roomCode) && (pod === 'a' || (pod === 'b' && peers >= 2))
  const bOccupied =
    Boolean(roomCode) && (pod === 'b' || (pod === 'a' && peers >= 2))
  const aReady =
    (pod === 'a' && localReady) || (pod === 'b' && partnerIsReady)
  const bReady =
    (pod === 'b' && localReady) || (pod === 'a' && partnerIsReady)

  return (
    <div
      ref={rootRef}
      className="title-screen fixed inset-0 z-[20000] overflow-hidden text-neutral-100"
      style={
        {
          '--font-hub': "'Teko', sans-serif",
          '--font-game-title': "'Audiowide', sans-serif",
          '--font-game-ui': "'Teko', sans-serif",
        } as CSSProperties
      }
    >
      {/* Cinematic stage — starts zoomed in, pulls back into menu */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div
          ref={stageRef}
          className="title-intro-stage absolute inset-0 origin-center"
          style={{
            transform: showMenu ? undefined : 'scale(1.28) translateX(4%)',
          }}
        >
          {/* Intro stays mounted; once frozen we show that exact frame so the menu never cuts to a different still. */}
          {!videoFailed && (
            <video
              ref={videoRef}
              className={`h-full w-full object-cover object-center ${
                freezePoster ? 'invisible absolute inset-0' : ''
              }`}
              src={titleIntroUrl()}
              muted
              playsInline
              preload="auto"
              onTimeUpdate={onVideoTimeUpdate}
              onEnded={() => {
                freezeVideo()
                runReveal()
              }}
              onError={() => {
                setVideoFailed(true)
                runReveal()
              }}
            />
          )}
          {freezePoster ? (
            <img
              src={freezePoster}
              alt=""
              className="h-full w-full object-cover object-center"
              draggable={false}
            />
          ) : videoFailed ? (
            <img
              src={roomPlateUrl(artPod)}
              alt=""
              className="h-full w-full object-cover object-[42%_48%] contrast-110"
            />
          ) : null}
        </div>
        <div
          ref={washRef}
          className="title-screen__wash absolute inset-0"
          style={{ opacity: showMenu ? 1 : 0.15 }}
        />
        <div className="title-screen__grain absolute inset-0" />
      </div>

      {!showMenu && (
        <button
          type="button"
          onClick={runReveal}
          className="absolute bottom-8 right-8 z-20 font-[family-name:var(--font-game-ui)] text-[13px] font-semibold uppercase tracking-[0.28em] text-neutral-300/90 hover:text-white"
        >
          Skip
        </button>
      )}

      {/* Poster crew — bottom left after intro settles */}
      {showMenu && (mode === 'pick' || mode === 'solo') && (
        <div
          className="pointer-events-none absolute bottom-[5%] left-[4%] z-[15] flex items-end gap-5 md:left-[7%] md:gap-9"
          aria-hidden
        >
          <IdleCrewSprite
            podId="a"
            className="title-crew h-44 w-36 md:h-56 md:w-44"
          />
          <IdleCrewSprite
            podId="b"
            className="title-crew h-40 w-32 opacity-95 md:h-52 md:w-40"
          />
        </div>
      )}

      {/* Right rail — game menu (reveals after intro zoom-out) */}
      <div
        ref={menuRef}
        className={`relative z-10 flex h-svh w-full justify-end [perspective:1100px] ${
          showMenu ? '' : 'opacity-0'
        }`}
        style={{
          pointerEvents: showMenu ? 'auto' : 'none',
        }}
      >
        <div className="flex w-full max-w-md flex-col justify-center px-8 py-12 sm:px-12 md:mr-[4%] lg:mr-[8%] [transform-style:preserve-3d]">
          <h1
            className="title-reveal mt-1 max-w-5xl font-[family-name:var(--font-game-title)] font-normal uppercase leading-[1.05] tracking-[0.04em] text-white"
            style={{ fontSize: 'clamp(2.1rem, 4.2vw, 3.4rem)' }}
          >
            Incompetent
            <br />
            Chambers
          </h1>

          {mode === 'pick' && (
            <nav className="mt-12 flex flex-col gap-0.5" aria-label="Main menu">
              <MenuItem label="Start Game" accent="amber" onClick={onChooseHost} />
              <MenuItem label="Join Lobby" accent="teal" onClick={onChooseJoin} />
              <MenuItem label="Solo" onClick={onChooseSolo} />
            </nav>
          )}

          {mode === 'solo' && (
            <div className="mt-8">
              <p className="title-reveal mb-4 max-w-xs text-sm text-neutral-400">
                Pick a pod. The other side runs on partner sim.
              </p>
              <nav className="flex flex-col gap-1" aria-label="Solo pod">
                <MenuItem
                  label="Ready · Pod A"
                  accent="amber"
                  onClick={() => onSoloReady('a')}
                />
                <MenuItem
                  label="Ready · Pod B"
                  accent="teal"
                  onClick={() => onSoloReady('b')}
                />
                <MenuItem label="Back" onClick={onBack} />
              </nav>
            </div>
          )}

          {mode === 'join' && !roomCode && (
            <div className="mt-8">
              <p className="title-reveal mb-5 text-sm uppercase tracking-[0.22em] text-neutral-400">
                Enter access code
              </p>
              <input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && joinCode.trim().length >= 4) {
                    onJoinSubmit(joinCode.trim())
                  }
                }}
                maxLength={4}
                autoFocus
                className="title-reveal w-44 border-b-2 border-neutral-500 bg-transparent px-1 py-2 font-mono text-3xl tracking-[0.4em] text-white outline-none focus:border-teal-400"
                placeholder="····"
              />
              <nav className="mt-8 flex flex-col gap-1">
                <MenuItem
                  label="Join"
                  accent="teal"
                  disabled={joinCode.trim().length < 4}
                  onClick={() => onJoinSubmit(joinCode.trim())}
                />
                <MenuItem label="Back" onClick={onBack} />
              </nav>
              {status && (
                <p className="title-reveal mt-4 text-sm text-red-400">{status}</p>
              )}
            </div>
          )}

          {(mode === 'host' || (mode === 'join' && roomCode)) && (
            <div className="mt-6">
              <p className="title-reveal text-[10px] uppercase tracking-[0.35em] text-neutral-500">
                Lobby
              </p>
              {roomCode ? (
                <>
                  <p className="title-reveal mt-3 font-mono text-4xl tracking-[0.32em] text-amber-300 md:text-5xl">
                    {roomCode}
                  </p>
                  <button
                    type="button"
                    onClick={copyRoomCode}
                    className="title-reveal mt-2 text-left text-[11px] uppercase tracking-[0.25em] text-neutral-400 hover:text-neutral-200"
                  >
                    {copyFailed ? 'Copy failed' : copied ? 'Copied' : 'Copy code'}
                  </button>
                </>
              ) : (
                <p className="title-reveal mt-4 text-sm text-neutral-400">
                  Connecting…
                </p>
              )}

              <div className="title-reveal mt-8 flex gap-10">
                <CrewSlot
                  podId="a"
                  occupied={aOccupied}
                  ready={aReady}
                  isYou={pod === 'a'}
                />
                <CrewSlot
                  podId="b"
                  occupied={bOccupied}
                  ready={bReady}
                  isYou={pod === 'b'}
                />
              </div>

              {roomCode && (
                <p className="title-reveal mt-5 text-xs uppercase tracking-[0.2em] text-neutral-500">
                  You · Pod {pod?.toUpperCase() ?? '?'} · {peers}/2
                </p>
              )}
              {status && (
                <p className="title-reveal mt-2 text-sm text-red-400">{status}</p>
              )}

              <nav className="mt-8 flex flex-col gap-1">
                <MenuItem
                  label={localReady ? 'Unready' : 'Ready'}
                  accent="amber"
                  active={localReady}
                  disabled={!roomCode || peers < 2}
                  onClick={onToggleReady}
                />
                <MenuItem label="Leave" onClick={onBack} />
              </nav>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
