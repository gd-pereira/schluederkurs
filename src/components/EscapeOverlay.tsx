import { useEffect, useMemo, useState } from 'react'
import {
  fetchHighscores,
  formatEscapeTime,
  postHighscore,
  type HighscoreEntry,
} from '../game/highscores'
import { FacilityBtn } from './FacilityUi'

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
    <div className="absolute inset-0 z-[10200] flex flex-col items-center justify-center bg-black/85 px-6">
      <div className="facility-panel w-full max-w-md px-0 py-0">
        <div className="facility-panel__grain" aria-hidden />
        <div className="relative z-[1] px-6 py-7 text-center">
          <p className="facility-panel__eyebrow">Incompetent Chambers</p>
          <h2 className="facility-panel__title mt-1 justify-self-center text-[2rem]">
            You escaped
          </h2>
          <p className="mt-3 text-sm text-neutral-400">
            Clear. Time is on the clock if you want to save it.
          </p>
          <p className="mt-6 font-mono text-4xl font-bold tracking-wide text-teal-300">
            {formatted}
          </p>

          <div className="mx-auto mt-6 flex w-full max-w-xs flex-col gap-2">
            <FacilityBtn
              tone="teal"
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
            >
              {saved ? 'Score saved' : saving ? 'Saving…' : 'Save score'}
            </FacilityBtn>
            <FacilityBtn tone="metal" onClick={onPlayAgain}>
              Play again
            </FacilityBtn>
          </div>

          {scores.length > 0 && (
            <div className="mt-7 w-full">
              <p className="mb-2 facility-hud__label text-center">
                {source === 'server' ? 'Server best' : 'Local best'}
              </p>
              <ol className="space-y-1 text-left text-sm text-neutral-300">
                {scores.slice(0, 5).map((entry, i) => (
                  <li
                    key={`${entry.at}-${entry.timeMs}-${i}`}
                    className="flex justify-between gap-2 border border-neutral-700/70 bg-black/35 px-3 py-1.5 font-mono"
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
      </div>
    </div>
  )
}
