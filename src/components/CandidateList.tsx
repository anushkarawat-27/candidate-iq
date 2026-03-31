"use client";

import { Candidate } from "@/lib/types";
import CandidateCard from "./CandidateCard";
import { CardSkeleton } from "./LoadingSkeleton";

interface CandidateListProps {
  candidates: Candidate[];
  loading: boolean;
  selectedId: number | null;
  compareIds: Set<number>;
  roleDescription: string;
  totalPages: number;
  page: number;
  showPagination: boolean;
  emptyMessage: string;
  onSelect: (id: number) => void;
  onCompareToggle: (id: number) => void;
  onPageChange: (page: number) => void;
}

export default function CandidateList({
  candidates,
  loading,
  selectedId,
  compareIds,
  roleDescription,
  totalPages,
  page,
  showPagination,
  emptyMessage,
  onSelect,
  onCompareToggle,
  onPageChange,
}: CandidateListProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200/60 shadow-sm">
      {/* Column Header */}
      <div className="hidden sm:flex items-center gap-4 px-5 py-2.5 border-b border-gray-100 bg-gray-50/50 text-[11px] font-medium text-gray-400 uppercase tracking-wider">
        <div className="w-4 flex-shrink-0" />
        <div className="w-5 flex-shrink-0 text-center">#</div>
        <div className="w-9 flex-shrink-0" />
        <div className="w-[220px] flex-shrink-0">Name</div>
        <div className="hidden md:block w-[200px] flex-shrink-0">Languages</div>
        <div className="flex items-center gap-5 ml-auto flex-shrink-0">
          <span className="w-[52px] text-right">Followers</span>
          <span className="w-[48px] text-right">Stars</span>
        </div>
        {roleDescription && <div className="w-[42px] text-center flex-shrink-0">Fit</div>}
        <div className="w-4 flex-shrink-0" />
      </div>

      {/* List */}
      <div>
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)
        ) : candidates.length === 0 ? (
          <div className="text-center py-16">
            <svg className="mx-auto h-10 w-10 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} />
            </svg>
            <h3 className="mt-3 text-sm font-medium text-gray-900">No candidates found</h3>
            <p className="mt-1 text-sm text-gray-400">{emptyMessage}</p>
          </div>
        ) : (
          candidates.map((candidate, i) => (
            <div
              key={candidate.id}
              className="flex items-center animate-card-in group/row hover:bg-gray-50 transition-colors"
              style={{ animationDelay: `${i * 20}ms` }}
            >
              <input
                type="checkbox"
                checked={compareIds.has(candidate.id)}
                onChange={() => onCompareToggle(candidate.id)}
                className="ml-3 w-4 h-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500/20 cursor-pointer flex-shrink-0 accent-primary-500"
                title="Select for comparison"
              />
              <span className="hidden sm:block w-5 text-center text-[11px] text-gray-300 tabular-nums flex-shrink-0">
                {((page - 1) * 20) + i + 1}
              </span>
              <div className="flex-1">
                <CandidateCard
                  candidate={candidate}
                  isActive={candidate.id === selectedId}
                  onClick={() => onSelect(candidate.id === selectedId ? -1 : candidate.id)}
                />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {showPagination && totalPages > 1 && !loading && (
        <div className="flex items-center justify-center gap-2 py-3 border-t border-gray-100">
          <button
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-xl disabled:opacity-30 hover:bg-gray-50 transition-all"
          >
            Previous
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum: number;
            if (totalPages <= 5) pageNum = i + 1;
            else if (page <= 3) pageNum = i + 1;
            else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
            else pageNum = page - 2 + i;
            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={`w-8 h-8 text-sm rounded-xl transition-all ${
                  page === pageNum ? "bg-primary-500 text-white shadow-sm" : "hover:bg-gray-50 text-gray-500"
                }`}
              >
                {pageNum}
              </button>
            );
          })}
          <button
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-xl disabled:opacity-30 hover:bg-gray-50 transition-all"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
