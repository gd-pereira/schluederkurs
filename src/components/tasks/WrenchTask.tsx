import {
  FacilityBody,
  FacilityBtn,
  FacilityCopy,
} from '../FacilityUi'

type WrenchTaskProps = {
  onComplete: () => void
}

export default function WrenchTask({ onComplete }: WrenchTaskProps) {
  return (
    <FacilityBody>
      <FacilityCopy>
        Heavy wrench. Good for bolts, or anything sealed shut.
      </FacilityCopy>
      <FacilityBtn tone="metal" onClick={onComplete}>
        Take wrench
      </FacilityBtn>
    </FacilityBody>
  )
}
