export default function SimilarityBadge({ similarity, reason, className = '' }) {
  if (similarity == null) return null

  return (
    <span
      title={reason || '语义检索相似度'}
      className={`inline-flex items-center gap-1.5 rounded-full bg-ink/80 px-2.5 py-1 text-[10px] font-medium text-cream backdrop-blur ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-gold" />
      语义相似 {Math.round(similarity)}%
    </span>
  )
}
