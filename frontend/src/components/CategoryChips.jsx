import { Link } from 'react-router-dom'

export default function CategoryChips({ categories = [], activeId = null, query = '' }) {
  const makeTo = (categoryId) => {
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (categoryId != null) params.set('category_id', String(categoryId))
    const queryString = params.toString()
    return queryString ? `/search?${queryString}` : '/search'
  }

  const chipClass = (active) =>
    `inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs transition ${
      active
        ? 'border-clay bg-clay text-cream shadow-sm'
        : 'border-ink/12 bg-white/70 text-ink/55 hover:border-clay/40 hover:text-clay'
    }`

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link to={makeTo(null)} className={chipClass(activeId == null)}>
        全部
      </Link>
      {categories.map((category) => (
        <Link
          key={category.id}
          to={makeTo(category.id)}
          className={chipClass(activeId === category.id)}
        >
          <span>{category.emoji}</span>
          {category.name}
          <span className="opacity-60">{category.product_count}</span>
        </Link>
      ))}
    </div>
  )
}
