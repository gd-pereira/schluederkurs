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
          Shards on the pedestal. Odd slots only. Evens are on the other side.
        </FacilityCopy>
        <FacilityCode>{CODE_CLUE_ODDS}</FacilityCode>
        <FacilityHint>Esc to close. Tell your partner.</FacilityHint>
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
          Sealed ceramic. Needs a wrench, and whatever the other pod was
          supposed to clear first.
        </FacilityCopy>
        <FacilityHint>Locked until wall wipe and wrench</FacilityHint>
      </FacilityBody>
    )
  }

  return (
    <FacilityBody>
      <FacilityArt>
        <OptionalAssetImg src={modalAssetUrl('vase')} alt="" />
      </FacilityArt>
      <FacilityCopy>
        Display sealed. Smash it.
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
