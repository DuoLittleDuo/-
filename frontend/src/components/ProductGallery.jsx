import { useState } from 'react'
import GalleryLightbox from './GalleryLightbox'
import ProductImage from './ProductImage'

export default function ProductGallery({ product }) {
  const views = [
    {
      key: 'full',
      label: '全貌',
      sku: product.sku,
      src: product.image_url || undefined,
      variant: 'default',
    },
    {
      key: 'detail',
      label: '釉面',
      sku: product.sku,
      src: undefined,
      variant: 'detail',
    },
  ]

  const [active, setActive] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  return (
    <div>
      <button
        type="button"
        onClick={() => setLightboxOpen(true)}
        aria-label={`查看${product.name}大图`}
        className="object-stage group relative block w-full cursor-zoom-in overflow-hidden"
      >
        <div className="aspect-[4/5] w-full">
          <ProductImage
            key={views[active].key}
            sku={views[active].sku}
            src={views[active].src}
            variant={views[active].variant}
            alt={`${product.name} · ${views[active].label}`}
            priority
            sizes="(min-width: 1024px) 46vw, 90vw"
            className="animate-fade-in transition-transform duration-900 ease-silk group-hover:scale-[1.02]"
          />
        </div>

        <span className="exhibit-no absolute left-5 top-5">NO. {String(product.id).padStart(3, '0')}</span>
        <span className="absolute bottom-5 right-5 text-[10px] tracking-[0.2em] text-ink/45">
          点击查看大图
        </span>
      </button>

      <div className="mt-4 grid grid-cols-2 gap-4">
        {views.map((view, index) => (
          <button
            key={view.key}
            type="button"
            onClick={() => setActive(index)}
            aria-pressed={index === active}
            className={`group text-left transition duration-300 ease-silk ${
              index === active ? 'opacity-100' : 'opacity-60 hover:opacity-90'
            }`}
          >
            <div className="object-stage aspect-square overflow-hidden">
              <ProductImage
                sku={view.sku}
                src={view.src}
                variant={view.variant}
                alt={`${product.name} · ${view.label}`}
                sizes="(min-width: 1024px) 22vw, 44vw"
                className="transition-transform duration-700 ease-silk group-hover:scale-[1.03]"
              />
            </div>
            <div
              className={`mt-2.5 flex items-center gap-2 border-t pt-2 text-[10px] tracking-[0.2em] transition ${
                index === active ? 'border-clay text-clay' : 'border-line text-ink/40'
              }`}
            >
              <span className="font-mono">{String(index + 1).padStart(2, '0')}</span>
              <span>{view.label}</span>
            </div>
          </button>
        ))}
      </div>

      <GalleryLightbox
        open={lightboxOpen}
        views={views}
        index={active}
        onChange={setActive}
        onClose={() => setLightboxOpen(false)}
        title={product.name}
      />
    </div>
  )
}
