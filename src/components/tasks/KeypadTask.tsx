import { useEffect, useRef, useState } from 'react'
import { KEYPAD_FAIL_MS, KEYPAD_RESERVE } from '../../game/constants'
import { modalAssetUrl } from '../../game/assets'
import { VASE_CODE } from '../../game/matchFlags'
import OptionalAssetImg from '../OptionalAssetImg'

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
    setError('Rejected. Grid hiccup.')
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

  return (
    <div>
      <OptionalAssetImg
        src={modalAssetUrl('keypad')}
        alt=""
        className="mb-4 mx-auto max-h-36 w-auto object-contain"
      />
      <p className="text-sm text-neutral-700">
        Painting circuit. While this is open it reserves{' '}
        <strong>{KEYPAD_RESERVE}%</strong> of the shared grid — partner’s lights
        die and they can’t run the fuse bay.
      </p>

      <div className="mt-3 rounded border-2 border-amber-700/40 bg-amber-50 px-3 py-2 text-xs text-amber-950">
        <p>
          Free now: <strong>{Math.round(freePower)}%</strong>
          {' · '}
          Lights:{' '}
          <strong className={lightsOn ? 'text-teal-700' : 'text-red-700'}>
            {lightsOn ? 'ON' : 'OUT (both pods)'}
          </strong>
        </p>
        {reserved && (
          <p className="mt-1 font-semibold">
            You are holding {KEYPAD_RESERVE}% — finish the code or close to give
            power back.
          </p>
        )}
      </div>

      <p className="mt-4 font-mono text-3xl tracking-[0.35em] text-neutral-900">
        {digits.padEnd(4, '_')}
      </p>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', 'OK'].map(
          (key) => (
            <button
              key={key}
              type="button"
              className="rounded border-2 border-neutral-700 bg-neutral-100 py-2 text-sm font-bold hover:bg-white"
              onClick={() => {
                if (key === 'C') clear()
                else if (key === 'OK') submit()
                else press(key)
              }}
            >
              {key}
            </button>
          ),
        )}
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  )
}
