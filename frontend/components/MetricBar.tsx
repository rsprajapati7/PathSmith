import React from "react";

interface MetricBarProps {
  label: string;
  value: number;       // 1-10
  previous?: number;   // for highlighting changes in what-if branches
}

export function MetricBar({ label, value, previous }: MetricBarProps) {
  const changed = previous !== undefined && previous !== value;
  const decreased = previous !== undefined && value < previous;

  // Curated color configurations based on delta state
  let labelColor = "text-gray-400";
  let activeSegClass = "bg-white";
  let borderClass = "border-border-dim";
  let deltaText = "";

  if (changed && previous !== undefined) {
    const diff = value - previous;
    const sign = diff > 0 ? "+" : "";
    deltaText = ` (${sign}${diff})`;
    
    if (decreased) {
      labelColor = "text-danger";
      activeSegClass = "bg-danger";
      borderClass = "border-danger shadow-[0_0_8px_rgba(244,63,94,0.3)]";
    } else {
      labelColor = "text-accent";
      activeSegClass = "bg-accent";
      borderClass = "border-accent shadow-[0_0_8px_rgba(6,182,212,0.3)]";
    }
  }

  return (
    <div className="font-mono text-xs mb-3">
      <div className="flex justify-between mb-1.5 items-center">
        <span className="text-[10px] tracking-widest text-gray-500 uppercase">{label.toUpperCase()}</span>
        <span className={`text-[11px] font-bold ${changed ? (decreased ? "text-danger" : "text-accent") : "text-white"}`}>
          {value}/10{deltaText}
        </span>
      </div>
      <div
        className={`border h-5 w-full flex p-[2px] transition-all duration-300 ${borderClass}`}
      >
        {Array.from({ length: 10 }).map((_, i) => {
          const isActive = i < value;
          const wasActive = previous !== undefined && i < previous;
          
          let segColor = "bg-transparent";
          if (isActive) {
            segColor = activeSegClass;
          }

          // Special styling for changed segments
          let segBorder = "border-r border-border-dim/30";
          if (i === 9) segBorder = "";

          return (
            <div
              key={i}
              className={`flex-1 transition-all duration-300 ${segColor} ${segBorder} h-full`}
            />
          );
        })}
      </div>
    </div>
  );
}
