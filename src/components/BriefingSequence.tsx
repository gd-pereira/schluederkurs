import { useCallback, useEffect, useMemo, useRef, type CSSProperties } from 'react'
import { gsap, prefersReducedMotion, useGSAP } from '../lib/gsap'

type BriefingSequenceProps = {
  pod: 'a' | 'b'
  onDone: () => void
}

function splitChars(text: string): string[] {
  return Array.from(text)
}

function renderLineChars(line: string) {
  const words = line.split(' ')
  return words.map((word, wi) => (
    <span key={`${line}-w${wi}`} className="brief-word inline-block whitespace-nowrap">
      {splitChars(word).map((ch, ci) => (
        <span
          key={`${line}-w${wi}-c${ci}`}
          className="brief-char inline-block will-change-transform"
        >
          {ch}
        </span>
      ))}
      {wi < words.length - 1 ? (
        <span className="brief-char inline-block will-change-transform">
          {'\u00A0'}
        </span>
      ) : null}
    </span>
  ))
}

export default function BriefingSequence({ pod, onDone }: BriefingSequenceProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const doneRef = useRef(false)
  const tlRef = useRef<ReturnType<typeof gsap.timeline> | null>(null)

  const lines = useMemo(
    () => [
      'Lockdown engaged.',
      `You are sealed in Pod ${pod.toUpperCase()}.`,
      'Your partner waits in the other chamber.',
      'Same dying grid. Same gate.',
      'Restore power. Sync. Get out.',
    ],
    [pod],
  )

  const finish = useCallback(() => {
    if (doneRef.current) return
    doneRef.current = true
    tlRef.current?.kill()
    tlRef.current = null
    onDone()
  }, [onDone])

  useGSAP(
    () => {
      const root = rootRef.current
      if (!root) return

      const reduced = prefersReducedMotion()
      const lineEls = root.querySelectorAll<HTMLElement>('.brief-line')

      if (reduced) {
        gsap.set(lineEls, { autoAlpha: 0 })
        gsap.set(lineEls[lineEls.length - 1], { autoAlpha: 1 })
        const t = window.setTimeout(finish, 700)
        return () => window.clearTimeout(t)
      }

      gsap.set(lineEls, { autoAlpha: 0 })
      gsap.set(root.querySelectorAll('.brief-char'), {
        autoAlpha: 0,
        y: 16,
      })

      const tl = gsap.timeline({
        defaults: { ease: 'power2.out' },
        onComplete: finish,
      })
      tlRef.current = tl

      lineEls.forEach((lineEl, i) => {
        const chars = lineEl.querySelectorAll('.brief-char')
        const isLast = i === lineEls.length - 1

        // Beat of pure black between phrases
        tl.set(lineEls, { autoAlpha: 0 }, i === 0 ? 0.75 : '+=0.45')
        tl.set(lineEl, { autoAlpha: 1 })
        tl.set(chars, { autoAlpha: 0, y: 16 })

        tl.to(chars, {
          autoAlpha: 1,
          y: 0,
          duration: 0.38,
          stagger: {
            each: 0.042,
            ease: 'none',
          },
        })

        tl.to({}, { duration: isLast ? 1.65 : 1.2 })

        if (!isLast) {
          tl.to(chars, {
            autoAlpha: 0,
            y: -10,
            duration: 0.48,
            stagger: {
              each: 0.014,
              from: 'end',
            },
            ease: 'power2.in',
          })
        } else {
          tl.to(lineEl, {
            autoAlpha: 0,
            duration: 1,
            ease: 'power2.inOut',
          })
          tl.to({}, { duration: 0.4 })
        }
      })

      return () => {
        tl.kill()
        tlRef.current = null
      }
    },
    { scope: rootRef, dependencies: [lines, finish] },
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
      className="briefing-seq fixed inset-0 z-[20000] flex items-center justify-center bg-black"
      style={
        {
          '--font-brief': "'Audiowide', sans-serif",
        } as CSSProperties
      }
      onClick={finish}
      role="presentation"
      aria-live="polite"
    >
      <div className="briefing-seq__grain pointer-events-none absolute inset-0" aria-hidden />

      <div className="relative z-10 w-full max-w-4xl px-8 text-center">
        {lines.map((line) => (
          <p
            key={line}
            className="brief-line absolute inset-x-8 top-1/2 -translate-y-1/2 font-[family-name:var(--font-brief)] text-[clamp(1.35rem,4vw,2.65rem)] font-normal uppercase leading-[1.35] tracking-[0.14em] text-neutral-100"
            style={{
              textShadow: '0 0 28px rgba(251, 191, 36, 0.18)',
            }}
          >
            {renderLineChars(line)}
          </p>
        ))}
        {/* Reserve vertical space so absolute lines stay centered */}
        <p
          className="invisible font-[family-name:var(--font-brief)] text-[clamp(1.35rem,4vw,2.65rem)] font-normal uppercase leading-[1.35] tracking-[0.14em]"
          aria-hidden
        >
          {lines.reduce((a, b) => (a.length >= b.length ? a : b))}
        </p>
      </div>
    </div>
  )
}
