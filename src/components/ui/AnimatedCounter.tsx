"use client";

import { useEffect, useState } from "react";

interface AnimatedCounterProps {
  value: string;
  className?: string;
}

export default function AnimatedCounter({ value, className = "" }: AnimatedCounterProps) {
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    // Parse numeric part
    const numericMatch = value.match(/^([\d.]+)/);
    if (!numericMatch) {
      setDisplay(value);
      return;
    }

    const target = parseFloat(numericMatch[1]);
    const suffix = value.slice(numericMatch[1].length);
    const duration = 600;
    const steps = 20;
    const stepTime = duration / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = target * eased;

      if (step >= steps) {
        setDisplay(value);
        clearInterval(timer);
      } else {
        const formatted = target >= 10
          ? Math.round(current).toString()
          : current.toFixed(1);
        setDisplay(formatted + suffix);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [value]);

  return <span className={className}>{display}</span>;
}
