import { Link } from 'react-router-dom'
import FavoriteButton from './FavoriteButton'
import ProductImage from './ProductImage'
import SimilarityBadge from './SimilarityBadge'
import { IconArrowUpRight } from './icons'

export default function ProductCard({ product, meta, index }) {
  const number = String(index ?? product.id).padStart(3, '0')

  return (
    <Link to={`/product/${product.id}`} className="group block">
      <div className="object-stage relative overflow-hidden">
        <div className="aspect-square w-full overflow-hidden">
          <ProductImage
            sku={product.sku}
            src={product.image_url || undefined}
            alt={product.name}
            sizes="(min-width: 1280px) 28vw, (min-width: 768px) 44vw, 90vw"
            className="transition-transform duration-700 ease-silk group-hover:scale-[1.03]"
          />
        </div>

        <div className="absolute right-3 top-3">
          <FavoriteButton productId={product.id} />
        </div>

        {meta?.similarity != null ? (
          <SimilarityBadge
            similarity={meta.similarity}
            reason={meta.match_reason}
            className="absolute bottom-3 left-3"
          />
        ) : null}
      </div>

      <div className="mt-4 flex items-baseline justify-between gap-3 border-t border-line pt-3">
        <span className="exhibit-no">NO. {number}</span>
        <span className="shrink-0 text-[10px] tracking-[0.18em] text-ink/40">
          {product.pet_type}
        </span>
      </div>

      <div className="mt-2 min-w-0">
        <h3 className="truncate font-display text-base text-ink transition duration-300 ease-silk group-hover:text-clay">
          {product.name}
        </h3>
        <p className="mt-1 truncate text-xs text-ink/55">{product.subtitle}</p>
      </div>

      <div className="mt-3 flex items-end justify-between">
        <p className="font-mono text-sm text-ink/80">
          ¥{product.price}
          {product.original_price ? (
            <span className="ml-2 text-[11px] text-ink/30 line-through">¥{product.original_price}</span>
          ) : null}
        </p>
        <span className="flex items-center gap-1.5 text-[11px] text-ink/40 transition duration-300 ease-silk group-hover:text-clay">
          已售 {product.sales_count}
          <IconArrowUpRight className="h-3.5 w-3.5" />
        </span>
      </div>

    </Link>
  )
}
