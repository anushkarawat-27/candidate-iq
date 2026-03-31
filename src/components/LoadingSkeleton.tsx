"use client";

export function CardSkeleton() {
  return (
    <div className="w-full px-5 py-3.5 border-b border-gray-100 flex items-center gap-4">
      <div className="w-4 h-4 rounded animate-shimmer flex-shrink-0 ml-3" />
      <div className="hidden sm:block w-5 flex-shrink-0" />
      <div className="w-9 h-9 rounded-lg animate-shimmer flex-shrink-0" />
      <div className="w-[140px] sm:w-[220px] flex-shrink-0">
        <div className="h-4 animate-shimmer rounded-md w-28 mb-1.5" />
        <div className="h-3 animate-shimmer rounded-md w-36" />
      </div>
      <div className="hidden md:flex gap-1.5 w-[200px] flex-shrink-0">
        <div className="h-5 animate-shimmer rounded-md w-14" />
        <div className="h-5 animate-shimmer rounded-md w-12" />
      </div>
      <div className="flex gap-5 ml-auto flex-shrink-0">
        <div className="h-4 animate-shimmer rounded w-10" />
        <div className="h-4 animate-shimmer rounded w-10" />
      </div>
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 animate-fade-in">
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-xl animate-shimmer" />
        <div className="flex-1">
          <div className="h-6 animate-shimmer rounded-md w-40 mb-2" />
          <div className="h-4 animate-shimmer rounded-md w-24 mb-2" />
          <div className="h-3 animate-shimmer rounded-md w-64" />
        </div>
      </div>
    </div>
  );
}
