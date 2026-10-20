export function formatDateTime(value) {
  if (!value) return ''

  // 后端返回的是不带时区的 UTC 时间，补上 Z 后再按本地时区显示
  const normalized = /(Z|[+-]\d{2}:\d{2})$/.test(value) ? value : `${value}Z`
  const date = new Date(normalized)
  if (Number.isNaN(date.getTime())) return value

  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export function formatPrice(value) {
  return Number(value || 0).toFixed(0)
}
