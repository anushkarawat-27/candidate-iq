"use client";

import { useState, useRef, useCallback } from "react";
import { Candidate } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { showToast } from "./Toast";
import SummaryTab from "./SummaryTab";
import ReposTab from "./ReposTab";
import StatsTab from "./StatsTab";

interface DetailPanelProps {
  candidate: Candidate;
  onShortlistToggle: (id: number) => void;
  onFindSimilar: (id: number) => void;
  onNotesUpdate: (id: number, notes: string) => void;
}

type Tab = "summary" | "repos" | "stats";

export default function DetailPanel({
  candidate,
  onShortlistToggle,
  onFindSimilar,
  onNotesUpdate,
}: DetailPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>("summary");
  const [notes, setNotes] = useState(candidate.notes || "");
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleNotesChange = useCallback(
    (value: string) => {
      setNotes(value);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        onNotesUpdate(candidate.id, value);
        showToast("Notes saved");
      }, 800);
    },
    [candidate.id, onNotesUpdate]
  );

  const tabs: { key: Tab; label: string }[] = [
    { key: "summary", label: "Summary" },
    { key: "repos", label: "Repos" },
    { key: "stats", label: "Stats" },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200/60 overflow-hidden h-full flex flex-col shadow-sm animate-slide-in">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-start gap-4">
          <div className="relative">
            <img src={candidate.avatarUrl} alt={candidate.login} className="w-16 h-16 rounded-xl border-2 border-gray-100 object-cover" />
            {candidate.shortlisted && (
              <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center shadow-sm ring-2 ring-white">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-bold text-primary-900 tracking-tight">{candidate.name || candidate.login}</h2>
              {candidate.fitScore != null && candidate.fitScore > 0 && (
                <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                  candidate.fitScore >= 75 ? "bg-green-100 text-green-700" :
                  candidate.fitScore >= 50 ? "bg-amber-100 text-amber-700" :
                  "bg-red-100 text-red-700"
                }`}>
                  {candidate.fitScore}% fit
                </span>
              )}
            </div>
            {candidate.name && <p className="text-sm text-gray-400 mt-0.5">@{candidate.login}</p>}
            {candidate.bio && <p className="text-sm text-gray-500 mt-1.5 leading-relaxed line-clamp-2">{candidate.bio}</p>}
          </div>
        </div>

        {/* Quick Info */}
        <div className="flex items-center gap-5 mt-4 text-sm">
          {candidate.location && (
            <span className="flex items-center gap-1.5 text-gray-400">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {candidate.location}
            </span>
          )}
          {candidate.company && (
            <span className="flex items-center gap-1.5 text-gray-400">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              {candidate.company}
            </span>
          )}
          <span className="text-gray-300 text-xs">Joined {formatDate(candidate.createdAtGh)}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2.5 mt-4">
          <button
            onClick={() => onShortlistToggle(candidate.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              candidate.shortlisted
                ? "bg-primary-500 text-white hover:bg-primary-600"
                : "border border-gray-200 text-gray-600 hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50/50"
            }`}
          >
            <svg className="w-4 h-4" fill={candidate.shortlisted ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            {candidate.shortlisted ? "Shortlisted" : "Shortlist"}
          </button>
          <button
            onClick={() => onFindSimilar(candidate.id)}
            className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50/50 transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Find Similar
          </button>
          <a
            href={candidate.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
          >
            GitHub
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-100 px-6">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`py-3 px-3 text-sm font-medium border-b-2 transition-all duration-200 ${
                activeTab === tab.key
                  ? "border-primary-500 text-primary-700"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-6 animate-fade-in">
        {activeTab === "summary" && (
          <SummaryTab candidate={candidate} notes={notes} onNotesChange={handleNotesChange} />
        )}
        {activeTab === "repos" && (
          <ReposTab repos={candidate.topRepos} />
        )}
        {activeTab === "stats" && (
          <StatsTab candidate={candidate} />
        )}
      </div>
    </div>
  );
}
