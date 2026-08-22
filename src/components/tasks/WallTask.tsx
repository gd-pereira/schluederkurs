import { modalAssetUrl } from '../../game/assets'
import { CODE_CLUE_EVENS } from '../../game/matchFlags'
import OptionalAssetImg from '../OptionalAssetImg'
import {
  FacilityArt,
  FacilityBody,
  FacilityBtn,
  FacilityCode,
  FacilityCopy,
  FacilityHint,
} from '../FacilityUi'

type WallTaskProps = {
  hasRag: boolean
  wallWiped: boolean
  onComplete: () => void
}

export default function WallTask({
  hasRag,
  wallWiped,
  onComplete,
}: WallTaskProps) {
  if (wallWiped) {
    return (
      <FacilityBody>
        <FacilityArt>
          <OptionalAssetImg src={modalAssetUrl('wall')} alt="" />
        </FacilityArt>
        <FacilityCopy>
          Under the grime: even slots only. Odds are on the other side.
        </FacilityCopy>
        <FacilityCode>{CODE_CLUE_EVENS}</FacilityCode>
        <FacilityHint>Esc to close. Tell your partner.</FacilityHint>
      </FacilityBody>
    )
  }

  return (
    <FacilityBody>
      <FacilityArt>
        <OptionalAssetImg src={modalAssetUrl('wall')} alt="" />
      </FacilityArt>
      <FacilityCopy>
        {hasRag
          ? "Grime hides part of a code. Wipe it. You won't get all four digits here."
          : 'Panel is caked in grime. Need a rag first.'}
      </FacilityCopy>
      <FacilityBtn tone="metal" onClick={onComplete} disabled={!hasRag}>
        Wipe panel
      </FacilityBtn>
      {!hasRag && <FacilityHint>Find the rag on the cart first</FacilityHint>}
    </FacilityBody>
  )
}
