"use client";

interface NavbarProps {
  currentPage: "candidates" | "ai-search";
  onPageChange: (page: "candidates" | "ai-search") => void;
}

export default function Navbar({ currentPage, onPageChange }: NavbarProps) {
  return (
    <nav className="glass border-b border-gray-200/60 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <button
              onClick={() => onPageChange("candidates")}
              className="flex items-center gap-2 group"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                <span className="text-white text-sm font-bold">C</span>
              </div>
              <h1 className="text-xl font-bold text-primary-900">
                Candidate<span className="text-primary-500">IQ</span>
              </h1>
            </button>
            <div className="hidden sm:flex items-center gap-1 bg-gray-100/80 rounded-full p-1">
              <button
                onClick={() => onPageChange("candidates")}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                  currentPage === "candidates"
                    ? "bg-white text-primary-700 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Candidates
              </button>
              <button
                onClick={() => onPageChange("ai-search")}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
                  currentPage === "ai-search"
                    ? "bg-white text-primary-700 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                AI Search
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 hidden sm:block">
              Powered by GitHub + Claude
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
}
