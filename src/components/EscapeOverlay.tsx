import { useEffect, useMemo, useState } from 'react'
import {
  fetchHighscores,
  formatEscapeTime,
  postHighscore,
  type HighscoreEntry,
} from '../game/highscores'
import { HINTS } from '../game/hints'

type EscapeOverlayProps = {
  timeMs: number
  roomCode?: string | null
  onPlayAgain: () => void
}

export default function EscapeOverlay({
  timeMs,
  roomCode,
  onPlayAgain,
}: EscapeOverlayProps) {
  const [scores, setScores] = useState<HighscoreEntry[]>([])
  const [source, setSource] = useState<'server' | 'local'>('local')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  const formatted = useMemo(() => formatEscapeTime(timeMs), [timeMs])

  useEffect(() => {
    let cancelled = false
    void fetchHighscores().then((result) => {
      if (cancelled) return
      setScores(result.scores)
      setSource(result.source)
    })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="absolute inset-0 z-[10200] flex flex-col items-center justify-center bg-black/80 px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-400/90">
        Incompetent Chambers
      </p>
      <h2 className="mt-2 text-3xl font-bold tracking-tight text-neutral-50">
        You escaped
      </h2>
      <p className="mt-3 max-w-md text-center text-sm text-amber-200/90">
        {HINTS.escaped}
      </p>
      <p className="mt-2 max-w-md text-center text-sm text-neutral-400">
        Congrats. The facility expected incompetence and got… marginally less of
        it. Don&apos;t get used to success.
      </p>
      <p className="mt-6 font-mono text-4xl font-bold tracking-wide text-teal-300">
        {formatted}
      </p>

      <button
        type="button"
        disabled={saved || saving}
        onClick={() => {
          setSaving(true)
          void postHighscore(timeMs, roomCode).then((result) => {
            setScores(result.scores)
            setSource(result.source)
            setSaved(true)
            setSaving(false)
          })
        }}
        className="mt-6 rounded-md border-2 border-teal-500/70 bg-teal-500/15 px-6 py-2.5 text-sm font-bold uppercase tracking-wider text-teal-200 hover:bg-teal-500/25 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saved ? 'Score saved' : saving ? 'Saving…' : 'Save score'}
      </button>

      <button
        type="button"
        onClick={onPlayAgain}
        className="mt-3 rounded-md border-2 border-neutral-500 bg-neutral-800/80 px-6 py-2.5 text-sm font-bold uppercase tracking-wider text-neutral-200 hover:bg-neutral-700"
      >
        Play again
      </button>

      {scores.length > 0 && (
        <div className="mt-8 w-full max-w-xs">
          <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wider text-neutral-500">
            {source === 'server' ? 'Server best' : 'Local best'}
          </p>
          <ol className="space-y-1 text-sm text-neutral-300">
            {scores.slice(0, 5).map((entry, i) => (
              <li
                key={`${entry.at}-${entry.timeMs}-${i}`}
                className="flex justify-between gap-2 rounded bg-white/5 px-3 py-1.5 font-mono"
              >
                <span className="text-neutral-500">#{i + 1}</span>
                <span>{formatEscapeTime(entry.timeMs)}</span>
                {entry.code && (
                  <span className="text-neutral-600">{entry.code}</span>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}
