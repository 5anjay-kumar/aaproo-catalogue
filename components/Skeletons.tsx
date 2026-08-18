function Shimmer({ className = "" }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-line/70 ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" />
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-xl2 border border-line bg-surface p-2.5">
      <Shimmer className="aspect-[4/5] w-full rounded-lg" />
      <div className="space-y-2 px-1 pb-1 pt-3">
        <Shimmer className="h-3.5 w-4/5 rounded" />
        <Shimmer className="h-3 w-2/5 rounded" />
      </div>
      <Shimmer className="mt-3 h-9 w-full rounded-lg" />
    </div>
  );
}

export function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: 10 }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
