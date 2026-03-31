"use client";

import { useState } from "react";

export default function KeyboardHint() {
  const [open, setOpen] = useState(false);

  const shortcuts = [
    { key: "J", desc: "Next" },
    { key: "K", desc: "Previous" },
    { key: "S", desc: "Shortlist" },
    { key: "Esc", desc: "Close" },
  ];

  return (
    <div
      className="fixed bottom-6 left-6 z-50"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {/* Popover */}
      {open && (
        <div className="absolute bottom-12 left-0 bg-gray-900 rounded-xl shadow-xl p-3 animate-fade-in min-w-[180px]">
          <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Shortcuts</h4>
          <div className="space-y-1.5">
            {shortcuts.map((s) => (
              <div key={s.key} className="flex items-center justify-between gap-4">
                <span className="text-xs text-gray-300">{s.desc}</span>
                <kbd className="px-1.5 py-0.5 bg-gray-700 text-gray-300 text-[10px] font-mono rounded border border-gray-600 min-w-[24px] text-center">
                  {s.key}
                </kbd>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trigger button */}
      <button
        className="w-9 h-9 bg-white border border-gray-200 rounded-xl shadow-md flex items-center justify-center text-sm font-bold text-gray-400 hover:text-primary-500 hover:border-primary-300 hover:shadow-lg transition-all"
      >
        ?
      </button>
    </div>
  );
}
