import {
  FacilityBody,
  FacilityBtn,
  FacilityCopy,
} from '../FacilityUi'

type LeverTaskProps = {
  onComplete: () => void
}

export default function LeverTask({ onComplete }: LeverTaskProps) {
  return (
    <FacilityBody>
      <FacilityCopy>
        Local breaker. Grid stays dead until both pods pull theirs.
      </FacilityCopy>
      <FacilityBtn tone="amber" onClick={onComplete}>
        Pull lever
      </FacilityBtn>
    </FacilityBody>
  )
}
