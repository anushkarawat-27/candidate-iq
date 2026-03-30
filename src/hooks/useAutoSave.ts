"use client";

import { useState, useRef, useCallback } from "react";

export function useAutoSave(
  onSave: (value: string) => void,
  delayMs: number = 800
) {
  const [value, setValue] = useState("");
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleChange = useCallback(
    (newValue: string) => {
      setValue(newValue);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        onSave(newValue);
      }, delayMs);
    },
    [onSave, delayMs]
  );

  const reset = useCallback((initialValue: string) => {
    setValue(initialValue);
  }, []);

  return { value, handleChange, reset };
}
