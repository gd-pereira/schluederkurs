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
          Under the grime: even slots only. Odds live somewhere you can&apos;t
          see.
        </FacilityCopy>
        <FacilityCode>{CODE_CLUE_EVENS}</FacilityCode>
        <FacilityHint>Esc to close — tell your partner</FacilityHint>
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
          ? 'Grime hides a partial sequence. Wipe it — you won’t get the whole code here.'
          : 'Panel caked in grime. Need a rag before anything legible shows.'}
      </FacilityCopy>
      <FacilityBtn tone="metal" onClick={onComplete} disabled={!hasRag}>
        Wipe panel
      </FacilityBtn>
      {!hasRag && <FacilityHint>Find the rag on the cart first</FacilityHint>}
    </FacilityBody>
  )
}
