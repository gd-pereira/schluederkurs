import type { ButtonHTMLAttributes, ReactNode } from 'react'

/** Shared industrial facility controls for Mode B task panels. */

export function FacilityBody({ children }: { children: ReactNode }) {
  return <div className="facility-body">{children}</div>
}

export function FacilityCopy({ children }: { children: ReactNode }) {
  return <p className="facility-copy">{children}</p>
}

export function FacilityHint({ children }: { children: ReactNode }) {
  return <p className="facility-hint">{children}</p>
}

export function FacilityCallout({
  tone = 'amber',
  children,
}: {
  tone?: 'amber' | 'fault' | 'ok'
  children: ReactNode
}) {
  return <div className={`facility-callout facility-callout--${tone}`}>{children}</div>
}

export function FacilityCode({ children }: { children: ReactNode }) {
  return <p className="facility-code">{children}</p>
}

export function FacilityArt({ children }: { children: ReactNode }) {
  return <div className="facility-art">{children}</div>
}

type FacilityBtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: 'amber' | 'teal' | 'danger' | 'metal' | 'hold'
}

export function FacilityBtn({
  tone = 'amber',
  className = '',
  children,
  ...rest
}: FacilityBtnProps) {
  return (
    <button
      type="button"
      className={`facility-btn facility-btn--${tone} ${className}`.trim()}
      {...rest}
    >
      {children}
    </button>
  )
}
