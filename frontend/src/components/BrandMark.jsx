import { Link } from 'react-router-dom'

export default function BrandMark({ to = '/', tone = 'ink', compact = false }) {
  const isLight = tone === 'light'

  return (
    <Link to={to} className="group flex shrink-0 items-center gap-3">
      <span
        className={`grid h-10 w-10 place-items-center rounded-exhibit font-display text-lg tracking-wide transition duration-300 ease-silk ${
          isLight ? 'bg-paper/10 text-paper' : 'bg-clay text-paper'
        }`}
      >
        陶
      </span>
      {compact ? null : (
        <span>
          <span
            className={`block font-display text-lg leading-tight ${
              isLight ? 'text-paper' : 'text-ink'
            }`}
          >
            柘沟陶宠
          </span>
          <span
            className={`block text-[9px] tracking-[0.26em] ${
              isLight ? 'text-paper/45' : 'text-ink/40'
            }`}
          >
            ZHEGOU POTTERY PET
          </span>
        </span>
      )}
    </Link>
  )
}
