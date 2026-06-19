import React from "react";

export function LoadingSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="animate-pulse space-y-3 my-4">
      <div className="flex items-center space-x-2">
        <div className="w-2 h-2 bg-accent animate-ping" />
        <span className="text-[10px] font-mono text-accent tracking-widest uppercase">
          ANALYSING DATA STREAM...
        </span>
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div 
          key={i} 
          className="h-5 bg-surface border border-border-dim w-full flex items-center px-3"
          style={{ animationDelay: `${i * 0.15}s` }}
        >
          <div className="h-1 bg-border-dim w-3/4 rounded-sm animate-pulse" />
        </div>
      ))}
    </div>
  );
}
