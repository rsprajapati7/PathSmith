"use client";
import React, { useState, useEffect } from "react";

export function LoadingSkeleton({ rows = 3 }: { rows?: number }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Logarithmic curve — fast at first, then slows near 94
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 94) return prev;
        const remaining = 94 - prev;
        const increment = Math.max(1, Math.ceil(remaining * 0.12));
        return Math.min(94, prev + increment);
      });
    }, 280);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-3 my-4">
      {/* Header row */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2.5">
          <div className="relative">
            <div className="w-2.5 h-2.5 bg-accent rounded-full" />
            <div className="absolute inset-0 w-2.5 h-2.5 bg-accent rounded-full animate-ping-slow" />
          </div>
          <span className="font-mono text-[9px] text-accent font-bold uppercase tracking-widest">
            Processing
          </span>
        </div>
        <span className="font-mono text-[10px] text-muted tabular-nums font-bold">{progress}%</span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-border-dim rounded-full overflow-hidden">
        <div
          className="h-full bg-accent rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
