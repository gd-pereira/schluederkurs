import { useCallback, useEffect, useRef, useState } from 'react'

export type LobbyMode = 'pick' | 'solo' | 'host' | 'join'

type LobbyOverlayProps = {
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

export default function LobbyOverlay({
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
}: LobbyOverlayProps) {
  const [joinCode, setJoinCode] = useState('')
  const [copied, setCopied] = useState(false)
  const [copyFailed, setCopyFailed] = useState(false)
  const copiedTimerRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (copiedTimerRef.current !== null) {
        window.clearTimeout(copiedTimerRef.current)
      }
    }
  }, [])

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

  return (
    <div className="absolute inset-0 z-[10050] flex flex-col items-center justify-center bg-black/70 px-6">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
        Incompetent Chambers
      </p>
      <h2 className="text-2xl font-semibold tracking-tight text-neutral-50">
        Pod lockdown pending
      </h2>

      {mode === 'pick' && (
        <>
          <p className="mt-2 max-w-sm text-center text-sm text-neutral-400">
            Solo with partner sim, or create/join a 2-player room.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onChooseSolo}
              className="rounded-md border-2 border-neutral-500 bg-neutral-800/80 px-6 py-3 text-sm font-bold uppercase tracking-wider text-neutral-200 hover:bg-neutral-700"
            >
              Solo
            </button>
            <button
              type="button"
              onClick={onChooseHost}
              className="rounded-md border-2 border-amber-500/80 bg-amber-500/15 px-6 py-3 text-sm font-bold uppercase tracking-wider text-amber-300 hover:bg-amber-500/25"
            >
              Create room
            </button>
            <button
              type="button"
              onClick={onChooseJoin}
              className="rounded-md border-2 border-teal-500/80 bg-teal-500/15 px-6 py-3 text-sm font-bold uppercase tracking-wider text-teal-300 hover:bg-teal-500/25"
            >
              Join room
            </button>
          </div>
        </>
      )}

      {mode === 'solo' && (
        <>
          <p className="mt-2 max-w-sm text-center text-sm text-neutral-400">
            Partner sim buttons stand in for the other pod. Pick which room to
            place / play.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => onSoloReady('a')}
              className="rounded-md border-2 border-amber-500/80 bg-amber-500/15 px-6 py-3 text-sm font-bold uppercase tracking-wider text-amber-300 hover:bg-amber-500/25"
            >
              Ready · Pod A
            </button>
            <button
              type="button"
              onClick={() => onSoloReady('b')}
              className="rounded-md border-2 border-teal-500/80 bg-teal-500/15 px-6 py-3 text-sm font-bold uppercase tracking-wider text-teal-300 hover:bg-teal-500/25"
            >
              Ready · Pod B
            </button>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="mt-3 text-xs text-neutral-500 underline"
          >
            Back
          </button>
        </>
      )}

      {mode === 'join' && !roomCode && (
        <>
          <p className="mt-2 text-sm text-neutral-400">Enter 4-character code</p>
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
            className="mt-4 w-40 rounded border border-neutral-600 bg-neutral-900 px-3 py-2 text-center font-mono text-lg tracking-widest text-neutral-100"
            placeholder="ABCD"
          />
          <button
            type="button"
            onClick={() => onJoinSubmit(joinCode.trim())}
            disabled={joinCode.trim().length < 4}
            className="mt-4 rounded-md border-2 border-teal-500/80 bg-teal-500/15 px-6 py-2 text-sm font-bold uppercase text-teal-300 disabled:opacity-40"
          >
            Join
          </button>
          {status && <p className="mt-2 text-xs text-red-400">{status}</p>}
          <button
            type="button"
            onClick={onBack}
            className="mt-3 text-xs text-neutral-500 underline"
          >
            Back
          </button>
        </>
      )}

      {(mode === 'host' || (mode === 'join' && roomCode)) && (
        <>
          <p className="mt-3 font-mono text-3xl tracking-[0.3em] text-amber-300">
            {roomCode ?? '····'}
          </p>
          {!roomCode && (
            <p className="mt-2 text-sm text-neutral-400">
              Connecting to game server…
            </p>
          )}
          {roomCode && (
            <>
              <button
                type="button"
                onClick={copyRoomCode}
                className="mt-3 rounded-md border border-neutral-500 bg-neutral-800/80 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-neutral-200 hover:bg-neutral-700"
              >
                {copyFailed ? 'Copy failed' : copied ? 'Copied' : 'Copy code'}
              </button>
              <p className="mt-2 text-sm text-neutral-400">
                You are Pod {pod?.toUpperCase() ?? '?'} · Peers {peers}/2
              </p>
              <p className="mt-1 text-xs text-neutral-500">
                You: {localReady ? 'Ready' : 'Waiting'} · Partner:{' '}
                {peers < 2 ? '—' : peerReady ? 'Ready' : 'Waiting'}
              </p>
            </>
          )}
          {status && <p className="mt-2 text-xs text-red-400">{status}</p>}
          <button
            type="button"
            onClick={onToggleReady}
            disabled={!roomCode || peers < 2}
            className="mt-6 rounded-md border-2 border-amber-500/80 bg-amber-500/15 px-8 py-3 text-sm font-bold uppercase tracking-wider text-amber-300 hover:bg-amber-500/25 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {localReady ? 'Unready' : 'Ready'}
          </button>
          <button
            type="button"
            onClick={onBack}
            className="mt-3 text-xs text-neutral-500 underline"
          >
            Leave
          </button>
        </>
      )}
    </div>
  )
}
