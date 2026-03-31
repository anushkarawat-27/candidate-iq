"use client";

import { useState } from "react";

export default function KeyboardHint() {
  const [open, setOpen] = useState(false);

  const shortcuts = [
    { key: "J", desc: "Next candidate" },
    { key: "K", desc: "Previous candidate" },
    { key: "S", desc: "Shortlist selected" },
    { key: "Esc", desc: "Close panel" },
  ];

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 left-6 z-50 w-8 h-8 bg-white border border-gray-200 rounded-lg shadow-sm flex items-center justify-center text-xs font-bold text-gray-400 hover:text-primary-500 hover:border-primary-300 transition-all"
        title="Keyboard shortcuts"
      >
        ?
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-50" onClick={() => setOpen(false)} />
          <div className="fixed bottom-16 left-6 z-50 bg-white rounded-xl border border-gray-200 shadow-xl p-4 animate-slide-in min-w-[200px]">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Keyboard Shortcuts</h4>
            <div className="space-y-2">
              {shortcuts.map((s) => (
                <div key={s.key} className="flex items-center justify-between gap-4">
                  <span className="text-sm text-gray-600">{s.desc}</span>
                  <kbd className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs font-mono rounded-md border border-gray-200">
                    {s.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}
