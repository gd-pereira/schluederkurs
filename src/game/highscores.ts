export type HighscoreEntry = {
  timeMs: number
  at: number
  code?: string
}

const STORAGE_KEY = 'ic-highscores'
const MAX_LOCAL = 5

export function apiBaseUrl(): string {
  if (typeof window === 'undefined') return 'http://localhost:8080'
  const env = import.meta.env.VITE_API_URL as string | undefined
  if (env) return env.replace(/\/$/, '')
  if (window.location.port === '5173' || window.location.port === '4173') {
    return `${window.location.protocol}//${window.location.hostname}:8080`
  }
  return ''
}

function normalizeList(parsed: unknown): HighscoreEntry[] {
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
}

export function loadHighscores(): HighscoreEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return normalizeList(JSON.parse(raw) as unknown).slice(0, MAX_LOCAL)
  } catch {
    return []
  }
}

export function saveHighscore(timeMs: number): HighscoreEntry[] {
  const next = [...loadHighscores(), { timeMs, at: Date.now() }]
    .sort((a, b) => a.timeMs - b.timeMs)
    .slice(0, MAX_LOCAL)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // ignore quota / private mode
  }
  return next
}

export async function fetchHighscores(): Promise<{
  scores: HighscoreEntry[]
  source: 'server' | 'local'
}> {
  const base = apiBaseUrl()
  try {
    const res = await fetch(`${base}/api/highscores`)
    if (!res.ok) throw new Error(String(res.status))
    const scores = normalizeList(await res.json())
    return { scores, source: 'server' }
  } catch {
    return { scores: loadHighscores(), source: 'local' }
  }
}

export async function postHighscore(
  timeMs: number,
  code?: string | null,
): Promise<{ scores: HighscoreEntry[]; source: 'server' | 'local' }> {
  const base = apiBaseUrl()
  try {
    const res = await fetch(`${base}/api/highscores`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        timeMs,
        ...(code ? { code } : {}),
      }),
    })
    if (!res.ok) throw new Error(String(res.status))
    const scores = normalizeList(await res.json())
    // Mirror best effort locally
    saveHighscore(timeMs)
    return { scores, source: 'server' }
  } catch {
    return { scores: saveHighscore(timeMs), source: 'local' }
  }
}

export function formatEscapeTime(timeMs: number): string {
  const totalSec = Math.max(0, Math.floor(timeMs / 1000))
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  const ms = Math.floor((timeMs % 1000) / 10)
  return `${m}:${String(s).padStart(2, '0')}.${String(ms).padStart(2, '0')}`
}
