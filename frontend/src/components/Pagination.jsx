export default function Pagination({ page, pages, onChange }) {
  if (!pages || pages <= 1) return null

  const start = Math.max(1, Math.min(page - 2, pages - 4))
  const end = Math.min(pages, start + 4)
  const numbers = Array.from({ length: end - start + 1 }, (_, index) => start + index)

  const buttonClass =
    'grid h-9 min-w-9 place-items-center rounded-full border border-ink/12 bg-white/70 px-3 text-sm text-ink/60 transition hover:border-clay/40 hover:text-clay disabled:cursor-not-allowed disabled:opacity-35'

  return (
    <div className="mt-10 flex items-center justify-center gap-2">
      <button
        type="button"
        className={buttonClass}
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        上一页
      </button>

      {start > 1 ? <span className="px-1 text-ink/30">…</span> : null}

      {numbers.map((number) => (
        <button
          key={number}
          type="button"
          onClick={() => onChange(number)}
          className={`grid h-9 min-w-9 place-items-center rounded-full border px-3 text-sm transition ${
            number === page
              ? 'border-clay bg-clay text-cream'
              : 'border-ink/12 bg-white/70 text-ink/60 hover:border-clay/40 hover:text-clay'
          }`}
        >
          {number}
        </button>
      ))}

      {end < pages ? <span className="px-1 text-ink/30">…</span> : null}

      <button
        type="button"
        className={buttonClass}
        disabled={page >= pages}
        onClick={() => onChange(page + 1)}
      >
        下一页
      </button>
    </div>
  )
}
