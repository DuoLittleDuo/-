import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useFavorites } from '../context/FavoritesContext'
import SearchBar from './SearchBar'

const navClass = ({ isActive }) =>
  `rounded-full px-3 py-1.5 text-sm transition ${
    isActive ? 'bg-clay/10 text-clay' : 'text-ink/55 hover:text-clay'
  }`

export default function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { count: favoritesCount } = useFavorites()
  const { count: cartCount } = useCart()

  const showSearch = location.pathname !== '/'
  const initialQuery = new URLSearchParams(location.search).get('q') || ''

  const handleLogout = () => {
    logout()
    navigate('/welcome', { replace: true })
  }

  return (
    <header className="sticky top-0 z-30 border-b border-ink/10 bg-cream/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
        <Link to="/" className="flex shrink-0 items-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-clay font-display text-xl text-cream shadow-sm">
            陶
          </span>
          <span className="hidden sm:block">
            <span className="block font-display text-lg leading-tight text-ink">柘沟陶宠</span>
            <span className="block text-[10px] tracking-[0.22em] text-ink/40">
              非遗土陶 · 宠物文创
            </span>
          </span>
        </Link>

        {showSearch ? (
          <div className="hidden min-w-0 flex-1 lg:block">
            <SearchBar size="sm" initialValue={initialQuery} />
          </div>
        ) : null}

        <nav className="ml-auto hidden items-center gap-1 md:flex">
          <NavLink to="/" end className={navClass}>
            首页
          </NavLink>
          <NavLink to="/search" className={navClass}>
            全部商品
          </NavLink>
          <NavLink to="/favorites" className={navClass}>
            我的收藏
            {favoritesCount > 0 ? (
              <span className="ml-1.5 rounded-full bg-clay px-1.5 py-0.5 text-[10px] text-cream">
                {favoritesCount}
              </span>
            ) : null}
          </NavLink>
          <NavLink to="/cart" className={navClass}>
            购物车
            {cartCount > 0 ? (
              <span className="ml-1.5 rounded-full bg-clay px-1.5 py-0.5 text-[10px] text-cream">
                {cartCount}
              </span>
            ) : null}
          </NavLink>
          <NavLink to="/orders" className={navClass}>
            我的订单
          </NavLink>
        </nav>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <span className="hidden max-w-24 truncate text-xs text-ink/45 lg:inline">
            {user?.display_name || user?.username}
          </span>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-full border border-ink/15 px-3 py-1.5 text-xs text-ink/55 transition hover:border-clay hover:text-clay"
          >
            退出
          </button>
        </div>
      </div>

      {showSearch ? (
        <div className="px-4 pb-3 lg:hidden">
          <SearchBar size="sm" initialValue={initialQuery} />
        </div>
      ) : null}

      <div className="flex items-center gap-1 overflow-x-auto border-t border-ink/5 px-4 py-2 md:hidden">
        <NavLink to="/" end className={navClass}>
          首页
        </NavLink>
        <NavLink to="/search" className={navClass}>
          全部商品
        </NavLink>
        <NavLink to="/favorites" className={navClass}>
          我的收藏{favoritesCount > 0 ? ` (${favoritesCount})` : ''}
        </NavLink>
        <NavLink to="/cart" className={navClass}>
          购物车{cartCount > 0 ? ` (${cartCount})` : ''}
        </NavLink>
        <NavLink to="/orders" className={navClass}>
          我的订单
        </NavLink>
      </div>
    </header>
  )
}
