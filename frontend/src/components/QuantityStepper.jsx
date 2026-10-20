export default function QuantityStepper({
  value,
  min = 1,
  max = 99,
  onChange,
  disabled = false,
  size = 'md',
}) {
  const compact = size === 'sm'
  const buttonClass = `grid place-items-center text-ink/55 transition hover:text-clay disabled:cursor-not-allowed disabled:opacity-30 ${
    compact ? 'h-7 w-7 text-sm' : 'h-9 w-9'
  }`

  return (
    <div className="inline-flex items-center rounded-full border border-ink/10 bg-white/70">
      <button
        type="button"
        aria-label="减少数量"
        className={buttonClass}
        disabled={disabled || value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
      >
        −
      </button>
      <span className={`text-center text-sm tabular-nums text-ink/70 ${compact ? 'w-7' : 'w-9'}`}>
        {value}
      </span>
      <button
        type="button"
        aria-label="增加数量"
        className={buttonClass}
        disabled={disabled || value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
      >
        +
      </button>
    </div>
  )
}
