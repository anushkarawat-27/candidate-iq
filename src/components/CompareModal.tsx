"use client";

import { useState } from "react";
import { Candidate } from "@/lib/types";
import { formatNumber } from "@/lib/utils";
import { showToast } from "./Toast";

interface CompareModalProps {
  candidates: Candidate[];
  onClose: () => void;
}

export default function CompareModal({ candidates, onClose }: CompareModalProps) {
  const [comparison, setComparison] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generateComparison = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateIds: candidates.map((c) => c.id) }),
      });
      if (!res.ok) throw new Error("Comparison failed");
      const data = await res.json();
      if (data.comparison) setComparison(data.comparison);
    } catch (err) {
      showToast("Failed to generate comparison", "error");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col shadow-2xl animate-slide-in">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-base font-bold text-primary-900">Compare Candidates</h2>
              <p className="text-xs text-gray-400">AI-powered comparison</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-all"
          >
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Candidates being compared */}
        <div className="px-6 py-4 border-b border-gray-50 flex gap-2.5 overflow-x-auto">
          {candidates.map((c) => (
            <div key={c.id} className="flex items-center gap-2.5 bg-gray-50/80 rounded-xl px-3 py-2 flex-shrink-0 border border-gray-100/50">
              <img src={c.avatarUrl} alt={c.login} className="w-8 h-8 rounded-lg" />
              <div>
                <p className="text-sm font-medium text-primary-900">{c.name || c.login}</p>
                <p className="text-[10px] text-gray-400">{formatNumber(c.followers)} followers · {formatNumber(c.totalStars)} stars</p>
              </div>
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!comparison && !loading && (
            <div className="text-center py-10">
              <button
                onClick={generateComparison}
                className="px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-primary-200/50 transition-all flex items-center gap-2 mx-auto"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Generate AI Comparison
              </button>
              <p className="text-xs text-gray-300 mt-3">
                Claude will analyze and compare these candidates.
              </p>
            </div>
          )}

          {loading && (
            <div className="py-8 space-y-3">
              <div className="h-4 animate-shimmer rounded w-full" />
              <div className="h-4 animate-shimmer rounded w-5/6" />
              <div className="h-4 animate-shimmer rounded w-4/6" />
              <div className="h-4 animate-shimmer rounded w-full mt-4" />
              <div className="h-4 animate-shimmer rounded w-3/4" />
              <div className="h-4 animate-shimmer rounded w-5/6" />
            </div>
          )}

          {comparison && (
            <div className="animate-fade-in space-y-2">
              {comparison.split("\n").map((line, i) => {
                if (!line.trim()) return <div key={i} className="h-2" />;
                if (line.startsWith("**") && line.endsWith("**")) {
                  return <h3 key={i} className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-4 mb-1">{line.replace(/\*\*/g, "")}</h3>;
                }
                if (line.startsWith("- **")) {
                  const parts = line.replace(/^- \*\*/, "").split("**:");
                  return (
                    <div key={i} className="flex gap-2 ml-1 mb-1">
                      <div className="w-1 bg-primary-200 rounded-full flex-shrink-0 mt-1" style={{ minHeight: "16px" }} />
                      <p className="text-sm text-gray-600 leading-relaxed">
                        <span className="font-semibold text-primary-900">{parts[0]}:</span>
                        {parts[1]}
                      </p>
                    </div>
                  );
                }
                return <p key={i} className="text-sm text-gray-600 leading-relaxed">{line.replace(/\*\*/g, "")}</p>;
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
