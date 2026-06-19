"use client";
import React, { useState, useEffect } from "react";

export function LoadingSkeleton({ rows = 3 }: { rows?: number }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 98) return 98;
        return prev + Math.floor(Math.random() * 4) + 2;
      });
    }, 250);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="animate-pulse space-y-3.5 my-4">
      <div className="flex justify-between items-center text-[10px] font-mono text-accent font-bold uppercase tracking-widest">
        <div className="flex items-center space-x-2.5">
          <div className="w-2 h-2 bg-accent rounded-full animate-ping" />
          <span>loading...</span>
        </div>
        <span className="text-muted font-mono text-[10px] tabular-nums">{progress}%</span>
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div 
          key={i} 
          className="h-5 bg-surface/60 border border-border-dim/40 w-full flex items-center px-4 rounded-full"
          style={{ animationDelay: `${i * 0.15}s` }}
        >
          <div 
            className="h-1.5 bg-gradient-to-r from-accent/40 via-accent/15 to-transparent w-3/4 rounded-full animate-pulse"
            style={{ animationDuration: "1.5s" }}
          />
        </div>
      ))}
    </div>
  );
}
