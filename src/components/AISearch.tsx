"use client";

import { useState } from "react";
import { Candidate } from "@/lib/types";
import CandidateCard from "./CandidateCard";

interface AISearchProps {
  onSelectCandidate: (candidate: Candidate) => void;
  selectedId: number | null;
}

export default function AISearch({ onSelectCandidate, selectedId }: AISearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Candidate[]>([]);
  const [interpretation, setInterpretation] = useState("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch("/api/ai/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      setResults(data.candidates || []);
      setInterpretation(data.interpretation || "");
    } catch (err) {
      console.error("AI search failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const examples = [
    "Python developers with lots of followers",
    "developers who work at GitHub",
    "Rust engineers in San Francisco",
    "JavaScript and TypeScript developers",
    "active open source contributors",
  ];

  return (
    <div className="max-w-3xl mx-auto">
      {/* Search input */}
      <div className="bg-white rounded-2xl border border-gray-200/60 p-8 shadow-sm">
        <div className="flex items-center gap-2.5 mb-1.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-sm">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-primary-900 tracking-tight">AI-Powered Search</h2>
        </div>
        <p className="text-sm text-gray-400 mb-5 ml-[42px]">
          Describe the candidate you&apos;re looking for in plain English.
        </p>

        <div className="flex gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="e.g., Go developers in San Francisco with 500+ followers"
            className="flex-1 px-4 py-3 bg-gray-50/80 border border-gray-200/80 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 focus:bg-white transition-all"
          />
          <button
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            className="px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-primary-200/50 disabled:opacity-50 transition-all flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Searching...
              </>
            ) : (
              "Search"
            )}
          </button>
        </div>

        {/* Example queries */}
        <div className="mt-4">
          <p className="text-[10px] text-gray-300 uppercase tracking-wider mb-2 font-medium">Try these</p>
          <div className="flex flex-wrap gap-1.5">
            {examples.map((ex) => (
              <button
                key={ex}
                onClick={() => { setQuery(ex); }}
                className="text-xs px-3 py-1.5 bg-gray-50 text-gray-500 rounded-lg hover:bg-primary-50 hover:text-primary-600 transition-all border border-transparent hover:border-primary-200"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Interpretation */}
      {interpretation && (
        <div className="mt-4 bg-gradient-to-r from-primary-50/80 to-indigo-50/80 rounded-xl px-4 py-3 border border-primary-100/50 animate-fade-in">
          <p className="text-sm text-primary-700">
            <span className="font-semibold">Interpreted as:</span> {interpretation}
          </p>
        </div>
      )}

      {/* Results */}
      {searched && (
        <div className="mt-6 animate-fade-in">
          <p className="text-sm text-gray-400 mb-3">
            {loading ? "Searching..." : (
              <>
                <span className="font-semibold text-primary-900">{results.length}</span>{" "}
                candidate{results.length !== 1 ? "s" : ""} found
              </>
            )}
          </p>
          <div className="space-y-2.5">
            {results.map((candidate, i) => (
              <div key={candidate.id} className="animate-card-in" style={{ animationDelay: `${i * 50}ms` }}>
                <CandidateCard
                  candidate={candidate}
                  isActive={candidate.id === selectedId}
                  onClick={() => onSelectCandidate(candidate)}
                />
              </div>
            ))}
            {!loading && results.length === 0 && (
              <div className="text-center py-12">
                <svg className="mx-auto h-10 w-10 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p className="text-sm text-gray-400 mt-3">No candidates match your query. Try different criteria.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
