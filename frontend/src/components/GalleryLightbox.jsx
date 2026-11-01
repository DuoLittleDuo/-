import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import ProductImage from './ProductImage'
import { IconClose, IconArrowLeft, IconArrowRight } from './icons'

export default function GalleryLightbox({ open, views, index, onChange, onClose, title }) {
  const closeRef = useRef(null)
  const restoreRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined

    restoreRef.current = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()

    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowRight') onChange((index + 1) % views.length)
      if (event.key === 'ArrowLeft') onChange((index - 1 + views.length) % views.length)
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      if (restoreRef.current instanceof HTMLElement) restoreRef.current.focus()
    }
  }, [open, index, views.length, onChange, onClose])

  if (!open) return null

  const view = views[index]

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${title} 图片预览`}
      className="fixed inset-0 z-[80] flex flex-col bg-ink/92 animate-fade-in"
      onClick={onClose}
    >
      <div className="flex items-center justify-between px-gutter py-5 text-paper/70">
        <span className="font-mono text-micro tracking-[0.24em]">
          {String(index + 1).padStart(2, '0')} / {String(views.length).padStart(2, '0')}
        </span>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="关闭预览"
          className="grid h-10 w-10 place-items-center border border-paper/20 transition hover:border-paper/60 hover:text-paper"
        >
          <IconClose />
        </button>
      </div>

      <div
        className="flex flex-1 items-center justify-center px-gutter pb-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative h-full max-h-[76vh] w-full max-w-4xl">
          <ProductImage
            key={view.key}
            sku={view.sku}
            src={view.src}
            variant={view.variant}
            alt={`${title} · ${view.label}`}
            priority
            sizes="90vw"
            className="object-contain animate-fade-in"
          />
        </div>
      </div>

      <div
        className="flex items-center justify-between gap-4 px-gutter pb-6 text-xs text-paper/60"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => onChange((index - 1 + views.length) % views.length)}
          className="inline-flex items-center gap-2 border-b border-paper/20 pb-1 transition hover:border-paper/60 hover:text-paper"
        >
          <IconArrowLeft className="h-4 w-4" />
          上一视角
        </button>

        <span className="font-display text-sm text-paper/80">{view.label}</span>

        <button
          type="button"
          onClick={() => onChange((index + 1) % views.length)}
          className="inline-flex items-center gap-2 border-b border-paper/20 pb-1 transition hover:border-paper/60 hover:text-paper"
        >
          下一视角
          <IconArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>,
    document.body,
  )
}
