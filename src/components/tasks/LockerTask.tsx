import {
  FacilityBody,
  FacilityBtn,
  FacilityCopy,
} from '../FacilityUi'

type LockerTaskProps = {
  onComplete: () => void
}

export default function LockerTask({ onComplete }: LockerTaskProps) {
  return (
    <FacilityBody>
      <FacilityCopy>
        Locker clicked open. Grab what&apos;s inside.
      </FacilityCopy>
      <FacilityBtn tone="teal" onClick={onComplete}>
        Open locker
      </FacilityBtn>
    </FacilityBody>
  )
}
