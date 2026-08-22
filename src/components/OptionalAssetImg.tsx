import { useAssetReady } from '../hooks/useAssetReady'

type OptionalAssetImgProps = {
  src: string
  alt: string
  className?: string
}

/** Renders nothing until the PNG loads; hides on error (no broken icon). */
export default function OptionalAssetImg({
  src,
  alt,
  className,
}: OptionalAssetImgProps) {
  const ready = useAssetReady(src)
  if (!ready) return null
  return <img src={src} alt={alt} className={className} draggable={false} />
}
