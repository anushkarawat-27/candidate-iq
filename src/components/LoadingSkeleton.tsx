"use client";

export function CardSkeleton() {
  return (
    <div className="w-full px-5 py-4 border-b border-gray-100 flex items-center gap-4">
      <div className="w-10 h-10 rounded-full animate-shimmer flex-shrink-0" />
      <div className="flex-1">
        <div className="h-4 animate-shimmer rounded-md w-36 mb-2" />
        <div className="h-3 animate-shimmer rounded-md w-48" />
      </div>
      <div className="hidden md:flex gap-1.5">
        <div className="h-5 bg-primary-50 rounded-md w-14 animate-shimmer" />
        <div className="h-5 bg-primary-50 rounded-md w-12 animate-shimmer" />
      </div>
      <div className="flex gap-4">
        <div className="h-4 animate-shimmer rounded w-10" />
        <div className="h-4 animate-shimmer rounded w-10" />
      </div>
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 animate-fade-in">
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
