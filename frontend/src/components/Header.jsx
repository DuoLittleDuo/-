import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useFavorites } from '../context/FavoritesContext'
import BrandMark from './BrandMark'
import SearchBar from './SearchBar'
import { IconHeart, IconCart } from './icons'

const navClass = ({ isActive }) =>
  `relative py-1 text-sm transition duration-300 ease-silk ${
    isActive
      ? 'text-ink after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:bg-clay'
      : 'text-ink/55 hover:text-clay'
  }`

const WELCOME_ANCHORS = [
  { href: '#categories', label: '器物' },
  { href: '#moments', label: '日常' },
  { href: '#craft', label: '手艺' },
]

export default function Header({ variant = 'default' }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout, canBrowse, token } = useAuth()
  const { count: favoritesCount } = useFavorites()
  const { count: cartCount } = useCart()

  const isWelcome = variant === 'welcome'
  const showSearch = !isWelcome && location.pathname !== '/'
  const initialQuery = new URLSearchParams(location.search).get('q') || ''

  const handleLogout = () => {
    logout()
    navigate('/welcome', { replace: true })
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-cream/85 backdrop-blur-md">
      <div className="container-page flex h-16 items-center gap-6">
        <BrandMark to={isWelcome ? (canBrowse ? '/' : '/welcome') : '/'} />

        {isWelcome ? (
          <nav className="ml-4 hidden items-center gap-7 md:flex">
            {WELCOME_ANCHORS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm text-ink/55 transition duration-300 ease-silk hover:text-clay"
              >
                {item.label}
              </a>
            ))}
          </nav>
        ) : null}

        {showSearch ? (
          <div className="hidden min-w-0 flex-1 lg:block">
            <SearchBar size="sm" initialValue={initialQuery} />
          </div>
        ) : null}

        {isWelcome ? null : (
          <nav className="ml-auto hidden items-center gap-6 md:flex">
            <NavLink to="/" end className={navClass}>
              首页
            </NavLink>
            <NavLink to="/search" className={navClass}>
              全部器物
            </NavLink>
            <NavLink to="/orders" className={navClass}>
              订单
            </NavLink>
          </nav>
        )}

        <div className={`flex items-center gap-4 ${isWelcome ? 'ml-auto' : 'ml-auto md:ml-0'}`}>
          {isWelcome ? null : (
            <>
              <NavLink
                to="/favorites"
                aria-label="我的收藏"
                className="relative text-ink/60 transition duration-300 ease-silk hover:text-clay"
              >
                <IconHeart className="h-[18px] w-[18px]" />
                {favoritesCount > 0 ? (
                  <span className="absolute -right-2 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-clay px-1 text-[9px] leading-none text-paper">
                    {favoritesCount}
                  </span>
                ) : null}
              </NavLink>
              <NavLink
                to="/cart"
                aria-label="购物车"
                className="relative text-ink/60 transition duration-300 ease-silk hover:text-clay"
              >
                <IconCart className="h-[18px] w-[18px]" />
                {cartCount > 0 ? (
                  <span className="absolute -right-2 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-clay px-1 text-[9px] leading-none text-paper">
                    {cartCount}
                  </span>
                ) : null}
              </NavLink>
            </>
          )}

          {token ? (
            <div className="flex items-center gap-3">
              <span className="hidden max-w-24 truncate text-xs text-ink/50 lg:inline">
                {user?.display_name || user?.username}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="border-b border-ink/25 pb-0.5 text-xs text-ink/60 transition duration-300 ease-silk hover:border-clay hover:text-clay"
              >
                退出
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              {canBrowse ? (
                <span className="hidden text-[11px] tracking-wide text-ink/45 sm:inline">
                  访客浏览
                </span>
              ) : null}
              <Link
                to="/login"
                className="border-b border-ink/25 pb-0.5 text-xs text-ink/60 transition duration-300 ease-silk hover:border-clay hover:text-clay"
              >
                登录
              </Link>
            </div>
          )}
        </div>
      </div>

      {showSearch ? (
        <div className="container-page pb-3 lg:hidden">
          <SearchBar size="sm" initialValue={initialQuery} />
        </div>
      ) : null}

      {isWelcome ? null : (
        <div className="no-scrollbar flex items-center gap-6 overflow-x-auto border-t border-line/70 px-gutter py-2.5 md:hidden">
          <NavLink to="/" end className={navClass}>
            首页
          </NavLink>
          <NavLink to="/search" className={navClass}>
            全部器物
          </NavLink>
          <NavLink to="/orders" className={navClass}>
            订单
          </NavLink>
        </div>
      )}
    </header>
  )
}
