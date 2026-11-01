export default function Pagination({ page, pages, onChange }) {
  if (!pages || pages <= 1) return null

  const start = Math.max(1, Math.min(page - 2, pages - 4))
  const end = Math.min(pages, start + 4)
  const numbers = Array.from({ length: end - start + 1 }, (_, index) => start + index)

  const baseClass =
    'min-w-8 border-b px-2 pb-0.5 font-mono text-sm transition duration-300 ease-silk disabled:cursor-not-allowed disabled:opacity-30'

  return (
    <nav className="mt-14 flex items-center justify-between border-t border-line pt-6">
      <button
        type="button"
        className={`${baseClass} border-transparent text-ink/55 hover:text-clay`}
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        上一页
      </button>

      <div className="flex items-center gap-5">
        {start > 1 ? <span className="text-ink/25">…</span> : null}

        {numbers.map((number) => (
          <button
            key={number}
            type="button"
            onClick={() => onChange(number)}
            aria-current={number === page ? 'page' : undefined}
            className={`${baseClass} ${
              number === page
                ? 'border-clay text-clay'
                : 'border-transparent text-ink/50 hover:text-clay'
            }`}
          >
            {String(number).padStart(2, '0')}
          </button>
        ))}

        {end < pages ? <span className="text-ink/25">…</span> : null}
      </div>

      <button
        type="button"
        className={`${baseClass} border-transparent text-ink/55 hover:text-clay`}
        disabled={page >= pages}
        onClick={() => onChange(page + 1)}
      >
        下一页
      </button>
    </nav>
  )
}
