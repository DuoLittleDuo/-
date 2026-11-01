export default function ProductCardSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="skeleton aspect-square w-full" />
      <div className="mt-4 space-y-2.5 border-t border-line pt-3.5">
        <div className="skeleton h-4 w-2/3" />
        <div className="skeleton h-3 w-5/6" />
        <div className="skeleton mt-3 h-3 w-1/3" />
      </div>
    </div>
  )
}
