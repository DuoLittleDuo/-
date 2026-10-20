import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function SearchBar({ size = 'lg', initialValue = '', placeholder }) {
  const [value, setValue] = useState(initialValue)
  const navigate = useNavigate()
  const large = size === 'lg'

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  const handleSubmit = (event) => {
    event.preventDefault()
    const query = value.trim()
    if (!query) return
    navigate(`/search?q=${encodeURIComponent(query)}`)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`flex items-center gap-2 rounded-full border border-ink/12 bg-white shadow-card transition focus-within:border-clay/50 focus-within:shadow-soft ${
        large ? 'px-2 py-2' : 'px-1.5 py-1'
      }`}
    >
      <span className={`grid place-items-center text-ink/35 ${large ? 'pl-3' : 'pl-2'}`}>
        <svg
          viewBox="0 0 24 24"
          className={large ? 'h-5 w-5' : 'h-4 w-4'}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      </span>

      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder || '试试搜索「狗吃饭的碗」'}
        aria-label="搜索商品"
        className={`min-w-0 flex-1 bg-transparent text-ink outline-none placeholder:text-ink/30 ${
          large ? 'py-2 text-base' : 'py-1.5 text-sm'
        }`}
      />

      <button
        type="submit"
        className={`shrink-0 rounded-full bg-clay font-medium text-cream transition hover:bg-clay-dark ${
          large ? 'px-6 py-2.5 text-sm' : 'px-4 py-1.5 text-xs'
        }`}
      >
        搜索
      </button>
    </form>
  )
}
