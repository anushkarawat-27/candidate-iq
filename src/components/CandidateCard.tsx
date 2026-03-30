"use client";

import { Candidate } from "@/lib/types";
import { formatNumber } from "@/lib/utils";

interface CandidateCardProps {
  candidate: Candidate;
  isActive: boolean;
  onClick: () => void;
}

export default function CandidateCard({
  candidate,
  isActive,
  onClick,
}: CandidateCardProps) {
  const languages = candidate.languages?.slice(0, 3) || [];

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-5 py-3.5 border-b border-gray-100 transition-all duration-150 group flex items-center gap-4 ${
        isActive
          ? "bg-primary-50/70 border-l-[3px] border-l-primary-500"
          : "border-l-[3px] border-l-transparent"
      }`}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <img
          src={candidate.avatarUrl}
          alt={candidate.login}
          className={`w-9 h-9 rounded-lg object-cover transition-all ${isActive ? "ring-2 ring-primary-400 ring-offset-1" : "group-hover:ring-2 group-hover:ring-gray-200 group-hover:ring-offset-1"}`}
        />
        {candidate.shortlisted && (
          <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-primary-500 rounded-full flex items-center justify-center ring-2 ring-white">
            <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </div>
        )}
      </div>

      {/* Name + subtitle — fixed width */}
      <div className="min-w-0 w-[220px] flex-shrink-0">
        <h3 className="font-semibold text-primary-900 text-sm truncate leading-tight">
          {candidate.name || candidate.login}
        </h3>
        <p className="text-xs text-gray-400 truncate mt-0.5">
          {[candidate.company, candidate.location].filter(Boolean).join(" · ") || `@${candidate.login}`}
        </p>
      </div>

      {/* Languages — fixed width */}
      <div className="hidden md:flex items-center gap-1.5 w-[200px] flex-shrink-0">
        {languages.map((lang) => (
          <span
            key={lang}
            className="px-2 py-0.5 bg-primary-50 text-primary-600 text-[11px] rounded-md font-medium"
          >
            {lang}
          </span>
        ))}
      </div>

      {/* Stats — fixed widths for alignment */}
      <div className="flex items-center gap-5 text-xs text-gray-400 ml-auto flex-shrink-0">
        <span className="flex items-center gap-1 w-[52px] justify-end tabular-nums" title="Followers">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" />
          </svg>
          {formatNumber(candidate.followers)}
        </span>
        <span className="flex items-center gap-1 w-[48px] justify-end tabular-nums" title="Stars">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
          {formatNumber(candidate.totalStars)}
        </span>
      </div>

      {/* Fit Score */}
      {candidate.fitScore != null && candidate.fitScore > 0 && (
        <span className={`px-2 py-0.5 text-[11px] font-bold rounded-lg flex-shrink-0 w-[42px] text-center ${
          candidate.fitScore >= 75 ? "bg-green-100 text-green-700" :
          candidate.fitScore >= 50 ? "bg-amber-100 text-amber-700" :
          "bg-red-100 text-red-700"
        }`}>
          {candidate.fitScore}%
        </span>
      )}

      {/* Arrow */}
      <svg className={`w-4 h-4 flex-shrink-0 transition-all ${isActive ? "text-primary-500" : "text-gray-200 group-hover:text-gray-400 group-hover:translate-x-0.5"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
}
