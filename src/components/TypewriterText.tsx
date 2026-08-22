import { useEffect, useRef, useState } from 'react'

const DEFAULT_MS_PER_CHAR = 28

type TypewriterTextProps = {
  text: string
  /** Milliseconds between characters */
  msPerChar?: number
  className?: string
  /** Fires once the full string is visible */
  onComplete?: () => void
  /** Show a blinking caret while typing */
  caret?: boolean
}

/** Game-style character-by-character reveal (facility PA / dialogue). */
export default function TypewriterText({
  text,
  msPerChar = DEFAULT_MS_PER_CHAR,
  className,
  onComplete,
  caret = true,
}: TypewriterTextProps) {
  const [visible, setVisible] = useState('')
  const [done, setDone] = useState(false)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  useEffect(() => {
    setVisible('')
    setDone(false)
    if (!text) {
      setDone(true)
      onCompleteRef.current?.()
      return
    }

    let i = 0
    const id = window.setInterval(() => {
      i += 1
      setVisible(text.slice(0, i))
      if (i >= text.length) {
        window.clearInterval(id)
        setDone(true)
        onCompleteRef.current?.()
      }
    }, msPerChar)

    return () => window.clearInterval(id)
  }, [text, msPerChar])

  return (
    <span className={className}>
      {visible}
      {caret && !done && (
        <span className="typewriter-caret" aria-hidden>
          ▌
        </span>
      )}
    </span>
  )
}
