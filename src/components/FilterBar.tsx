"use client";

import { useCallback, useState, useEffect } from "react";

interface FilterBarProps {
  onFiltersChange: (filters: Filters) => void;
  languages: string[];
  activeTab: "search" | "shortlisted";
  onTabChange: (tab: "search" | "shortlisted") => void;
}

export interface Filters {
  search: string;
  language: string;
  location: string;
  sortBy: string;
}

export default function FilterBar({
  onFiltersChange,
  languages,
  activeTab,
  onTabChange,
}: FilterBarProps) {
  const [search, setSearch] = useState("");
  const [language, setLanguage] = useState("");
  const [location, setLocation] = useState("");
  const [sortBy, setSortBy] = useState("followers");

  const applyFilters = useCallback(() => {
    onFiltersChange({ search, language, location, sortBy });
  }, [search, language, location, sortBy, onFiltersChange]);

  useEffect(() => {
    const timeout = setTimeout(applyFilters, 300);
    return () => clearTimeout(timeout);
  }, [applyFilters]);

  return (
    <div className="glass border-b border-gray-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Tab Toggle */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center gap-1 bg-gray-100/80 rounded-full p-1">
            <button
              onClick={() => onTabChange("search")}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                activeTab === "search"
                  ? "bg-white text-primary-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search
            </button>
            <button
              onClick={() => onTabChange("shortlisted")}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                activeTab === "shortlisted"
                  ? "bg-white text-primary-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              Shortlisted
            </button>
          </div>
          {activeTab === "shortlisted" && (
            <>
              <button
                onClick={() => onTabChange("search")}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-400 hover:text-primary-500 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                All Candidates
              </button>
              <a
                href="/api/candidates/export"
                className="ml-auto flex items-center gap-1.5 px-4 py-1.5 bg-primary-500 text-white rounded-full text-sm font-medium hover:bg-primary-600 shadow-sm hover:shadow-md transition-all"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export CSV
              </a>
            </>
          )}
        </div>

        {/* Filter Inputs */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search people..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50/80 border border-gray-200/80 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 focus:bg-white transition-all"
            />
          </div>

          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="px-4 py-2.5 bg-gray-50/80 border border-gray-200/80 rounded-lg text-sm text-gray-600 hover:bg-white hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 focus:bg-white transition-all min-w-[160px] appearance-none cursor-pointer"
          >
            <option value="">All Languages</option>
            {languages.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>

          <div className="relative min-w-[160px]">
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <input
              type="text"
              placeholder="Location..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50/80 border border-gray-200/80 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 focus:bg-white transition-all"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2.5 bg-gray-50/80 border border-gray-200/80 rounded-lg text-sm text-gray-600 hover:bg-white hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 focus:bg-white transition-all appearance-none cursor-pointer"
          >
            <option value="followers">Sort: Followers</option>
            <option value="totalStars">Sort: Stars</option>
            <option value="publicRepos">Sort: Repos</option>
            <option value="name">Sort: Name</option>
            <option value="fitScore">Sort: Best Fit</option>
          </select>
        </div>
      </div>
    </div>
  );
}
