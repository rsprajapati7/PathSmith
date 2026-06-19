"use client";
import React, { useState } from "react";
import { Path } from "@/store/decisionStore";
import { MetricBar } from "./MetricBar";
import { WhatIfExplorer } from "./WhatIfExplorer";

interface PathCardProps {
  path: Path;
  index: number;
  parentMetrics?: Path["metrics"];  // used to highlight changed metrics in branches
}

export function PathCard({ path, index, parentMetrics }: PathCardProps) {
  const [showWhatIf, setShowWhatIf] = useState(false);

  return (
    <div className="border border-border-dim/60 bg-surface shadow-sm hover:shadow-md p-6 flex flex-col gap-4 relative transition-all duration-300 hover:border-accent/40 rounded-xl">


      <h2 className="font-mono text-xs tracking-widest text-accent flex items-center gap-2">
        <span className="bg-accent/10 text-accent px-2.5 py-0.5 text-[9px] font-bold rounded-full">
          PATH {String(index + 1).padStart(2, "0")}
        </span>
        <span className="truncate uppercase font-bold">{path.title}</span>
      </h2>
      
      <p className="text-xs text-muted leading-relaxed font-sans">{path.summary}</p>

      {/* Metrics Section */}
      <div className="border-t border-border-dim/60 pt-4">
        <p className="font-mono text-[9px] tracking-widest text-muted mb-3 uppercase font-bold">QUANTIFIED METRICS</p>
        {(Object.entries(path.metrics) as [keyof Path["metrics"], number][]).map(
          ([key, val]) => (
            <MetricBar
              key={key}
              label={key.replace(/_/g, " ")}
              value={val}
              previous={parentMetrics?.[key]}
            />
          )
        )}
      </div>

      {/* Timeline Section */}
      <div className="border-t border-border-dim/60 pt-4 font-mono">
        <p className="font-mono text-[9px] tracking-widest text-muted mb-3 uppercase font-bold">TIMELINE PROJECTION</p>
        <div className="space-y-2.5">
          {(["year_1", "year_3", "year_5"] as const).map((y) => (
            <div key={y} className="flex gap-3 text-xs leading-normal">
              <span className="font-bold text-accent tracking-widest w-16 shrink-0 uppercase text-[10px]">
                {y.replace("_", " ")}:
              </span>
              <span className="text-muted font-sans text-xs">{path.timeline[y]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Hidden Tradeoffs Section */}
      <div className="border-t border-border-dim/60 pt-4">
        <p className="font-mono text-[9px] tracking-widest text-muted mb-2 uppercase font-bold">HIDDEN TRADEOFFS</p>
        <ul className="space-y-2 text-xs">
          {path.hidden_tradeoffs.map((t, i) => (
            <li key={i} className="flex gap-2 items-start text-muted">
              <span className="text-danger font-mono font-bold shrink-0">[!]</span>
              <span className="font-sans leading-relaxed">{t}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t border-border-dim/60 pt-4 mt-auto">
        <button
          onClick={() => setShowWhatIf((v) => !v)}
          className={`w-full border px-4 py-2 font-mono text-[10px] tracking-widest transition-all duration-300 rounded-lg font-bold ${
            showWhatIf 
              ? "border-accent bg-accent/10 text-accent" 
              : "border-border-dim text-muted hover:border-accent hover:text-accent hover:bg-accent/5"
          }`}
        >
          {showWhatIf ? "CLOSE BRANCH ENGINE" : "SIMULATE WHAT-IF BRANCH →"}
        </button>
      </div>

      {showWhatIf && <WhatIfExplorer parentPath={path} />}
    </div>
  );
}
