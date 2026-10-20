import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-cream px-4 text-center">
      <span className="font-display text-7xl text-clay/25">404</span>
      <h1 className="mt-4 font-display text-2xl text-ink">这只陶器不在窑里</h1>
      <p className="mt-2 text-sm text-ink/45">页面走丢了，回首页继续逛逛吧。</p>
      <Link to="/" className="btn-primary mt-6">
        回到首页
      </Link>
    </div>
  )
}
