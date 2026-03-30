"use client";

import { useState } from "react";

interface RoleBarProps {
  roleDescription: string;
  onRoleChange: (role: string) => void;
  onScoreCandidates: () => void;
  scoring: boolean;
}

export default function RoleBar({
  roleDescription,
  onRoleChange,
  onScoreCandidates,
  scoring,
}: RoleBarProps) {
  const [editing, setEditing] = useState(!roleDescription);
  const [draft, setDraft] = useState(roleDescription);

  const handleSave = () => {
    if (draft.trim()) {
      onRoleChange(draft.trim());
      setEditing(false);
    }
  };

  if (!editing && roleDescription) {
    return (
      <div className="bg-gradient-to-r from-primary-50/80 to-indigo-50/60 border-b border-primary-100/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="w-6 h-6 rounded-md bg-primary-500/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-3.5 h-3.5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-sm text-primary-800 truncate">
                <span className="font-semibold">Hiring for:</span> {roleDescription}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={onScoreCandidates}
                disabled={scoring}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-500 text-white rounded-lg text-xs font-medium hover:bg-primary-600 disabled:opacity-50 transition-all shadow-sm"
              >
                {scoring ? (
                  <>
                    <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Scoring...
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Score Candidates
                  </>
                )}
              </button>
              <button
                onClick={() => setEditing(true)}
                className="px-3 py-1.5 text-xs text-gray-500 hover:text-primary-500 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => onRoleChange("")}
                className="px-2 py-1.5 text-xs text-gray-400 hover:text-red-400 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-primary-50/80 to-indigo-50/60 border-b border-primary-100/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <h3 className="text-sm font-semibold text-primary-900">What role are you hiring for?</h3>
        </div>
        <div className="flex gap-3">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            placeholder="e.g., Senior Backend Engineer, Go/Python, remote, 3+ years experience"
            className="flex-1 px-4 py-2.5 bg-white border border-primary-200/60 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all"
            autoFocus
          />
          <button
            onClick={handleSave}
            disabled={!draft.trim()}
            className="px-5 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 disabled:opacity-50 transition-all shadow-sm"
          >
            Set Role
          </button>
          {roleDescription && (
            <button
              onClick={() => { setEditing(false); setDraft(roleDescription); }}
              className="px-3 py-2.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
