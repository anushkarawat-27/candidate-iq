"use client";

import { useEffect, useCallback } from "react";

interface ShortcutHandlers {
  candidates: { id: number }[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onShortlist: (id: number) => void;
  onClose: () => void;
}

export function useKeyboardShortcuts({
  candidates,
  selectedId,
  onSelect,
  onShortlist,
  onClose,
}: ShortcutHandlers) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't fire when typing in inputs
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      const currentIndex = candidates.findIndex((c) => c.id === selectedId);

      switch (e.key) {
        case "j": {
          // Next candidate
          e.preventDefault();
          const nextIndex = currentIndex < candidates.length - 1 ? currentIndex + 1 : 0;
          onSelect(candidates[nextIndex]?.id ?? -1);
          break;
        }
        case "k": {
          // Previous candidate
          e.preventDefault();
          const prevIndex = currentIndex > 0 ? currentIndex - 1 : candidates.length - 1;
          onSelect(candidates[prevIndex]?.id ?? -1);
          break;
        }
        case "s": {
          // Shortlist current
          if (selectedId) {
            e.preventDefault();
            onShortlist(selectedId);
          }
          break;
        }
        case "Escape": {
          e.preventDefault();
          onClose();
          break;
        }
      }
    },
    [candidates, selectedId, onSelect, onShortlist, onClose]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
