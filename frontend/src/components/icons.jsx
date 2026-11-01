const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
}

export function IconSearch({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </svg>
  )
}

export function IconHeart({ className = 'h-4 w-4', filled = false }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base} fill={filled ? 'currentColor' : 'none'}>
      <path d="M12 20s-7-4.35-7-9.2C5 7.9 7 6 9.4 6c1.5 0 2.6.9 2.6.9S13.1 6 14.6 6C17 6 19 7.9 19 10.8 19 15.65 12 20 12 20Z" />
    </svg>
  )
}

export function IconCart({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M4 5h1.6l2 9.2a1.6 1.6 0 0 0 1.56 1.25h7.9a1.6 1.6 0 0 0 1.56-1.22L20.4 8H7" />
      <circle cx="10" cy="19" r="1.2" />
      <circle cx="17" cy="19" r="1.2" />
    </svg>
  )
}

export function IconArrowRight({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M4.5 12h15" />
      <path d="m14 6.5 5.5 5.5L14 17.5" />
    </svg>
  )
}

export function IconArrowUpRight({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M7 17 17 7" />
      <path d="M8.5 7H17v8.5" />
    </svg>
  )
}

export function IconClose({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  )
}

export function IconPlus({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

export function IconMinus({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M5 12h14" />
    </svg>
  )
}

export function IconCheck({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="m5 12.5 4.5 4.5L19 7" />
    </svg>
  )
}

export function IconPaw({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <ellipse cx="8" cy="8.5" rx="1.7" ry="2.3" />
      <ellipse cx="16" cy="8.5" rx="1.7" ry="2.3" />
      <ellipse cx="5.2" cy="13" rx="1.5" ry="1.9" />
      <ellipse cx="18.8" cy="13" rx="1.5" ry="1.9" />
      <path d="M12 12.5c2.4 0 4.6 2 4.6 4.1 0 1.5-1.2 2.4-2.6 2.4-.9 0-1.4-.4-2-.4s-1.1.4-2 .4c-1.4 0-2.6-.9-2.6-2.4 0-2.1 2.2-4.1 4.6-4.1Z" />
    </svg>
  )
}

export function IconArrowLeft({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M19.5 12h-15" />
      <path d="M10 6.5 4.5 12 10 17.5" />
    </svg>
  )
}
