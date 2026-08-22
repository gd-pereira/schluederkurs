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
        Heavy wrench. Built for bolts — or anything sealed that shouldn’t be.
      </FacilityCopy>
      <FacilityBtn tone="metal" onClick={onComplete}>
        Take wrench
      </FacilityBtn>
    </FacilityBody>
  )
}
