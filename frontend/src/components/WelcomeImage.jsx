import { useEffect, useState } from 'react'

/**
 * 欢迎页图片位。
 * 照片还没放进 public/images/welcome/ 时，自动切换成陶土色系的排版兜底，
 * 不会出现破图，也不会因为补图而跳版。
 */
export default function WelcomeImage({
  src,
  alt,
  emoji = '🏺',
  label,
  ratio = 'aspect-[4/5]',
  className = '',
  priority = false,
}) {
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setFailed(false)
  }, [src])

  return (
    <div className={`relative overflow-hidden ${ratio} ${className}`}>
      {failed ? (
        <div
          role="img"
          aria-label={alt}
          className="relative grid h-full w-full place-items-center overflow-hidden"
          style={{
            backgroundImage:
              'radial-gradient(circle at 26% 18%, rgba(255, 249, 240, 0.9), transparent 46%), linear-gradient(150deg, #F5EBDD 0%, #FFF9F0 52%, rgba(184, 92, 56, 0.16) 100%)',
          }}
        >
          <span className="pointer-events-none absolute -right-10 top-6 h-36 w-36 rounded-full border border-clay/15" />
          <span className="pointer-events-none absolute -bottom-14 -left-10 h-44 w-44 rounded-full border border-celadon/20" />
          <span className="pointer-events-none absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cream/60 blur-2xl" />

          <span className="relative flex flex-col items-center gap-2 px-4 text-center">
            <span className="text-6xl drop-shadow-sm sm:text-7xl" aria-hidden="true">
              {emoji}
            </span>
            <span className="text-sm opacity-70" aria-hidden="true">
              🐾
            </span>
            {label ? (
              <span className="mt-1 font-display text-[11px] tracking-[0.28em] text-ink/35">
                {label}
              </span>
            ) : null}
          </span>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          onError={() => setFailed(true)}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          className="h-full w-full object-cover"
        />
      )}
    </div>
  )
}
