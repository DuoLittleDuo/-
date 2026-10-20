export default function EmptyState({ icon = '🏺', title, description, children }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink/15 bg-white/40 px-6 py-16 text-center">
      <span className="text-5xl">{icon}</span>
      <h3 className="mt-4 font-display text-lg text-ink">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-md text-sm leading-relaxed text-ink/50">{description}</p>
      ) : null}
      {children ? <div className="mt-5">{children}</div> : null}
    </div>
  )
}
