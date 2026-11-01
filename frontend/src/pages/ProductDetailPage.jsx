import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { errorMessage } from '../api/client'
import { getProduct, relatedProducts } from '../api/products'
import EmptyState from '../components/EmptyState'
import ProductCard from '../components/ProductCard'
import ProductDetailSkeleton from '../components/ProductDetailSkeleton'
import ProductGallery from '../components/ProductGallery'
import QuantityStepper from '../components/QuantityStepper'
import { useCart } from '../context/CartContext'
import { useFavorites } from '../context/FavoritesContext'
import { craftNote } from '../data/craftNotes'
import { IconHeart } from '../components/icons'

export default function ProductDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isFavorite, toggle } = useFavorites()
  const { add, items: cartItems, updateQuantity } = useCart()

  const [product, setProduct] = useState(null)
  const [related, setRelated] = useState([])
  const [relatedMode, setRelatedMode] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [adding, setAdding] = useState(false)
  const [cartFeedback, setCartFeedback] = useState(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    setProduct(null)
    setRelated([])
    setQuantity(1)
    setCartFeedback(null)

    getProduct(id)
      .then((data) => {
        if (!active) return
        setProduct(data)
        relatedProducts(id, 6)
          .then((result) => {
            if (!active) return
            setRelated(result.items || [])
            setRelatedMode(result.mode)
          })
          .catch(() => {})
      })
      .catch((err) => {
        if (active) setError(errorMessage(err, '商品加载失败，请稍后重试'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [id])

  if (loading) return <ProductDetailSkeleton />

  if (error) {
    return (
      <div className="container-page py-16">
        <EmptyState mark="404" title="没有找到这只陶器" description={error}>
          <Link to="/search" className="btn-primary">
            去逛逛其他器物
          </Link>
        </EmptyState>
      </div>
    )
  }

  if (!product) return null

  const favorited = isFavorite(product.id)
  const craft = craftNote(product.craft)

  const archiveRows = [
    ['SKU', product.sku],
    ['材质', product.material || '柘沟土陶'],
    ['工艺', product.craft || '手工制作'],
    ['适用', product.pet_type],
    ['规格', product.spec_text || '以实物为准'],
    ['库存', `${product.stock} 件`],
  ]

  const handleAddToCart = async (buyNow = false) => {
    if (!product || product.stock <= 0) return
    setAdding(true)
    setCartFeedback(null)
    try {
      const existing = cartItems.find((item) => item.product.id === product.id)
      const cart =
        buyNow && existing
          ? await updateQuantity(existing.id, quantity)
          : await add(product.id, quantity)

      if (buyNow) {
        const cartItem = (cart.items || []).find((item) => item.product.id === product.id)
        navigate(cartItem ? `/checkout?ids=${cartItem.id}` : '/cart')
        return
      }
      setCartFeedback({
        type: 'success',
        text: `已加入购物车：${product.name} × ${quantity}`,
      })
    } catch (err) {
      setCartFeedback({
        type: 'error',
        text: errorMessage(err, '加入购物车失败，请稍后重试'),
      })
    } finally {
      setAdding(false)
    }
  }

  const soldOut = product.stock <= 0

  return (
    <div className="page-canvas min-h-screen pb-28 lg:pb-0">
      <div className="container-page pt-8">
        <nav className="flex flex-wrap items-center gap-2 text-[11px] text-ink/45">
          <Link to="/" className="transition hover:text-clay">
            首页
          </Link>
          <span className="text-ink/25">/</span>
          <Link
            to={`/search?category_id=${product.category_id}`}
            className="transition hover:text-clay"
          >
            {product.category_name}
          </Link>
          <span className="text-ink/25">/</span>
          <span className="text-ink/70">{product.name}</span>

          <span className="ml-auto hidden font-mono text-micro tracking-[0.2em] text-ink/35 sm:inline">
            {product.sku} · NO. {String(product.id).padStart(3, '0')} / 035
          </span>
        </nav>

        <div className="mt-8 grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <div>
            <ProductGallery product={product} />
          </div>

          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="flex flex-wrap gap-1.5">
              {(product.tags || []).map((tag) => (
                <span key={tag} className="tag-pill">
                  {tag}
                </span>
              ))}
            </div>

            <p className="eyebrow mt-6">COLLECTION 2026 · {product.category_name}</p>
            <h1 className="mt-3 text-balance font-display text-[clamp(1.85rem,2.7vw,2.75rem)] leading-[1.15] tracking-[-0.01em] text-ink">
              {product.name}
            </h1>
            <p className="mt-3 text-sm leading-7 text-ink/65">{product.subtitle}</p>

            <div className="mt-8 flex flex-wrap items-end gap-x-4 gap-y-2 border-y border-line py-6">
              <p className="font-display text-4xl leading-none text-clay">¥{product.price}</p>
              {product.original_price ? (
                <p className="pb-1 text-sm text-ink/30 line-through">¥{product.original_price}</p>
              ) : null}
              <p className="ml-auto pb-1 font-mono text-[11px] text-ink/45">
                已售 {product.sales_count} · 库存 {product.stock}
              </p>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <span className="text-xs tracking-wide text-ink/50">数量</span>
              <QuantityStepper
                value={quantity}
                min={1}
                max={Math.max(1, product.stock)}
                onChange={setQuantity}
                disabled={soldOut}
              />
              <span className="text-[11px] text-ink/40">
                {soldOut ? '暂时缺货' : `最多 ${product.stock} 件 · 每件纹理略有不同`}
              </span>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => handleAddToCart(false)}
                disabled={adding || soldOut}
                className="btn-primary hidden lg:inline-flex"
              >
                {adding ? '处理中…' : soldOut ? '暂时缺货' : '加入购物车'}
              </button>
              <button
                type="button"
                onClick={() => handleAddToCart(true)}
                disabled={adding || soldOut}
                className="btn-ghost hidden lg:inline-flex"
              >
                立即购买
              </button>
              <button
                type="button"
                onClick={() => toggle(product.id).catch(() => {})}
                className={`inline-flex items-center justify-center gap-2 rounded-exhibit border px-5 py-3 text-sm transition duration-300 ease-silk ${
                  favorited
                    ? 'border-clay bg-clay text-paper'
                    : 'border-line text-ink/70 hover:border-clay hover:text-clay'
                }`}
              >
                <IconHeart className="h-4 w-4" filled={favorited} />
                {favorited ? '已收藏' : '收藏'}
              </button>
            </div>

            {cartFeedback ? (
              <p
                className={`mt-4 text-xs ${
                  cartFeedback.type === 'success' ? 'text-celadon' : 'text-clay'
                }`}
              >
                {cartFeedback.text}
                {cartFeedback.type === 'success' ? (
                  <Link to="/cart" className="ml-2 underline underline-offset-4">
                    去购物车结算 →
                  </Link>
                ) : null}
              </p>
            ) : null}

            <dl className="mt-10 border-t border-line">
              {archiveRows.map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-baseline gap-6 border-b border-line py-3 text-xs"
                >
                  <dt className="w-16 shrink-0 tracking-[0.16em] text-ink/40">{label}</dt>
                  <dd className="font-mono text-ink/75">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <section className="mt-24 grid gap-12 border-t border-line pt-14 lg:grid-cols-[0.95fr_1.05fr] lg:gap-20">
          <div>
            <p className="eyebrow">THE OBJECT</p>
            <h2 className="mt-4 text-section text-ink">器物与纹样</h2>
            <p className="mt-6 text-[15px] leading-8 text-ink/75 first-letter:float-left first-letter:mr-3 first-letter:font-display first-letter:text-5xl first-letter:leading-[0.85] first-letter:text-clay">
              {product.description}
            </p>
            <p className="mt-5 max-w-reading text-xs leading-7 text-ink/45">
              柘沟土陶取自泗水柘沟五色陶土，纹样沿用绞胎、窑变、刻花等传统工艺。每件器物经手工修坯与高温烧制，纹理会因窑火产生自然差异。
            </p>
          </div>

          <div>
            <p className="eyebrow">CRAFT · {product.craft || '手工'}</p>
            <p className="mt-4 max-w-reading text-sm leading-7 text-ink/60">{craft.summary}</p>

            <div className="mt-8 grid gap-6 sm:grid-cols-3">
              {craft.steps.map((step, index) => (
                <div key={step.title} className="border-t border-line pt-4">
                  <p className="font-mono text-micro tracking-[0.2em] text-clay/70">
                    {String(index + 1).padStart(2, '0')}
                  </p>
                  <p className="mt-3 font-display text-base text-ink">{step.title}</p>
                  <p className="mt-2 text-[11px] leading-6 text-ink/50">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {related.length > 0 ? (
          <section className="mt-24 border-t border-line pt-14">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="eyebrow">FROM THE SAME KILN</p>
                <h2 className="mt-4 text-section text-ink">同窑器物</h2>
                <p className="mt-3 text-sm text-ink/55">
                  {relatedMode === 'semantic' ? '按纹样与场景语义相近推荐' : '同类目里同样手作的器物'}
                </p>
              </div>
              <Link to="/search" className="link-arrow">
                查看全部
                <span aria-hidden="true">→</span>
              </Link>
            </div>

            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {related.slice(0, 4).map((item, index) => (
                <ProductCard key={item.product.id} product={item.product} index={index + 1} />
              ))}
            </div>
          </section>
        ) : null}
      </div>

      {/* 移动端固定购买栏 */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-cream/95 backdrop-blur-md lg:hidden">
        <div className="container-page flex items-center gap-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-[10px] tracking-wide text-ink/45">{product.name}</p>
            <p className="font-display text-lg leading-tight text-clay">¥{product.price}</p>
          </div>
          <button
            type="button"
            onClick={() => handleAddToCart(false)}
            disabled={adding || soldOut}
            className="btn-primary ml-auto"
          >
            {adding ? '处理中…' : soldOut ? '暂时缺货' : '加入购物车'}
          </button>
        </div>
      </div>
    </div>
  )
}
