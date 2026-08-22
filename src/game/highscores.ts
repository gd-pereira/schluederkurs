export type HighscoreEntry = {
  timeMs: number
  at: number
}

const STORAGE_KEY = 'ic-highscores'
const MAX_SCORES = 5

export function loadHighscores(): HighscoreEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter(
        (e): e is HighscoreEntry =>
          typeof e === 'object' &&
          e !== null &&
          typeof (e as HighscoreEntry).timeMs === 'number' &&
          typeof (e as HighscoreEntry).at === 'number',
      )
      .sort((a, b) => a.timeMs - b.timeMs)
      .slice(0, MAX_SCORES)
  } catch {
    return []
  }
}

export function saveHighscore(timeMs: number): HighscoreEntry[] {
  const next = [...loadHighscores(), { timeMs, at: Date.now() }]
    .sort((a, b) => a.timeMs - b.timeMs)
    .slice(0, MAX_SCORES)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // ignore quota / private mode
  }
  return next
}

export function formatEscapeTime(timeMs: number): string {
  const totalSec = Math.max(0, Math.floor(timeMs / 1000))
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  const ms = Math.floor((timeMs % 1000) / 10)
  return `${m}:${String(s).padStart(2, '0')}.${String(ms).padStart(2, '0')}`
}
