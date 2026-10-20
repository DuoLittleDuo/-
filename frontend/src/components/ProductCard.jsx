import { Link } from 'react-router-dom'
import FavoriteButton from './FavoriteButton'
import ProductVisual from './ProductVisual'
import SimilarityBadge from './SimilarityBadge'

export default function ProductCard({ product, meta }) {
  return (
    <Link
      to={`/product/${product.id}`}
      className="card group block hover:-translate-y-1 hover:border-clay/30 hover:shadow-soft"
    >
      <div className="relative">
        <ProductVisual product={product} />
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

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 font-display text-base text-ink transition group-hover:text-clay">
            {product.name}
          </h3>
          <span className="shrink-0 rounded-full bg-sand px-2 py-0.5 text-[10px] text-ink/45">
            {product.pet_type}
          </span>
        </div>

        <p className="mt-1 line-clamp-1 text-xs text-ink/45">{product.subtitle}</p>

        <div className="mt-2.5 flex flex-wrap gap-1">
          {(product.tags || []).slice(0, 2).map((tag) => (
            <span key={tag} className="tag-pill">
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-4 flex items-end justify-between">
          <div className="text-clay">
            <span className="text-xs">¥</span>
            <span className="ml-0.5 text-xl font-semibold">{product.price}</span>
            {product.original_price ? (
              <span className="ml-1.5 text-[11px] text-ink/30 line-through">
                ¥{product.original_price}
              </span>
            ) : null}
          </div>
          <span className="text-[11px] text-ink/35">已售 {product.sales_count}</span>
        </div>

        {meta?.match_reason ? (
          <p className="mt-2 line-clamp-1 text-[11px] text-celadon">{meta.match_reason}</p>
        ) : null}
      </div>
    </Link>
  )
}
