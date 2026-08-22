import { useEffect, useState } from 'react'
import { VASE_CODE } from '../../game/matchFlags'

type KeypadTaskProps = {
  reserved: boolean
  onReserve: () => void
  onClearReserve: () => void
  onSuccess: () => void
}

export default function KeypadTask({
  reserved,
  onReserve,
  onClearReserve,
  onSuccess,
}: KeypadTaskProps) {
  const [digits, setDigits] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    onReserve()
    return () => onClearReserve()
  }, [onReserve, onClearReserve])

  function press(d: string) {
    setError(null)
    setDigits((prev) => (prev.length >= 4 ? prev : prev + d))
  }

  function submit() {
    if (digits === VASE_CODE) {
      onSuccess()
      return
    }
    setError('Wrong code. Facility is judging you.')
    setDigits('')
  }

  return (
    <div>
      <p className="text-sm text-neutral-700">
        Painting keypad. Draws 80% while open — don&apos;t leave your partner in
        the dark forever.
      </p>
      {reserved && (
        <p className="mt-2 text-xs font-semibold text-amber-700">
          80% reserved
        </p>
      )}
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
                if (key === 'C') {
                  setDigits('')
                  setError(null)
                } else if (key === 'OK') submit()
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
