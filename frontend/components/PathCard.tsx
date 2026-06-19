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
    <div className="border border-border-dim bg-surface/50 backdrop-blur-md p-6 flex flex-col gap-4 relative transition-all duration-300 hover:border-border-bright/40">
      {/* Visual cybernetic corner accent lines */}
      <div className="absolute top-0 left-0 w-2 h-[1px] bg-border-bright" />
      <div className="absolute top-0 left-0 w-[1px] h-2 bg-border-bright" />
      <div className="absolute bottom-0 right-0 w-2 h-[1px] bg-border-bright" />
      <div className="absolute bottom-0 right-0 w-[1px] h-2 bg-border-bright" />

      <h2 className="font-mono text-xs tracking-widest text-border-bright flex items-center gap-2">
        <span className="bg-border-bright/10 text-border-bright px-1.5 py-0.5 text-[9px] font-bold">
          PATH {String(index + 1).padStart(2, "0")}
        </span>
        <span className="truncate uppercase font-bold">{path.title}</span>
      </h2>
      
      <p className="text-xs text-gray-400 leading-relaxed font-sans">{path.summary}</p>

      {/* Metrics Section */}
      <div className="border-t border-border-dim/60 pt-4">
        <p className="font-mono text-[9px] tracking-widest text-gray-500 mb-3 uppercase">QUANTIFIED METRICS</p>
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
        <p className="font-mono text-[9px] tracking-widest text-gray-500 mb-3 uppercase">TIMELINE PROJECTION</p>
        <div className="space-y-2.5">
          {(["year_1", "year_3", "year_5"] as const).map((y) => (
            <div key={y} className="flex gap-3 text-xs leading-normal">
              <span className="font-bold text-accent tracking-widest w-16 shrink-0 uppercase text-[10px]">
                {y.replace("_", " ")}:
              </span>
              <span className="text-gray-300 font-sans text-xs">{path.timeline[y]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Hidden Tradeoffs Section */}
      <div className="border-t border-border-dim/60 pt-4">
        <p className="font-mono text-[9px] tracking-widest text-gray-500 mb-2 uppercase">HIDDEN TRADEOFFS</p>
        <ul className="space-y-2 text-xs">
          {path.hidden_tradeoffs.map((t, i) => (
            <li key={i} className="flex gap-2 items-start text-gray-300">
              <span className="text-danger font-mono font-bold shrink-0">[!]</span>
              <span className="font-sans leading-relaxed">{t}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t border-border-dim/60 pt-4 mt-auto">
        <button
          onClick={() => setShowWhatIf((v) => !v)}
          className={`w-full border px-4 py-2 font-mono text-[10px] tracking-widest transition-all duration-300 ${
            showWhatIf 
              ? "border-accent bg-accent/10 text-accent" 
              : "border-gray-500 text-gray-400 hover:border-white hover:text-white"
          }`}
        >
          {showWhatIf ? "CLOSE BRANCH ENGINE" : "SIMULATE WHAT-IF BRANCH →"}
        </button>
      </div>

      {showWhatIf && <WhatIfExplorer parentPath={path} />}
    </div>
  );
}
