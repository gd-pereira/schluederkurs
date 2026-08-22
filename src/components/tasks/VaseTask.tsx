import { useState } from 'react'
import { modalAssetUrl } from '../../game/assets'
import { CODE_CLUE_ODDS } from '../../game/matchFlags'
import OptionalAssetImg from '../OptionalAssetImg'
import {
  FacilityArt,
  FacilityBody,
  FacilityBtn,
  FacilityCode,
  FacilityCopy,
  FacilityHint,
} from '../FacilityUi'

type VaseTaskProps = {
  alreadySmashed: boolean
  canSmash: boolean
  onSmash: () => void
}

export default function VaseTask({
  alreadySmashed,
  canSmash,
  onSmash,
}: VaseTaskProps) {
  const [revealed, setRevealed] = useState(alreadySmashed)
  const showCode = revealed || alreadySmashed
  const artKey = showCode ? 'vase_shards' : 'vase'

  if (showCode) {
    return (
      <FacilityBody>
        <FacilityArt>
          <OptionalAssetImg src={modalAssetUrl(artKey)} alt="" />
        </FacilityArt>
        <FacilityCopy>
          Shards on the pedestal. Odd slots only — evens belong to the other
          pod.
        </FacilityCopy>
        <FacilityCode>{CODE_CLUE_ODDS}</FacilityCode>
        <FacilityHint>Esc to close — tell your partner</FacilityHint>
      </FacilityBody>
    )
  }

  if (!canSmash) {
    return (
      <FacilityBody>
        <FacilityArt>
          <OptionalAssetImg src={modalAssetUrl('vase')} alt="" />
        </FacilityArt>
        <FacilityCopy>
          Sealed ceramic on the pedestal. Needs a wrench — and whatever the
          other pod was supposed to clear first.
        </FacilityCopy>
        <FacilityHint>Locked until wall wipe + wrench</FacilityHint>
      </FacilityBody>
    )
  }

  return (
    <FacilityBody>
      <FacilityArt>
        <OptionalAssetImg src={modalAssetUrl('vase')} alt="" />
      </FacilityArt>
      <FacilityCopy>
        Display sealed. Facility insurance is going to love this.
      </FacilityCopy>
      <FacilityBtn
        tone="danger"
        onClick={() => {
          onSmash()
          setRevealed(true)
        }}
      >
        Smash vase
      </FacilityBtn>
    </FacilityBody>
  )
}
