import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { errorMessage } from '../api/client'
import { listFavorites } from '../api/favorites'
import EmptyState from '../components/EmptyState'
import Pagination from '../components/Pagination'
import ProductVisual from '../components/ProductVisual'
import Spinner from '../components/Spinner'
import { useFavorites } from '../context/FavoritesContext'

export default function FavoritesPage() {
  const { remove } = useFavorites()
  const [page, setPage] = useState(1)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')

    listFavorites({ page, page_size: 12 })
      .then((result) => {
        if (active) setData(result)
      })
      .catch((err) => {
        if (active) setError(errorMessage(err, '收藏加载失败，请稍后重试'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [page])

  const handleRemove = async (productId) => {
    try {
      await remove(productId)
      setData((previous) =>
        previous
          ? {
              ...previous,
              items: previous.items.filter((item) => item.product.id !== productId),
              total: Math.max(0, previous.total - 1),
            }
          : previous,
      )
    } catch {
      setError('取消收藏失败，请稍后重试')
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] tracking-wide text-ink/35">MY COLLECTION</p>
          <h1 className="mt-1 font-display text-3xl text-ink">我的收藏</h1>
          <p className="mt-2 text-xs text-ink/45">
            {data ? `共 ${data.total} 件喜欢的陶器` : '把心动的陶器留在这里'}
          </p>
        </div>
        <Link to="/search" className="shrink-0 text-xs text-clay hover:underline">
          去逛逛 →
        </Link>
      </div>

      {loading ? (
        <Spinner label="正在整理收藏" />
      ) : error ? (
        <div className="mt-10 rounded-xl bg-clay/10 px-4 py-3 text-sm text-clay">{error}</div>
      ) : !data || data.items.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon="🤍"
            title="还没有收藏"
            description="看到喜欢的食盆、挂牌或摆件，点一下爱心就会出现在这里。"
          >
            <Link to="/search" className="btn-primary">
              去挑选陶器
            </Link>
          </EmptyState>
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((favorite) => (
              <div key={favorite.id} className="card overflow-hidden">
                <Link to={`/product/${favorite.product.id}`}>
                  <ProductVisual product={favorite.product} />
                </Link>
                <div className="p-4">
                  <Link
                    to={`/product/${favorite.product.id}`}
                    className="line-clamp-1 font-display text-base text-ink transition hover:text-clay"
                  >
                    {favorite.product.name}
                  </Link>
                  <p className="mt-1 line-clamp-1 text-xs text-ink/45">
                    {favorite.product.subtitle}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-clay">
                      <span className="text-xs">¥</span>
                      <span className="ml-0.5 text-lg font-semibold">
                        {favorite.product.price}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemove(favorite.product.id)}
                      className="text-[11px] text-ink/35 transition hover:text-clay"
                    >
                      取消收藏
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Pagination page={page} pages={data.pages} onChange={setPage} />
        </>
      )}
    </div>
  )
}
