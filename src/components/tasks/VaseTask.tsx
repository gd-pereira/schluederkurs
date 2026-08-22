import { useState } from 'react'
import { modalAssetUrl } from '../../game/assets'
import { VASE_CODE } from '../../game/matchFlags'
import OptionalAssetImg from '../OptionalAssetImg'

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

  if (showCode) {
    return (
      <div className="text-center">
        <OptionalAssetImg
          src={modalAssetUrl('vase')}
          alt=""
          className="mb-4 mx-auto max-h-40 w-auto object-contain"
        />
        <p className="text-sm text-neutral-600">Shards everywhere. The code is:</p>
        <p className="mt-3 font-mono text-4xl font-bold tracking-[0.2em] text-neutral-900">
          {VASE_CODE}
        </p>
        <p className="mt-3 text-xs text-neutral-500">Esc to close</p>
      </div>
    )
  }

  if (!canSmash) {
    return (
      <div>
        <OptionalAssetImg
          src={modalAssetUrl('vase')}
          alt=""
          className="mb-4 mx-auto max-h-40 w-auto object-contain"
        />
        <p className="text-sm leading-relaxed text-neutral-700">
          Fancy vase. You need a wrench — and the other pod still has to wipe that
          wall clue first.
        </p>
      </div>
    )
  }

  return (
    <div>
      <OptionalAssetImg
        src={modalAssetUrl('vase')}
        alt=""
        className="mb-4 mx-auto max-h-40 w-auto object-contain"
      />
      <p className="text-sm leading-relaxed text-neutral-700">
        The placard said smash it. Facility insurance is going to love this.
      </p>
      <button
        type="button"
        onClick={() => {
          onSmash()
          setRevealed(true)
        }}
        className="mt-5 w-full rounded-md border-2 border-neutral-800 bg-violet-400 px-4 py-3 text-sm font-bold uppercase tracking-wide text-neutral-900 hover:bg-violet-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-800"
      >
        Smash vase
      </button>
    </div>
  )
}
