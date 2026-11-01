export default function ProductDetailSkeleton() {
  return (
    <div className="container-page py-10" aria-busy="true" aria-label="正在加载器物">
      <div className="skeleton h-3 w-48" />

      <div className="mt-8 grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        <div>
          <div className="skeleton aspect-[4/5] w-full" />
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="skeleton aspect-square w-full" />
            <div className="skeleton aspect-square w-full" />
          </div>
        </div>

        <div className="space-y-4">
          <div className="skeleton h-3 w-32" />
          <div className="skeleton h-10 w-3/4" />
          <div className="skeleton h-4 w-1/2" />
          <div className="skeleton mt-8 h-16 w-full" />
          <div className="skeleton h-12 w-56" />
          <div className="mt-10 space-y-3">
            <div className="skeleton h-3 w-full" />
            <div className="skeleton h-3 w-5/6" />
            <div className="skeleton h-3 w-2/3" />
          </div>
        </div>
      </div>
    </div>
  )
}
