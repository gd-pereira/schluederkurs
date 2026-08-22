/**
 * Repro: co-op escape times diverge by a few seconds.
 *
 * Models two clients with:
 * - shared host startedAt
 * - independent local escape stamps (clock skew + sync-timer skew)
 * - optional overwrite when the later escape event arrives
 *
 * Exit 0 = both clients agree on duration (fixed).
 * Exit 1 = durations differ (bug present).
 *
 * Usage:
 *   node scripts/repro-escape-time.mjs          # expect fail on buggy semantics
 *   node scripts/repro-escape-time.mjs --fixed  # expect pass with first-wins + host stamp
 */

const FIXED = process.argv.includes('--fixed')

function withStartedAt(flags, at) {
  if (flags.startedAt !== null) return flags
  return { ...flags, startedAt: at }
}

function withEscapeBuggy(flags, at) {
  return { ...flags, escaped: true, escapedAt: at }
}

function withEscapeFixed(flags, at) {
  if (flags.escaped) return flags
  return { ...flags, escaped: true, escapedAt: at }
}

const withEscape = FIXED ? withEscapeFixed : withEscapeBuggy

function duration(flags) {
  if (flags.escapedAt === null || flags.startedAt === null) return null
  return flags.escapedAt - flags.startedAt
}

/** Simulate: host clock vs joiner clock skew + late sync on joiner */
const HOST_START = 1_000_000
const CLOCK_SKEW_MS = 3200 // joiner wall clock ahead
const SYNC_SKEW_MS = 180 // joiner saw both bypasses later

const host = { startedAt: null, escaped: false, escapedAt: null }
const joiner = { startedAt: null, escaped: false, escapedAt: null }

// Host owns startedAt (matches WorldView handleBriefingDone)
Object.assign(host, withStartedAt(host, HOST_START))
Object.assign(joiner, withStartedAt(joiner, HOST_START)) // via WS

const hostEscapeAt = HOST_START + 95_000
const joinerEscapeAt = HOST_START + 95_000 + CLOCK_SKEW_MS + SYNC_SKEW_MS

if (FIXED) {
  // Only host declares escape; joiner applies remote stamp
  Object.assign(host, withEscape(host, hostEscapeAt))
  Object.assign(joiner, withEscape(joiner, hostEscapeAt))
} else {
  // Both declare locally, then receive each other's escape
  Object.assign(host, withEscape(host, hostEscapeAt))
  Object.assign(joiner, withEscape(joiner, joinerEscapeAt))
  Object.assign(host, withEscape(host, joinerEscapeAt)) // overwrite
  Object.assign(joiner, withEscape(joiner, hostEscapeAt)) // overwrite other way depending on order
}

const hostMs = duration(host)
const joinerMs = duration(joiner)
const delta = Math.abs(hostMs - joinerMs)

console.log(
  JSON.stringify(
    {
      mode: FIXED ? 'fixed' : 'buggy',
      hostMs,
      joinerMs,
      deltaMs: delta,
      clockSkewMs: CLOCK_SKEW_MS,
      syncSkewMs: SYNC_SKEW_MS,
    },
    null,
    2,
  ),
)

if (delta === 0) {
  console.log('PASS: both clients share the same escape duration')
  process.exit(0)
}

console.log('FAIL: escape durations disagree')
process.exit(1)
