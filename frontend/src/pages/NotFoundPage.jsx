import { Link } from 'react-router-dom'
import ProductImage from '../components/ProductImage'

export default function NotFoundPage() {
  return (
    <div className="page-canvas relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 opacity-25 lg:block">
        <ProductImage sku="ZG-BJ-01" alt="" sizes="50vw" />
        <div className="absolute inset-0 bg-gradient-to-r from-cream via-cream/40 to-transparent" />
      </div>

      <div className="container-page relative flex min-h-screen flex-col justify-center py-24">
        <p className="eyebrow">ERROR · NOT IN THE KILN</p>
        <p className="mt-6 font-mono text-[clamp(5rem,16vw,11rem)] leading-none tracking-tight text-ink/15">
          404
        </p>
        <h1 className="mt-6 max-w-lg text-headline text-ink">这只陶器不在窑里</h1>
        <p className="mt-4 max-w-md text-sm leading-7 text-ink/60">
          页面走丢了。也许它被搬去别处，也许还没来得及烧出来。
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-6">
          <Link to="/" className="btn-primary">
            回到首页
          </Link>
          <Link to="/search" className="btn-quiet">
            浏览全部器物 →
          </Link>
        </div>
      </div>
    </div>
  )
}
