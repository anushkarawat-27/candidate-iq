"use client";

import { useState, useMemo } from "react";
import { TopRepo } from "@/lib/types";

type RepoSort = "stars" | "name" | "language";

interface ReposTabProps {
  repos: TopRepo[] | null;
}

export default function ReposTab({ repos }: ReposTabProps) {
  const [sortBy, setSortBy] = useState<RepoSort>("stars");
  const [langFilter, setLangFilter] = useState<Set<string>>(new Set());

  const languages = useMemo(
    () => Array.from(new Set(repos?.map((r) => r.language).filter(Boolean) as string[])).sort(),
    [repos]
  );

  const filteredAndSorted = useMemo(() => {
    if (!repos) return [];
    return [...repos]
      .filter((r) => langFilter.size === 0 || (r.language && langFilter.has(r.language)))
      .sort((a, b) => {
        if (sortBy === "stars") return b.stars - a.stars;
        if (sortBy === "name") return a.name.localeCompare(b.name);
        return (a.language || "zzz").localeCompare(b.language || "zzz");
      });
  }, [repos, langFilter, sortBy]);

  const toggleLang = (lang: string) => {
    setLangFilter((prev) => {
      const next = new Set(prev);
      next.has(lang) ? next.delete(lang) : next.add(lang);
      return next;
    });
  };

  if (!repos || repos.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="mx-auto h-8 w-8 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
        <p className="text-sm text-gray-400 mt-2">No repositories found</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">
            {filteredAndSorted.length} of {repos.length} repositories
          </p>
          <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-0.5">
            {(["stars", "name", "language"] as RepoSort[]).map((sort) => (
              <button
                key={sort}
                onClick={() => setSortBy(sort)}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all ${
                  sortBy === sort
                    ? "bg-white text-primary-700 shadow-sm"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {sort === "stars" ? "Stars" : sort === "name" ? "Name" : "Lang"}
              </button>
            ))}
          </div>
        </div>

        {languages.length > 1 && (
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setLangFilter(new Set())}
              className={`px-2 py-0.5 text-[11px] font-medium rounded-md transition-all ${
                langFilter.size === 0 ? "bg-primary-500 text-white" : "bg-gray-50 text-gray-400 hover:bg-gray-100"
              }`}
            >
              All
            </button>
            {languages.map((lang) => (
              <button
                key={lang}
                onClick={() => toggleLang(lang)}
                className={`px-2 py-0.5 text-[11px] font-medium rounded-md transition-all ${
                  langFilter.has(lang) ? "bg-primary-500 text-white" : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Repo List */}
      {filteredAndSorted.map((repo) => (
        <a
          key={repo.name}
          href={repo.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block p-3.5 border border-gray-100 rounded-xl hover:border-primary-200 hover:shadow-sm transition-all duration-200"
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
          {repo.description && <p className="text-xs text-gray-400 mt-1 line-clamp-1">{repo.description}</p>}
          {repo.language && (
            <span className="inline-block mt-2 px-2 py-0.5 bg-gray-50 text-gray-500 text-[10px] rounded-md font-medium">{repo.language}</span>
          )}
        </a>
      ))}
    </div>
  );
}
