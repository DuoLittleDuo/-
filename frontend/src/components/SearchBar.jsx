import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconSearch, IconArrowRight } from './icons'

export default function SearchBar({
  size = 'lg',
  initialValue = '',
  placeholder,
  variant = 'default',
}) {
  const [value, setValue] = useState(initialValue)
  const navigate = useNavigate()
  const large = size === 'lg'
  const editorial = variant === 'editorial'

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  const handleSubmit = (event) => {
    event.preventDefault()
    const query = value.trim()
    if (!query) return
    navigate(`/search?q=${encodeURIComponent(query)}`)
  }

  if (editorial) {
    return (
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-4 border-b border-ink/25 pb-2 transition duration-300 focus-within:border-clay"
      >
        <IconSearch className="h-5 w-5 shrink-0 text-ink/35" />
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={placeholder || '试试搜索「狗吃饭的碗」'}
          aria-label="搜索商品"
          className="min-w-0 flex-1 bg-transparent py-2 text-lg text-ink outline-none placeholder:text-ink/30 focus:ring-0"
        />
        <button
          type="submit"
          className="group flex shrink-0 items-center gap-2 pb-1 text-sm text-ink/70 transition duration-300 ease-silk hover:text-clay"
        >
          检索
          <IconArrowRight className="h-4 w-4 transition-transform duration-300 ease-silk group-hover:translate-x-1" />
        </button>
      </form>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`flex items-center gap-2 border border-line bg-paper transition duration-300 focus-within:border-clay ${
        large ? 'px-2.5 py-1.5' : 'px-2 py-0.5'
      }`}
    >
      <span className={`grid place-items-center text-ink/35 ${large ? 'pl-2' : 'pl-1'}`}>
        <IconSearch className={large ? 'h-5 w-5' : 'h-4 w-4'} />
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
        className={`shrink-0 bg-clay font-medium text-paper transition duration-300 ease-silk hover:bg-clay-dark ${
          large ? 'px-6 py-2.5 text-sm' : 'px-4 py-1.5 text-xs'
        }`}
      >
        搜索
      </button>
    </form>
  )
}
