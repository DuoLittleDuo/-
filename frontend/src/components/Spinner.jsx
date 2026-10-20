export default function Spinner({ label = '加载中', fullscreen = false }) {
  const content = (
    <div className="flex flex-col items-center gap-3 text-ink/50">
      <span className="h-9 w-9 animate-spin rounded-full border-2 border-clay/20 border-t-clay" />
      {label ? <span className="text-sm tracking-wide">{label}</span> : null}
    </div>
  )

  if (fullscreen) {
    return <div className="flex min-h-screen items-center justify-center bg-cream">{content}</div>
  }

  return <div className="flex justify-center py-16">{content}</div>
}
