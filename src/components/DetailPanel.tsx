"use client";

import { useState } from "react";
import { Candidate } from "@/lib/types";
import { showToast } from "./Toast";

interface DetailPanelProps {
  candidate: Candidate;
  onShortlistToggle: (id: number) => void;
  onFindSimilar: (id: number) => void;
  onNotesUpdate: (id: number, notes: string) => void;
}

function formatNumber(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return n.toString();
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

type Tab = "summary" | "repos" | "stats";
type RepoSort = "stars" | "name" | "language";

export default function DetailPanel({
  candidate,
  onShortlistToggle,
  onFindSimilar,
  onNotesUpdate,
}: DetailPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>("summary");
  const [repoSort, setRepoSort] = useState<RepoSort>("stars");
  const [repoLangFilter, setRepoLangFilter] = useState<Set<string>>(new Set());
  const [aiSummary, setAiSummary] = useState<string | null>(candidate.aiSummary);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [notes, setNotes] = useState(candidate.notes || "");
  const [notesSaved, setNotesSaved] = useState(true);
  const [notesTimeout, setNotesTimeout] = useState<NodeJS.Timeout | null>(null);

  const handleNotesChange = (value: string) => {
    setNotes(value);
    setNotesSaved(false);
    if (notesTimeout) clearTimeout(notesTimeout);
    const timeout = setTimeout(() => {
      onNotesUpdate(candidate.id, value);
      setNotesSaved(true);
      showToast("Notes saved");
    }, 800);
    setNotesTimeout(timeout);
  };

  // Get unique languages from repos
  const repoLanguages = Array.from(
    new Set(candidate.topRepos?.map((r) => r.language).filter(Boolean) as string[])
  ).sort();

  const generateSummary = async () => {
    setSummaryLoading(true);
    try {
      const res = await fetch("/api/ai/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId: candidate.id }),
      });
      const data = await res.json();
      if (data.summary) setAiSummary(data.summary);
    } catch (err) {
      console.error("Failed to generate summary:", err);
    } finally {
      setSummaryLoading(false);
    }
  };

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
            <img
              src={candidate.avatarUrl}
              alt={candidate.login}
              className="w-16 h-16 rounded-xl border-2 border-gray-100 object-cover"
            />
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
              <h2 className="text-xl font-bold text-primary-900 tracking-tight">
                {candidate.name || candidate.login}
              </h2>
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
            {candidate.name && (
              <p className="text-sm text-gray-400 mt-0.5">@{candidate.login}</p>
            )}
            {candidate.bio && (
              <p className="text-sm text-gray-500 mt-1.5 leading-relaxed line-clamp-2">
                {candidate.bio}
              </p>
            )}
          </div>
        </div>

        {/* Quick Stats */}
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
          <span className="text-gray-300 text-xs">
            Joined {formatDate(candidate.createdAtGh)}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2.5 mt-4 flex-wrap">
          <button
            onClick={() => onShortlistToggle(candidate.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              candidate.shortlisted
                ? "bg-primary-500 text-white shadow-sm hover:bg-primary-600 hover:shadow-md"
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
            className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50/50 transition-all duration-200"
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
            className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
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
                <h4 className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Why Similar
                </h4>
                <p className="text-sm text-amber-800/80">{candidate.similarityReason}</p>
              </div>
            )}

            {/* Languages */}
            {candidate.languages && candidate.languages.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5">Languages</h4>
                <div className="flex flex-wrap gap-1.5">
                  {candidate.languages.map((lang) => (
                    <span
                      key={lang}
                      className="px-2.5 py-1 bg-primary-50 text-primary-600 text-xs rounded-lg font-medium"
                    >
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Followers", value: formatNumber(candidate.followers), icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" },
                { label: "Following", value: formatNumber(candidate.following), icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
                { label: "Repos", value: String(candidate.topRepos?.length ?? 0), icon: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" },
                { label: "Stars", value: formatNumber(candidate.totalStars), icon: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" },
              ].map((stat) => (
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
                <h4 className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Role Fit
                </h4>
                <p className="text-sm text-green-800/80">{candidate.fitReason}</p>
              </div>
            )}

            {/* Recruiter Notes */}
            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Notes
              </h4>
              <textarea
                value={notes}
                onChange={(e) => handleNotesChange(e.target.value)}
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
        )}

        {activeTab === "repos" && (
          <div className="space-y-3">
            {candidate.topRepos && candidate.topRepos.length > 0 ? (
              <>
                {/* Filter & Sort Toolbar */}
                <div className="space-y-2.5">
                  {/* Sort row */}
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-400">
                      {(() => {
                        const filtered = candidate.topRepos!.filter(
                          (r) => repoLangFilter.size === 0 || (r.language && repoLangFilter.has(r.language))
                        );
                        return `${filtered.length} of ${candidate.topRepos!.length} repositories`;
                      })()}
                    </p>
                    <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-0.5">
                      {(["stars", "name", "language"] as RepoSort[]).map((sort) => (
                        <button
                          key={sort}
                          onClick={() => setRepoSort(sort)}
                          className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all ${
                            repoSort === sort
                              ? "bg-white text-primary-700 shadow-sm"
                              : "text-gray-400 hover:text-gray-600"
                          }`}
                        >
                          {sort === "stars" ? "Stars" : sort === "name" ? "Name" : "Lang"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Language filter chips */}
                  {repoLanguages.length > 1 && (
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        onClick={() => setRepoLangFilter(new Set())}
                        className={`px-2 py-0.5 text-[11px] font-medium rounded-md transition-all ${
                          repoLangFilter.size === 0
                            ? "bg-primary-500 text-white"
                            : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                        }`}
                      >
                        All
                      </button>
                      {repoLanguages.map((lang) => (
                        <button
                          key={lang}
                          onClick={() => {
                            setRepoLangFilter((prev) => {
                              const next = new Set(prev);
                              if (next.has(lang)) {
                                next.delete(lang);
                              } else {
                                next.add(lang);
                              }
                              return next;
                            });
                          }}
                          className={`px-2 py-0.5 text-[11px] font-medium rounded-md transition-all ${
                            repoLangFilter.has(lang)
                              ? "bg-primary-500 text-white"
                              : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                          }`}
                        >
                          {lang}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Repo list */}
                {[...candidate.topRepos]
                  .filter((r) => repoLangFilter.size === 0 || (r.language && repoLangFilter.has(r.language)))
                  .sort((a, b) => {
                    if (repoSort === "stars") return b.stars - a.stars;
                    if (repoSort === "name") return a.name.localeCompare(b.name);
                    return (a.language || "zzz").localeCompare(b.language || "zzz");
                  })
                  .map((repo) => (
                <a
                  key={repo.name}
                  href={repo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3.5 border border-gray-100 rounded-xl hover:border-primary-200 hover:shadow-sm hover:-translate-y-[0.5px] transition-all duration-200"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-primary-600 text-sm">{repo.name}</h4>
                    {repo.stars > 0 && (
                      <span className="flex items-center gap-1 text-xs text-amber-500 font-medium">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                        {repo.stars}
                      </span>
                    )}
                  </div>
                  {repo.description && (
                    <p className="text-xs text-gray-400 mt-1 line-clamp-1">{repo.description}</p>
                  )}
                  {repo.language && (
                    <span className="inline-block mt-2 px-2 py-0.5 bg-gray-50 text-gray-500 text-[10px] rounded-md font-medium">
                      {repo.language}
                    </span>
                  )}
                </a>
              ))}
              </>
            ) : (
              <div className="text-center py-12">
                <svg className="mx-auto h-8 w-8 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <p className="text-sm text-gray-400 mt-2">No repositories found</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "stats" && (
          <div className="space-y-1">
            {[
              { label: "Followers", value: candidate.followers },
              { label: "Following", value: candidate.following },
              { label: "Owned Repos", value: candidate.topRepos?.length ?? 0 },
              { label: "Public Repos (incl. forks)", value: candidate.publicRepos },
              { label: "Total Stars", value: candidate.totalStars },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center justify-between py-2.5 border-b border-gray-50">
                <span className="text-sm text-gray-400">{stat.label}</span>
                <span className="text-sm font-semibold text-primary-900 tabular-nums">{formatNumber(stat.value)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between py-2.5 border-b border-gray-50">
              <span className="text-sm text-gray-400">Account Created</span>
              <span className="text-sm font-semibold text-primary-900">{formatDate(candidate.createdAtGh)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
