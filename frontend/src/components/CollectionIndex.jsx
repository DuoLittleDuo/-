import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ProductImage from './ProductImage'
import { IconArrowRight } from './icons'

const PREVIEW_SKU = {
  'food-bowls': 'ZG-SB-01',
  'water-bowls': 'ZG-SW-01',
  tags: 'ZG-GP-01',
  ornaments: 'ZG-BJ-01',
  memorials: 'ZG-JN-01',
}

export default function CollectionIndex({ categories = [] }) {
  const [active, setActive] = useState(0)
  const navigate = useNavigate()

  if (!categories.length) return null
  const current = categories[Math.min(active, categories.length - 1)]

  return (
    <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
      <div className="border-t border-line">
        {categories.map((category, index) => {
          const isActive = index === active
          return (
            <button
              key={category.id}
              type="button"
              onMouseEnter={() => setActive(index)}
              onFocus={() => setActive(index)}
              onClick={() => navigate(`/search?category_id=${category.id}`)}
              className="group flex w-full items-baseline gap-5 border-b border-line py-5 text-left"
            >
              <span
                className={`font-mono text-micro tracking-[0.2em] transition-colors duration-300 ${
                  isActive ? 'text-clay' : 'text-ink/30'
                }`}
              >
                {String(index + 1).padStart(2, '0')}
              </span>

              <span className="min-w-0">
                <span
                  className={`block font-display text-xl transition-colors duration-300 sm:text-2xl ${
                    isActive ? 'text-clay' : 'text-ink'
                  }`}
                >
                  {category.name}
                </span>
                <span className="mt-1 block truncate text-xs text-ink/45">
                  {category.description}
                </span>
              </span>

              <span className="ml-auto flex shrink-0 items-center gap-3 text-[11px] text-ink/40">
                {category.product_count} 件
                <IconArrowRight
                  className={`h-4 w-4 transition-all duration-300 ease-silk ${
                    isActive ? 'translate-x-0 text-clay opacity-100' : '-translate-x-1 opacity-0'
                  }`}
                />
              </span>
            </button>
          )
        })}
      </div>

      <div className="relative hidden lg:block">
        <div className="object-stage aspect-[4/5] overflow-hidden">
          {categories.map((category, index) => (
            <ProductImage
              key={category.id}
              sku={PREVIEW_SKU[category.slug] || 'ZG-SB-01'}
              alt={category.name}
              sizes="40vw"
              className={`absolute inset-0 transition-opacity duration-650 ease-silk ${
                index === active ? 'opacity-100' : 'opacity-0'
              }`}
            />
          ))}
        </div>

        <div className="mt-4 flex items-baseline justify-between border-t border-line pt-3">
          <p className="text-micro tracking-[0.2em] text-ink/45">
            {current?.emoji} {current?.slug}
          </p>
          <p className="font-display text-sm text-ink/70">{current?.name}</p>
        </div>
      </div>
    </div>
  )
}
