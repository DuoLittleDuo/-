import { useEffect, useState } from 'react'

export default function ProductVisual({
  product,
  className = '',
  size = 'text-6xl',
  showBadge = true,
}) {
  const color = product?.theme_color || '#B85C38'
  const imageSrc =
    product?.image_url || (product?.sku ? `/images/products/${product.sku}.jpg` : '')
  const [imageFailed, setImageFailed] = useState(false)

  useEffect(() => {
    setImageFailed(false)
  }, [imageSrc])

  if (imageSrc && !imageFailed) {
    return (
      <img
        src={imageSrc}
        alt={product?.name || '柘沟陶宠商品'}
        onError={() => setImageFailed(true)}
        loading="lazy"
        decoding="async"
        className={`aspect-square w-full bg-sand/30 object-contain ${className}`}
      />
    )
  }

  return (
    <div
      className={`relative aspect-[4/3] w-full overflow-hidden ${className}`}
      style={{
        background: `radial-gradient(circle at 30% 22%, ${color}24, ${color}10 52%, #F5EBDD 100%)`,
      }}
    >
      <span
        className="absolute -right-8 -top-10 h-32 w-32 rounded-full border border-white/60"
        style={{ background: `${color}16` }}
      />
      <span
        className="absolute -bottom-12 -left-10 h-40 w-40 rounded-full border border-white/50"
        style={{ background: `${color}10` }}
      />
      <span
        className="absolute right-8 bottom-6 h-16 w-16 rounded-full border border-white/70"
        style={{ background: `${color}12` }}
      />

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
        <span className={`${size} drop-shadow-sm`}>{product?.cover_emoji || '🏺'}</span>
        <span className="rounded-full bg-white/70 px-2.5 py-0.5 text-[10px] tracking-[0.18em] text-ink/55">
          {product?.category_name || '柘沟土陶'}
        </span>
      </div>

      {showBadge ? (
        <span className="absolute left-3 top-3 rounded-full bg-white/75 px-2 py-0.5 text-[10px] text-ink/45 backdrop-blur">
          柘沟陶宠 · 手作
        </span>
      ) : null}
    </div>
  )
}
