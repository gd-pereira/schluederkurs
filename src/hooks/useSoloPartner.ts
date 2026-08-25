import { useEffect, useRef } from 'react'
import type { MatchFlags } from '../game/matchFlags'
import type { MatchEvent } from '../net/matchEvents'

type PodId = 'a' | 'b'

type SoloPartnerOptions = {
  enabled: boolean
  localPod: PodId
  flags: MatchFlags
  /** True while the local player is holding the bypass control */
  localBypassHeld: boolean
  dispatch: (event: MatchEvent) => void
  onFlicker?: () => void
}

const DELAY = {
  leverAfterLocal: 1400,
  leverAlone: 2400,
  wipe: 2800,
  vase: 2200,
  keypadOpen: 2000,
  keypadFinish: 4000,
  fuseLoot: 1800,
  fuseInstall: 2400,
  bypassMirror: 280,
} as const

/**
 * Solo mode: drives the other pod automatically so the player never needs
 * debug partner buttons. Delays make the partner feel present.
 */
export function useSoloPartner({
  enabled,
  localPod,
  flags,
  localBypassHeld,
  dispatch,
  onFlicker,
}: SoloPartnerOptions) {
  const timers = useRef<number[]>([])
  const scheduled = useRef(new Set<string>())
  const dispatchRef = useRef(dispatch)
  const flickerRef = useRef(onFlicker)
  const wasEnabled = useRef(false)
  dispatchRef.current = dispatch
  flickerRef.current = onFlicker

  function clearAll() {
    for (const id of timers.current) window.clearTimeout(id)
    timers.current = []
    scheduled.current.clear()
  }

  function once(key: string, ms: number, run: () => void) {
    if (scheduled.current.has(key)) return
    scheduled.current.add(key)
    const id = window.setTimeout(run, ms)
    timers.current.push(id)
  }

  useEffect(() => {
    if (enabled && !wasEnabled.current) {
      clearAll()
    }
    if (!enabled && wasEnabled.current) {
      clearAll()
    }
    wasEnabled.current = enabled
  }, [enabled])

  useEffect(() => {
    if (!enabled || flags.escaped) return

    const partner: PodId = localPod === 'a' ? 'b' : 'a'
    const localLever = localPod === 'a' ? flags.leverA : flags.leverB
    const partnerLever = localPod === 'a' ? flags.leverB : flags.leverA

    if (!partnerLever) {
      once(
        'lever',
        localLever ? DELAY.leverAfterLocal : DELAY.leverAlone,
        () => {
          dispatchRef.current({ type: 'lever', side: partner })
          flickerRef.current?.()
        },
      )
    }

    if (localPod === 'a') {
      if (flags.gridOnline && !flags.wallWiped) {
        once('wipe', DELAY.wipe, () => {
          dispatchRef.current({ type: 'wallWipe' })
        })
      }

      if (flags.codeKnown && !flags.keypadDone) {
        if (flags.reserveB < 80) {
          once('keypadOpen', DELAY.keypadOpen, () => {
            dispatchRef.current({ type: 'keypadReserve' })
          })
        } else {
          once('keypadFinish', DELAY.keypadFinish, () => {
            dispatchRef.current({ type: 'keypadDone' })
          })
        }
      }
    } else {
      if (flags.wallWiped && !flags.vaseSmashed) {
        once('vase', DELAY.vase, () => {
          dispatchRef.current({ type: 'vaseSmash' })
          flickerRef.current?.()
        })
      }

      if (flags.keypadDone && !flags.hasFuse) {
        once('fuseLoot', DELAY.fuseLoot, () => {
          dispatchRef.current({ type: 'fuseLoot' })
        })
      }

      if (flags.hasFuse && !flags.fuseInstalled) {
        once('fuseInstall', DELAY.fuseInstall, () => {
          dispatchRef.current({ type: 'fuseInstalled' })
        })
      }
    }
  }, [
    enabled,
    localPod,
    flags.escaped,
    flags.leverA,
    flags.leverB,
    flags.gridOnline,
    flags.wallWiped,
    flags.codeKnown,
    flags.keypadDone,
    flags.reserveB,
    flags.vaseSmashed,
    flags.hasFuse,
    flags.fuseInstalled,
  ])

  useEffect(() => {
    if (!enabled || !flags.fuseInstalled || flags.escaped) return

    const partner: PodId = localPod === 'a' ? 'b' : 'a'
    const partnerHeld = localPod === 'a' ? flags.bypassB : flags.bypassA

    if (localBypassHeld && !partnerHeld) {
      const id = window.setTimeout(() => {
        dispatchRef.current({ type: 'bypass', side: partner, held: true })
      }, DELAY.bypassMirror)
      return () => window.clearTimeout(id)
    }

    if (!localBypassHeld && partnerHeld) {
      dispatchRef.current({ type: 'bypass', side: partner, held: false })
    }
  }, [
    enabled,
    localPod,
    localBypassHeld,
    flags.fuseInstalled,
    flags.escaped,
    flags.bypassA,
    flags.bypassB,
  ])

  useEffect(() => {
    return () => clearAll()
  }, [])
}
