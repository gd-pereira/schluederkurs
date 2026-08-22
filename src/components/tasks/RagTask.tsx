import {
  FacilityBody,
  FacilityBtn,
  FacilityCopy,
} from '../FacilityUi'

type RagTaskProps = {
  onComplete: () => void
}

export default function RagTask({ onComplete }: RagTaskProps) {
  return (
    <FacilityBody>
      <FacilityCopy>
        Greasy rag on the cart. Good for wiping a filthy panel.
      </FacilityCopy>
      <FacilityBtn tone="metal" onClick={onComplete}>
        Take rag
      </FacilityBtn>
    </FacilityBody>
  )
}
