import React, { useEffect, useState } from "react";

interface MetricBarProps {
  label: string;
  value: number;       // 1-10
  previous?: number;   // for highlighting changes in what-if branches
  accentColor?: string; // per-path accent color
}

export function MetricBar({ label, value, previous, accentColor = "#34908B" }: MetricBarProps) {
  const [animatedValue, setAnimatedValue] = useState(0);

  // Animate fill-in on mount
  useEffect(() => {
    const timer = setTimeout(() => setAnimatedValue(value), 80);
    return () => clearTimeout(timer);
  }, [value]);

  const changed = previous !== undefined && previous !== value;
  const decreased = previous !== undefined && value < previous;

  let activeColor = accentColor;
  let borderStyle: React.CSSProperties = {};
  let deltaText = "";

  if (changed && previous !== undefined) {
    const diff = value - previous;
    const sign = diff > 0 ? "+" : "";
    deltaText = ` (${sign}${diff})`;

    if (decreased) {
      activeColor = "#BE123C";
      borderStyle = { borderColor: "#BE123C60", boxShadow: "0 0 8px rgba(190,18,60,0.2)" };
    } else {
      borderStyle = { borderColor: `${accentColor}60`, boxShadow: `0 0 8px ${accentColor}22` };
    }
  }

  const isRisk = label.toLowerCase().includes("risk");
  const displayColor = isRisk && !changed ? "#BE123C" : activeColor;

  return (
    <div className="font-mono text-xs mb-3.5">
      <div className="flex justify-between mb-1.5 items-center">
        <span className="text-[9px] tracking-widest text-muted uppercase font-bold">{label.toUpperCase()}</span>
        <span
          className="text-[11px] font-bold tabular-nums"
          style={{ color: changed ? (decreased ? "#BE123C" : accentColor) : displayColor }}
        >
          {value}/10{deltaText}
        </span>
      </div>
      <div
        className="border h-5 w-full flex p-[2.5px] transition-all duration-300 rounded-full overflow-hidden"
        style={{ borderColor: changed ? (decreased ? "#BE123C40" : `${accentColor}40`) : "rgba(216,206,149,0.8)", ...borderStyle }}
      >
        {Array.from({ length: 10 }).map((_, i) => {
          const isActive = i < animatedValue;
          return (
            <div
              key={i}
              className="flex-1 h-full rounded-full mx-[1px] transition-all"
              style={{
                background: isActive ? displayColor : "transparent",
                transitionDuration: `${200 + i * 45}ms`,
                transitionDelay: `${i * 35}ms`,
                opacity: isActive ? (i < (animatedValue - 0.5) ? 1 : 0.7) : 0,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
