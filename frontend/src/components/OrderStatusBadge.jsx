const STYLES = {
  pending: 'bg-gold/15 text-gold',
  paid: 'bg-celadon/15 text-celadon',
  completed: 'bg-ink/10 text-ink/60',
  cancelled: 'bg-ink/5 text-ink/35',
}

export default function OrderStatusBadge({ status, label, className = '' }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ${
        STYLES[status] || 'bg-ink/5 text-ink/45'
      } ${className}`}
    >
      {label || status}
    </span>
  )
}
