import { modalAssetUrl } from '../../game/assets'
import { CODE_CLUE_EVENS } from '../../game/matchFlags'
import OptionalAssetImg from '../OptionalAssetImg'

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
      <div>
        <OptionalAssetImg
          src={modalAssetUrl('wall')}
          alt=""
          className="mb-4 mx-auto max-h-40 w-auto object-contain"
        />
        <p className="text-sm leading-relaxed text-neutral-700">
          Under the grime: even slots only. Odds live somewhere you can&apos;t
          see.
        </p>
        <p className="mt-4 font-mono text-3xl font-bold tracking-[0.2em] text-neutral-900">
          {CODE_CLUE_EVENS}
        </p>
        <p className="mt-3 text-xs text-neutral-500">Esc to close — tell your partner</p>
      </div>
    )
  }

  return (
    <div>
      <OptionalAssetImg
        src={modalAssetUrl('wall')}
        alt=""
        className="mb-4 mx-auto max-h-40 w-auto object-contain"
      />
      <p className="text-sm leading-relaxed text-neutral-700">
        {hasRag
          ? 'Grime hides a partial sequence. Wipe it — you won’t get the whole code here.'
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
