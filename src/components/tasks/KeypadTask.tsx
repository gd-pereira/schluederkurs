import { useEffect, useRef, useState } from 'react'
import { KEYPAD_FAIL_MS, KEYPAD_RESERVE } from '../../game/constants'
import { VASE_CODE } from '../../game/matchFlags'
import {
  FacilityBody,
  FacilityCallout,
  FacilityCopy,
  FacilityHint,
} from '../FacilityUi'

type KeypadTaskProps = {
  reserved: boolean
  freePower: number
  lightsOn: boolean
  onReserve: () => void
  onClearReserve: () => void
  onFail: () => void
  onClearFail: () => void
  onSuccess: () => void
}

export default function KeypadTask({
  reserved,
  freePower,
  lightsOn,
  onReserve,
  onClearReserve,
  onFail,
  onClearFail,
  onSuccess,
}: KeypadTaskProps) {
  const [digits, setDigits] = useState('')
  const [error, setError] = useState<string | null>(null)
  const failTimerRef = useRef<number | null>(null)

  useEffect(() => {
    onReserve()
    return () => {
      onClearReserve()
      if (failTimerRef.current !== null) {
        window.clearTimeout(failTimerRef.current)
        failTimerRef.current = null
      }
      onClearFail()
    }
  }, [onReserve, onClearReserve, onClearFail])

  function press(d: string) {
    setError(null)
    setDigits((prev) => (prev.length >= 4 ? prev : prev + d))
  }

  function clear() {
    setDigits('')
    setError(null)
  }

  function submit(current = digits) {
    if (current === VASE_CODE) {
      onSuccess()
      return
    }
    setError('REJECTED')
    setDigits('')
    onFail()
    if (failTimerRef.current !== null) {
      window.clearTimeout(failTimerRef.current)
    }
    failTimerRef.current = window.setTimeout(() => {
      onClearFail()
      failTimerRef.current = null
    }, KEYPAD_FAIL_MS)
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault()
        press(e.key)
        return
      }
      if (e.key === 'Backspace') {
        e.preventDefault()
        setError(null)
        setDigits((prev) => prev.slice(0, -1))
        return
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        setDigits((prev) => {
          submit(prev)
          return prev
        })
        return
      }
      if (e.key === 'Escape') return
      if (e.key.toLowerCase() === 'c' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        clear()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onSuccess, onFail, onClearFail])

  const lcd = error ?? (digits.length === 0 ? '····' : digits.padEnd(4, '·'))

  return (
    <FacilityBody>
      <FacilityCopy>
        Painting circuit. Open panel reserves{' '}
        <strong>{KEYPAD_RESERVE}%</strong> of the shared grid — partner lights
        die; fuse bay stays locked until you finish or yield.
      </FacilityCopy>

      <FacilityCallout tone={lightsOn ? 'amber' : 'fault'}>
        <p>
          Free <strong>{Math.round(freePower)}%</strong>
          {' · '}
          Lights <strong>{lightsOn ? 'ON' : 'OUT'}</strong>
          {reserved ? (
            <>
              {' · '}
              Holding <strong>{KEYPAD_RESERVE}%</strong>
            </>
          ) : null}
        </p>
      </FacilityCallout>

      <div className="facility-keypad">
        <div className="facility-keypad__housing">
          <div
            className="facility-keypad__lcd"
            data-error={error ? '1' : '0'}
            aria-live="polite"
          >
            {lcd}
          </div>
          <div className="facility-keypad__grid">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', 'OK'].map(
              (key) => {
                const kind =
                  key === 'C' ? 'clear' : key === 'OK' ? 'ok' : 'digit'
                return (
                  <button
                    key={key}
                    type="button"
                    className={`facility-keypad__key${
                      kind === 'clear'
                        ? ' facility-keypad__key--clear'
                        : kind === 'ok'
                          ? ' facility-keypad__key--ok'
                          : ''
                    }`}
                    onClick={() => {
                      if (key === 'C') clear()
                      else if (key === 'OK') submit()
                      else press(key)
                    }}
                  >
                    {key === 'C' ? 'CLR' : key}
                  </button>
                )
              },
            )}
          </div>
        </div>
      </div>

      <FacilityHint>Keys · Backspace · Enter · C clears</FacilityHint>
    </FacilityBody>
  )
}
