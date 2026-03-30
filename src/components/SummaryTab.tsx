"use client";

import { useState } from "react";
import { Candidate } from "@/lib/types";
import { formatNumber } from "@/lib/utils";
import { showToast } from "./Toast";

interface SummaryTabProps {
  candidate: Candidate;
  notes: string;
  onNotesChange: (value: string) => void;
}

export default function SummaryTab({ candidate, notes, onNotesChange }: SummaryTabProps) {
  const [aiSummary, setAiSummary] = useState<string | null>(candidate.aiSummary);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const generateSummary = async () => {
    setSummaryLoading(true);
    try {
      const res = await fetch("/api/ai/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId: candidate.id }),
      });
      const data = await res.json();
      if (data.summary) {
        setAiSummary(data.summary);
        showToast("Summary generated");
      }
    } catch (err) {
      console.error("Failed to generate summary:", err);
    } finally {
      setSummaryLoading(false);
    }
  };

  const stats = [
    { label: "Followers", value: formatNumber(candidate.followers), icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" },
    { label: "Following", value: formatNumber(candidate.following), icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
    { label: "Repos", value: String(candidate.topRepos?.length ?? 0), icon: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" },
    { label: "Stars", value: formatNumber(candidate.totalStars), icon: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" },
  ];

  return (
    <div className="space-y-5">
      {/* AI Summary */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            AI Summary
          </h4>
          {!aiSummary && (
            <button
              onClick={generateSummary}
              disabled={summaryLoading}
              className="text-xs px-3 py-1 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-full hover:shadow-md disabled:opacity-50 transition-all"
            >
              {summaryLoading ? "Generating..." : "Generate"}
            </button>
          )}
        </div>
        {summaryLoading ? (
          <div className="bg-gradient-to-br from-primary-50 to-indigo-50 rounded-xl p-4">
            <div className="h-3 animate-shimmer rounded w-full mb-2" />
            <div className="h-3 animate-shimmer rounded w-4/5 mb-2" />
            <div className="h-3 animate-shimmer rounded w-3/5" />
          </div>
        ) : aiSummary ? (
          <div className="bg-gradient-to-br from-primary-50/80 to-indigo-50/80 rounded-xl p-4 border border-primary-100/50">
            <p className="text-sm text-primary-900/80 leading-relaxed">{aiSummary}</p>
          </div>
        ) : (
          <p className="text-sm text-gray-300 italic">
            Click &quot;Generate&quot; for an AI-powered candidate summary.
          </p>
        )}
      </div>

      {/* Similarity reason */}
      {candidate.similarityReason && (
        <div className="bg-amber-50/80 border border-amber-200/50 rounded-xl p-4">
          <h4 className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-1.5">Why Similar</h4>
          <p className="text-sm text-amber-800/80">{candidate.similarityReason}</p>
        </div>
      )}

      {/* Languages */}
      {candidate.languages && candidate.languages.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5">Languages</h4>
          <div className="flex flex-wrap gap-1.5">
            {candidate.languages.map((lang) => (
              <span key={lang} className="px-2.5 py-1 bg-primary-50 text-primary-600 text-xs rounded-lg font-medium">
                {lang}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-gray-50/80 rounded-xl p-3 border border-gray-100/50">
            <div className="flex items-center gap-1.5 mb-1">
              <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
              </svg>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">{stat.label}</p>
            </div>
            <p className="text-lg font-bold text-primary-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Fit Reason */}
      {candidate.fitReason && (
        <div className="bg-gradient-to-r from-green-50/80 to-emerald-50/60 rounded-xl p-4 border border-green-100/50">
          <h4 className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-1.5">Role Fit</h4>
          <p className="text-sm text-green-800/80">{candidate.fitReason}</p>
        </div>
      )}

      {/* Notes */}
      <div>
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Notes</h4>
        <textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Add your notes about this candidate..."
          rows={3}
          className="w-full px-3 py-2.5 bg-gray-50/80 border border-gray-200/80 rounded-xl text-sm placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 focus:bg-white transition-all resize-none"
        />
      </div>

      {/* Contact */}
      {(candidate.email || candidate.blog || candidate.twitterUsername) && (
        <div>
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5">Contact</h4>
          <div className="space-y-2 text-sm">
            {candidate.email && (
              <a href={`mailto:${candidate.email}`} className="flex items-center gap-2 text-gray-500 hover:text-primary-500 transition-colors">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {candidate.email}
              </a>
            )}
            {candidate.blog && (
              <a href={candidate.blog.startsWith("http") ? candidate.blog : `https://${candidate.blog}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-500 hover:text-primary-500 transition-colors">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.102 1.101" />
                </svg>
                {candidate.blog}
              </a>
            )}
            {candidate.twitterUsername && (
              <a href={`https://twitter.com/${candidate.twitterUsername}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-500 hover:text-primary-500 transition-colors">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                @{candidate.twitterUsername}
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
