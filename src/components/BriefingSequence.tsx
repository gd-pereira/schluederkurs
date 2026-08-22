import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { gsap, prefersReducedMotion, useGSAP } from '../lib/gsap'

type BriefingSequenceProps = {
  pod: 'a' | 'b'
  onDone: () => void
}

export default function BriefingSequence({ pod, onDone }: BriefingSequenceProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const doneRef = useRef(false)
  const [lineIndex, setLineIndex] = useState(0)

  const lines = [
    'Facility lockdown engaged.',
    `You are sealed in Pod ${pod.toUpperCase()}.`,
    'Your partner is in the other chamber — same dying grid.',
    'Restore power. Sync the gate. Get out.',
  ]

  const finish = useCallback(() => {
    if (doneRef.current) return
    doneRef.current = true
    onDone()
  }, [onDone])

  useGSAP(
    () => {
      const reduced = prefersReducedMotion()
      const words = rootRef.current?.querySelectorAll('.brief-word')
      if (!words?.length) return

      if (reduced) {
        gsap.set(words, { opacity: 1 })
        const t = window.setTimeout(finish, 900)
        return () => window.clearTimeout(t)
      }

      gsap.set(words, { opacity: 0.12 })
      const tl = gsap.timeline({
        onComplete: () => {
          gsap.to('.brief-lights', {
            opacity: 1,
            duration: 0.15,
            yoyo: true,
            repeat: 5,
            ease: 'none',
            onComplete: finish,
          })
        },
      })

      lines.forEach((_, i) => {
        const lineWords = rootRef.current?.querySelectorAll(
          `.brief-line[data-i="${i}"] .brief-word`,
        )
        if (!lineWords?.length) return
        tl.to(
          lineWords,
          {
            opacity: 1,
            duration: 0.45,
            stagger: 0.06,
            ease: 'power2.out',
            onStart: () => setLineIndex(i),
          },
          i === 0 ? 0.35 : '+=0.55',
        )
      })

      tl.to({}, { duration: 0.85 })

      return () => {
        tl.kill()
      }
    },
    { scope: rootRef },
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter' || e.code === 'Escape') {
        e.preventDefault()
        finish()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [finish])

  return (
    <div
      ref={rootRef}
      className="briefing-seq fixed inset-0 z-[20000] flex flex-col items-center justify-center bg-black px-8 font-[family-name:var(--font-game-ui)]"
      style={
        {
          '--font-game-ui': "'Teko', sans-serif",
        } as CSSProperties
      }
      onClick={finish}
      role="presentation"
    >
      <div
        className="brief-lights pointer-events-none absolute inset-0 bg-white opacity-0 mix-blend-screen"
        aria-hidden
      />

      <p className="mb-10 font-[family-name:var(--font-game-ui)] text-sm font-medium uppercase tracking-[0.35em] text-neutral-600">
        Facility PA
      </p>

      <div className="flex max-w-3xl flex-col gap-6 text-center">
        {lines.map((line, i) => (
          <p
            key={line}
            data-i={i}
            className={`brief-line text-2xl font-medium leading-snug tracking-wide text-neutral-100 md:text-4xl ${
              i > lineIndex ? 'opacity-40' : ''
            }`}
          >
            {line.split(' ').map((word, wi) => (
              <span key={`${i}-${wi}`} className="brief-word inline-block">
                {word}
                {wi < line.split(' ').length - 1 ? '\u00A0' : ''}
              </span>
            ))}
          </p>
        ))}
      </div>

      <button
        type="button"
        className="mt-16 font-[family-name:var(--font-game-ui)] text-sm font-semibold uppercase tracking-[0.28em] text-neutral-500 hover:text-neutral-300"
        onClick={(e) => {
          e.stopPropagation()
          finish()
        }}
      >
        Skip — Space
      </button>
    </div>
  )
}
