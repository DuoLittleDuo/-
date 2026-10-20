import { useFavorites } from '../context/FavoritesContext'

export default function FavoriteButton({ productId, className = '' }) {
  const { isFavorite, toggle, loading } = useFavorites()
  const active = isFavorite(productId)

  const handleClick = async (event) => {
    event.preventDefault()
    event.stopPropagation()
    try {
      await toggle(productId)
    } catch {
      // 失败时 context 已自动回滚
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      aria-label={active ? '取消收藏' : '收藏'}
      title={active ? '取消收藏' : '收藏'}
      className={`grid h-9 w-9 place-items-center rounded-full border backdrop-blur transition disabled:cursor-wait disabled:opacity-50 ${
        active
          ? 'border-clay/30 bg-clay text-cream shadow-sm'
          : 'border-white/70 bg-white/80 text-ink/45 hover:text-clay'
      } ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
      </svg>
    </button>
  )
}
