import { useEffect, useState } from 'react'

const fallbackSrc = (sku) => `/images/products/${sku}.jpg`
const webpBase = (sku) => `/images/products/opt/${sku}`

/**
 * 统一图片管线：优先 WebP 响应式图，失败回退原 JPG，再失败显示展台占位。
 * 父容器负责宽高比，这里只负责填满。
 */
export default function ProductImage({
  sku,
  src,
  alt = '',
  className = '',
  sizes = '(min-width: 1280px) 30vw, (min-width: 768px) 45vw, 90vw',
  priority = false,
  variant = 'default',
  width,
  height,
}) {
  const [stage, setStage] = useState('webp')

  useEffect(() => {
    setStage('webp')
  }, [sku, src])

  const jpg = src || (sku ? fallbackSrc(sku) : '')
  const useWebp = Boolean(sku)

  const loading = priority ? 'eager' : 'lazy'
  const fetchPriority = priority ? 'high' : 'low'

  if (stage === 'placeholder' || !jpg) {
    return (
      <span
        role="img"
        aria-label={alt}
        className={`object-stage grid h-full w-full place-items-center border border-line ${className}`}
      >
        <span className="font-display text-3xl text-clay/25" aria-hidden="true">
          陶
        </span>
      </span>
    )
  }

  const imgProps = {
    alt,
    loading,
    decoding: 'async',
    fetchpriority: fetchPriority,
    className: `h-full w-full object-cover ${className}`,
    ...(width ? { width } : {}),
    ...(height ? { height } : {}),
  }

  if (stage === 'jpg' || !useWebp) {
    return <img src={jpg} onError={() => setStage('placeholder')} {...imgProps} />
  }

  const srcSet =
    variant === 'detail'
      ? `${webpBase(sku)}-detail-960.webp 960w`
      : `${webpBase(sku)}-480.webp 480w, ${webpBase(sku)}-960.webp 960w, ${webpBase(sku)}-1440.webp 1440w`

  return (
    <picture className="block h-full w-full">
      <source type="image/webp" srcSet={srcSet} sizes={sizes} />
      <img src={jpg} onError={() => setStage('jpg')} {...imgProps} />
    </picture>
  )
}
