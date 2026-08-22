import { useMemo, useState } from 'react'
import {
  formatEscapeTime,
  loadHighscores,
  saveHighscore,
  type HighscoreEntry,
} from '../game/highscores'

type EscapeOverlayProps = {
  timeMs: number
}

export default function EscapeOverlay({ timeMs }: EscapeOverlayProps) {
  const [scores, setScores] = useState<HighscoreEntry[]>(() => loadHighscores())
  const [saved, setSaved] = useState(false)

  const formatted = useMemo(() => formatEscapeTime(timeMs), [timeMs])

  return (
    <div className="absolute inset-0 z-[10200] flex flex-col items-center justify-center bg-black/80 px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-400/90">
        Project Synapse
      </p>
      <h2 className="mt-2 text-3xl font-bold tracking-tight text-neutral-50">
        You escaped
      </h2>
      <p className="mt-3 max-w-md text-center text-sm text-neutral-300">
        Congrats. The facility expected incompetence and got… marginally less of
        it. Don&apos;t get used to success.
      </p>
      <p className="mt-6 font-mono text-4xl font-bold tracking-wide text-teal-300">
        {formatted}
      </p>

      <button
        type="button"
        disabled={saved}
        onClick={() => {
          setScores(saveHighscore(timeMs))
          setSaved(true)
        }}
        className="mt-6 rounded-md border-2 border-teal-500/70 bg-teal-500/15 px-6 py-2.5 text-sm font-bold uppercase tracking-wider text-teal-200 hover:bg-teal-500/25 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saved ? 'Score saved' : 'Save score'}
      </button>

      {scores.length > 0 && (
        <div className="mt-8 w-full max-w-xs">
          <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Local best
          </p>
          <ol className="space-y-1 text-sm text-neutral-300">
            {scores.map((entry, i) => (
              <li
                key={`${entry.at}-${entry.timeMs}`}
                className="flex justify-between rounded bg-white/5 px-3 py-1.5 font-mono"
              >
                <span className="text-neutral-500">#{i + 1}</span>
                <span>{formatEscapeTime(entry.timeMs)}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}
