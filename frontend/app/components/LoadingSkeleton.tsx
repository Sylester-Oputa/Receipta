export function TableSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex gap-4 animate-pulse">
          <div className="h-12 bg-muted rounded flex-1" />
          <div className="h-12 bg-muted rounded w-32" />
          <div className="h-12 bg-muted rounded w-24" />
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-lg p-4 animate-pulse">
      <div className="h-6 bg-muted rounded w-3/4 mb-3" />
      <div className="h-4 bg-muted rounded w-1/2 mb-2" />
      <div className="h-4 bg-muted rounded w-2/3" />
    </div>
  );
}
