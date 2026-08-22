import {
  FacilityBody,
  FacilityBtn,
  FacilityCopy,
  FacilityHint,
} from '../FacilityUi'

type LockerTaskProps = {
  onComplete: () => void
}

export default function LockerTask({ onComplete }: LockerTaskProps) {
  return (
    <FacilityBody>
      <FacilityCopy>
        Spare fuse inside. Take it, then find the fuse bay to install it.
      </FacilityCopy>
      <FacilityBtn tone="teal" onClick={onComplete}>
        Take fuse
      </FacilityBtn>
      <FacilityHint>Needs free grid power when you install</FacilityHint>
    </FacilityBody>
  )
}
