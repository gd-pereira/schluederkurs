import { useEffect } from 'react'
import { FUSE_RESERVE } from '../../game/constants'
import {
  FacilityBody,
  FacilityBtn,
  FacilityCallout,
  FacilityCopy,
  FacilityHint,
} from '../FacilityUi'

type FuseTaskProps = {
  canReserve: boolean
  reserved: boolean
  freePower: number
  partnerReserve: number
  lightsOn: boolean
  onReserve: () => void
  onInstall: () => void
  onClearReserve: () => void
}

export default function FuseTask({
  canReserve,
  reserved,
  freePower,
  partnerReserve,
  lightsOn,
  onReserve,
  onInstall,
  onClearReserve,
}: FuseTaskProps) {
  useEffect(() => {
    if (canReserve) onReserve()
    return () => {
      onClearReserve()
    }
  }, [canReserve, onReserve, onClearReserve])

  if (!canReserve && !reserved) {
    return (
      <FacilityBody>
        <FacilityCopy>
          Fuse bay locked. Needs <strong>{FUSE_RESERVE}% free</strong> on the
          shared grid.
        </FacilityCopy>
        <FacilityCallout tone="fault">
          <p>
            Free now: <strong>{Math.round(freePower)}%</strong>
            {partnerReserve > 0 && (
              <>
                {' '}
                · Partner holding <strong>{partnerReserve}%</strong>
              </>
            )}
          </p>
          <p className="mt-1 font-semibold text-red-100">
            {partnerReserve >= 80
              ? 'Partner’s keypad is open — they must close or yield before you can install.'
              : `Need ${FUSE_RESERVE - Math.round(freePower)}% more free. Talk to your partner.`}
          </p>
        </FacilityCallout>
        <FacilityHint>Close and wait — reopen to retry reserve</FacilityHint>
      </FacilityBody>
    )
  }

  return (
    <FacilityBody>
      <FacilityCopy>
        Fuse bay online. Install holds <strong>{FUSE_RESERVE}%</strong> until
        you finish — partner’s lights die while you work.
      </FacilityCopy>
      <FacilityCallout tone={lightsOn ? 'amber' : 'fault'}>
        <p>
          Free left: <strong>{Math.round(freePower)}%</strong>
          {' · '}
          Lights <strong>{lightsOn ? 'ON' : 'OUT'}</strong>
          {reserved ? (
            <>
              {' · '}
              Holding <strong>{FUSE_RESERVE}%</strong>
            </>
          ) : null}
        </p>
      </FacilityCallout>
      <FacilityBtn tone="amber" onClick={onInstall} disabled={!reserved}>
        Install fuse
      </FacilityBtn>
    </FacilityBody>
  )
}
