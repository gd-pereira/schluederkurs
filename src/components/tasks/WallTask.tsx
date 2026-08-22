import { modalAssetUrl } from '../../game/assets'
import OptionalAssetImg from '../OptionalAssetImg'

type WallTaskProps = {
  hasRag: boolean
  onComplete: () => void
}

export default function WallTask({ hasRag, onComplete }: WallTaskProps) {
  return (
    <div>
      <OptionalAssetImg
        src={modalAssetUrl('wall')}
        alt=""
        className="mb-4 mx-auto max-h-40 w-auto object-contain"
      />
      <p className="text-sm leading-relaxed text-neutral-700">
        {hasRag
          ? 'Grime spells out a threat: SMASH THE VASE. Wipe it clean so the other pod can read it… or just trust the facility.'
          : 'The wall is caked in grime. You need a rag before you can wipe anything.'}
      </p>
      <button
        type="button"
        onClick={onComplete}
        disabled={!hasRag}
        className="mt-5 w-full rounded-md border-2 border-neutral-800 bg-stone-400 px-4 py-3 text-sm font-bold uppercase tracking-wide text-neutral-900 hover:bg-stone-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-800 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-stone-400"
      >
        Wipe wall
      </button>
    </div>
  )
}
