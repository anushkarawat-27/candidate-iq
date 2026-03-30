"use client";

import { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/Navbar";
import FilterBar, { Filters } from "@/components/FilterBar";
import CandidateCard from "@/components/CandidateCard";
import DetailPanel from "@/components/DetailPanel";
import AISearch from "@/components/AISearch";
import CompareModal from "@/components/CompareModal";
import RoleBar from "@/components/RoleBar";
import ToastContainer, { showToast } from "@/components/Toast";
import { CardSkeleton } from "@/components/LoadingSkeleton";
import { Candidate, CandidatesResponse } from "@/lib/types";

export default function Home() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"search" | "shortlisted">("search");
  const [currentPage, setCurrentPage] = useState<"candidates" | "ai-search">("candidates");
  const [filters, setFilters] = useState<Filters>({
    search: "",
    language: "",
    location: "",
    sortBy: "followers",
  });

  // Compare state
  const [compareIds, setCompareIds] = useState<Set<number>>(new Set());
  const [showCompare, setShowCompare] = useState(false);

  // Similar candidates state
  const [similarCandidates, setSimilarCandidates] = useState<Candidate[] | null>(null);
  const [similarLoading, setSimilarLoading] = useState(false);

  // Role context state
  const [roleDescription, setRoleDescription] = useState("");
  const [scoring, setScoring] = useState(false);
  const [similarSourceName, setSimilarSourceName] = useState("");

  const fetchCandidates = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.search) params.set("search", filters.search);
    if (filters.language) params.set("language", filters.language);
    if (filters.location) params.set("location", filters.location);
    if (filters.sortBy) params.set("sortBy", filters.sortBy);
    if (activeTab === "shortlisted") params.set("shortlisted", "true");
    params.set("page", page.toString());
    params.set("limit", "20");

    try {
      const res = await fetch(`/api/candidates?${params}`);
      const data: CandidatesResponse = await res.json();
      setCandidates(data.candidates);
      setTotal(data.total);
      setTotalPages(data.totalPages);
      if (data.languages.length > 0) setLanguages(data.languages);
    } catch (err) {
      console.error("Failed to fetch candidates:", err);
    } finally {
      setLoading(false);
    }
  }, [filters, page, activeTab]);

  useEffect(() => {
    if (currentPage === "candidates") {
      fetchCandidates();
    }
  }, [fetchCandidates, currentPage]);

  const handleFiltersChange = useCallback((newFilters: Filters) => {
    setFilters(newFilters);
    setPage(1);
    setSelectedId(null);
    setSimilarCandidates(null);
  }, []);

  const handleTabChange = useCallback((tab: "search" | "shortlisted") => {
    setActiveTab(tab);
    setPage(1);
    setSelectedId(null);
    setSimilarCandidates(null);
  }, []);

  const handleShortlistToggle = async (id: number) => {
    try {
      const res = await fetch(`/api/candidates/${id}/shortlist`, {
        method: "PATCH",
      });
      const updated: Candidate = await res.json();
      setCandidates((prev) =>
        prev.map((c) => (c.id === id ? updated : c))
      );
      if (similarCandidates) {
        setSimilarCandidates((prev) =>
          prev ? prev.map((c) => (c.id === id ? { ...updated, similarityReason: c.similarityReason } : c)) : null
        );
      }
      showToast(updated.shortlisted ? "Added to shortlist" : "Removed from shortlist");
    } catch (err) {
      console.error("Failed to toggle shortlist:", err);
    }
  };

  const handleFindSimilar = async (id: number) => {
    setSimilarLoading(true);
    const source = candidates.find((c) => c.id === id) || similarCandidates?.find((c) => c.id === id);
    setSimilarSourceName(source?.name || source?.login || "");
    try {
      const res = await fetch("/api/ai/similar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId: id }),
      });
      const data = await res.json();
      setSimilarCandidates(data.matches || []);
      setSelectedId(null);
    } catch (err) {
      console.error("Find similar failed:", err);
    } finally {
      setSimilarLoading(false);
    }
  };

  const handleCompareToggle = (id: number) => {
    setCompareIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < 4) {
        next.add(id);
      }
      return next;
    });
  };

  const handleScoreCandidates = async () => {
    if (!roleDescription) return;
    setScoring(true);
    try {
      // Fetch ALL candidate IDs first
      const allRes = await fetch(`/api/candidates?limit=200`);
      const allData: CandidatesResponse = await allRes.json();
      const allIds = allData.candidates.map((c) => c.id);

      // Score in batches of 10 to avoid timeout
      for (let i = 0; i < allIds.length; i += 10) {
        const batch = allIds.slice(i, i + 10);
        await fetch("/api/ai/fit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roleDescription, candidateIds: batch }),
        });
      }

      // Re-fetch current page sorted by fitScore
      setFilters((prev) => ({ ...prev, sortBy: "fitScore" }));
      setPage(1);
    } catch (err) {
      console.error("Scoring failed:", err);
    } finally {
      setScoring(false);
    }
  };

  const handleNotesUpdate = async (id: number, notes: string) => {
    try {
      await fetch(`/api/candidates/${id}/notes`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
    } catch (err) {
      console.error("Failed to save notes:", err);
    }
  };

  const rawCandidates = similarCandidates || candidates;
  const displayCandidates = roleDescription
    ? rawCandidates
    : rawCandidates.map((c) => ({ ...c, fitScore: null, fitReason: null }));
  const selectedCandidate = displayCandidates.find((c) => c.id === selectedId);
  const compareCandidates = displayCandidates.filter((c) => compareIds.has(c.id));

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar currentPage={currentPage} onPageChange={setCurrentPage} />

      {currentPage === "ai-search" ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex gap-6">
            <div className={selectedCandidate ? "w-1/2 xl:w-5/12" : "w-full"}>
              <AISearch
                onSelectCandidate={(c) => setSelectedId(c.id === selectedId ? null : c.id)}
                selectedId={selectedId}
              />
            </div>
            {selectedCandidate && (
              <div className="w-1/2 xl:w-7/12 sticky top-[80px]" style={{ maxHeight: "calc(100vh - 120px)" }}>
                <DetailPanel
                  candidate={selectedCandidate}
                  onShortlistToggle={handleShortlistToggle}
                  onFindSimilar={handleFindSimilar}
                  onNotesUpdate={handleNotesUpdate}
                />
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          <RoleBar
            roleDescription={roleDescription}
            onRoleChange={setRoleDescription}
            onScoreCandidates={handleScoreCandidates}
            scoring={scoring}
          />
          <FilterBar
            onFiltersChange={handleFiltersChange}
            languages={languages}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {/* Results count + Compare button */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <p className="text-sm text-gray-500">
                  {loading ? "Loading..." : (
                    <>
                      <span className="font-medium text-primary-900">{similarCandidates ? similarCandidates.length : total}</span>{" "}
                      candidate{(similarCandidates ? similarCandidates.length : total) !== 1 ? "s" : ""}{" "}
                      {similarCandidates ? `similar to ${similarSourceName}` : "found"}
                    </>
                  )}
                </p>
                {similarCandidates && (
                  <button
                    onClick={() => { setSimilarCandidates(null); setSelectedId(null); }}
                    className="text-xs px-3 py-1 border border-gray-200 rounded-full text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-all"
                  >
                    Clear similar results
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                {compareIds.size >= 2 && (
                  <button
                    onClick={() => setShowCompare(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-primary-200/50 transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Compare ({compareIds.size})
                  </button>
                )}
                {compareIds.size > 0 && (
                  <button
                    onClick={() => setCompareIds(new Set())}
                    className="text-xs text-gray-400 hover:text-gray-600 transition-all"
                  >
                    Clear selection
                  </button>
                )}
              </div>
            </div>


            {/* Similar loading */}
            {similarLoading && (
              <div className="text-center py-12">
                <svg className="w-8 h-8 animate-spin text-primary-500 mx-auto" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <p className="text-sm text-gray-500 mt-3">Finding similar candidates...</p>
              </div>
            )}

            {/* Main Content: List + Detail */}
            {!similarLoading && (
              <>
              <div className="bg-white rounded-xl border border-gray-200/60 overflow-hidden shadow-sm">
                {/* Column Header */}
                <div className="flex items-center gap-4 px-5 py-2.5 border-b border-gray-100 bg-gray-50/50 text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                  <div className="w-4 flex-shrink-0" /> {/* checkbox space */}
                  <div className="w-9 flex-shrink-0" /> {/* avatar space */}
                  <div className="w-[220px] flex-shrink-0">Name</div>
                  <div className="hidden md:block w-[200px] flex-shrink-0">Languages</div>
                  <div className="flex items-center gap-5 ml-auto flex-shrink-0">
                    <span className="w-[52px] text-right">Followers</span>
                    <span className="w-[48px] text-right">Stars</span>
                  </div>
                  {roleDescription && <div className="w-[42px] text-center flex-shrink-0">Fit</div>}
                  <div className="w-4 flex-shrink-0" /> {/* arrow space */}
                </div>
                <div
                  className="overflow-y-auto scroll-shadow"
                  style={{ maxHeight: "calc(100vh - 320px)" }}
                >
                  {loading ? (
                    Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)
                  ) : displayCandidates.length === 0 ? (
                    <div className="text-center py-16">
                      <svg className="mx-auto h-10 w-10 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                        <circle cx="9" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} />
                      </svg>
                      <h3 className="mt-3 text-sm font-medium text-gray-900">No candidates found</h3>
                      <p className="mt-1 text-sm text-gray-400">
                        {activeTab === "shortlisted"
                          ? "You haven't shortlisted any candidates yet."
                          : "Try adjusting your search or filters."}
                      </p>
                    </div>
                  ) : (
                    displayCandidates.map((candidate, i) => (
                      <div key={candidate.id} className="flex items-center animate-card-in group/row hover:bg-gray-50 transition-colors" style={{ animationDelay: `${i * 20}ms` }}>
                        <input
                          type="checkbox"
                          checked={compareIds.has(candidate.id)}
                          onChange={() => handleCompareToggle(candidate.id)}
                          className="ml-3 w-4 h-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500/20 cursor-pointer flex-shrink-0 accent-primary-500"
                          title="Select for comparison"
                        />
                        <div className="flex-1">
                          <CandidateCard
                            candidate={candidate}
                            isActive={candidate.id === selectedId}
                            onClick={() =>
                              setSelectedId(candidate.id === selectedId ? null : candidate.id)
                            }
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Pagination */}
                {!similarCandidates && totalPages > 1 && !loading && (
                  <div className="flex items-center justify-center gap-2 py-3 border-t border-gray-100">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-3 py-1.5 text-sm border border-gray-200 rounded-xl disabled:opacity-30 hover:bg-gray-50 transition-all"
                    >
                      Previous
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum: number;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (page <= 3) {
                        pageNum = i + 1;
                      } else if (page >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = page - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`w-8 h-8 text-sm rounded-xl transition-all ${
                            page === pageNum
                              ? "bg-primary-500 text-white shadow-sm"
                              : "hover:bg-gray-50 text-gray-500"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-3 py-1.5 text-sm border border-gray-200 rounded-xl disabled:opacity-30 hover:bg-gray-50 transition-all"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>

              {/* Detail Panel — Slide-over from right */}
              {selectedCandidate && (
                <>
                  <div
                    className="fixed inset-0 bg-black/20 z-40 animate-fade-in"
                    onClick={() => setSelectedId(null)}
                  />
                  <div
                    className="fixed top-0 right-0 h-full w-full max-w-xl z-50 animate-slide-in shadow-2xl"
                  >
                    <div className="h-full flex flex-col">
                      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-white flex-shrink-0">
                        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Candidate Detail</span>
                        <button
                          onClick={() => setSelectedId(null)}
                          className="p-1.5 hover:bg-gray-100 rounded-lg transition-all"
                        >
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <DetailPanel
                        candidate={selectedCandidate}
                        onShortlistToggle={handleShortlistToggle}
                        onFindSimilar={handleFindSimilar}
                  onNotesUpdate={handleNotesUpdate}
                      />
                    </div>
                  </div>
                </>
              )}
              </>
            )}
          </div>
        </>
      )}

      {/* Compare Modal */}
      {showCompare && compareCandidates.length >= 2 && (
        <CompareModal
          candidates={compareCandidates}
          onClose={() => setShowCompare(false)}
        />
      )}

      <ToastContainer />
    </div>
  );
}
