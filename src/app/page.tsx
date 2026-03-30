"use client";

import { useState, useCallback } from "react";
import Navbar from "@/components/Navbar";
import FilterBar from "@/components/FilterBar";
import CandidateList from "@/components/CandidateList";
import DetailPanel from "@/components/DetailPanel";
import AISearch from "@/components/AISearch";
import CompareModal from "@/components/CompareModal";
import RoleBar from "@/components/RoleBar";
import ToastContainer from "@/components/Toast";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useCandidates } from "@/hooks/useCandidates";
import { Candidate, CandidatesResponse } from "@/lib/types";

export default function Home() {
  const {
    candidates, setCandidates, languages, total, totalPages,
    page, setPage, loading, activeTab, filters, setFilters,
    handleFiltersChange, handleTabChange, handleShortlistToggle,
  } = useCandidates();

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState<"candidates" | "ai-search">("candidates");

  // Compare state
  const [compareIds, setCompareIds] = useState<Set<number>>(new Set());
  const [showCompare, setShowCompare] = useState(false);

  // Similar candidates state
  const [similarCandidates, setSimilarCandidates] = useState<Candidate[] | null>(null);
  const [similarLoading, setSimilarLoading] = useState(false);
  const [similarSourceName, setSimilarSourceName] = useState("");

  // Role context state
  const [roleDescription, setRoleDescription] = useState("");
  const [scoring, setScoring] = useState(false);

  // --- Handlers ---

  const handleSelect = useCallback((id: number) => {
    setSelectedId(id === -1 ? null : id);
  }, []);

  const handleShortlist = async (id: number) => {
    const updated = await handleShortlistToggle(id);
    if (updated && similarCandidates) {
      setSimilarCandidates((prev) =>
        prev ? prev.map((c) => (c.id === id ? { ...updated, similarityReason: c.similarityReason } : c)) : null
      );
    }
  };

  const handleFindSimilar = async (id: number) => {
    setSimilarLoading(true);
    const allCandidates = similarCandidates || candidates;
    const source = allCandidates.find((c) => c.id === id);
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
      next.has(id) ? next.delete(id) : (next.size < 4 && next.add(id));
      return next;
    });
  };

  const handleScoreCandidates = async () => {
    if (!roleDescription) return;
    setScoring(true);
    try {
      const allRes = await fetch("/api/candidates?limit=200");
      const allData: CandidatesResponse = await allRes.json();
      const allIds = allData.candidates.map((c) => c.id);

      for (let i = 0; i < allIds.length; i += 10) {
        await fetch("/api/ai/fit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roleDescription, candidateIds: allIds.slice(i, i + 10) }),
        });
      }

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

  // --- Derived state ---

  const rawCandidates = similarCandidates || candidates;
  const displayCandidates = roleDescription
    ? rawCandidates
    : rawCandidates.map((c) => ({ ...c, fitScore: null, fitReason: null }));
  const selectedCandidate = displayCandidates.find((c) => c.id === selectedId);
  const compareCandidates = displayCandidates.filter((c) => compareIds.has(c.id));

  // --- Render ---

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
                  onShortlistToggle={handleShortlist}
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
            {/* Results Header */}
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
                  <button onClick={() => setCompareIds(new Set())} className="text-xs text-gray-400 hover:text-gray-600 transition-all">
                    Clear selection
                  </button>
                )}
              </div>
            </div>

            {/* Similar Loading */}
            {similarLoading && (
              <div className="text-center py-12">
                <LoadingSpinner className="w-8 h-8 text-primary-500 mx-auto" />
                <p className="text-sm text-gray-500 mt-3">Finding similar candidates...</p>
              </div>
            )}

            {/* Main List */}
            {!similarLoading && (
              <>
                <CandidateList
                  candidates={displayCandidates}
                  loading={loading}
                  selectedId={selectedId}
                  compareIds={compareIds}
                  roleDescription={roleDescription}
                  totalPages={similarCandidates ? 1 : totalPages}
                  page={page}
                  showPagination={!similarCandidates}
                  emptyMessage={activeTab === "shortlisted" ? "You haven't shortlisted any candidates yet." : "Try adjusting your search or filters."}
                  onSelect={handleSelect}
                  onCompareToggle={handleCompareToggle}
                  onPageChange={setPage}
                />

                {/* Detail Slide-Over */}
                {selectedCandidate && (
                  <>
                    <div className="fixed inset-0 bg-black/20 z-40 animate-fade-in" onClick={() => setSelectedId(null)} />
                    <div className="fixed top-0 right-0 h-full w-full max-w-xl z-50 animate-slide-in shadow-2xl">
                      <div className="h-full flex flex-col">
                        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-white flex-shrink-0">
                          <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Candidate Detail</span>
                          <button onClick={() => setSelectedId(null)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-all">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        <DetailPanel
                          candidate={selectedCandidate}
                          onShortlistToggle={handleShortlist}
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
        <CompareModal candidates={compareCandidates} onClose={() => setShowCompare(false)} />
      )}

      <ToastContainer />
    </div>
  );
}
