import { useFavorites } from '../context/FavoritesContext'
import { IconHeart } from './icons'

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
      className={`grid h-9 w-9 place-items-center border backdrop-blur transition duration-300 ease-silk disabled:cursor-wait disabled:opacity-50 ${
        active
          ? 'border-clay bg-clay text-paper'
          : 'border-line bg-paper/80 text-ink/50 hover:border-clay/50 hover:text-clay'
      } ${className}`}
    >
      <IconHeart className="h-4 w-4" filled={active} />
    </button>
  )
}
