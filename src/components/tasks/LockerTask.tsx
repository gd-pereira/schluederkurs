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
        Locker latch just clicked. Something useful is waiting inside.
      </FacilityCopy>
      <FacilityBtn tone="teal" onClick={onComplete}>
        Open locker
      </FacilityBtn>
    </FacilityBody>
  )
}
