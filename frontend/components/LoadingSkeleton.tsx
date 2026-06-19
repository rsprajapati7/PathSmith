"use client";
import React, { useState, useEffect } from "react";

const MESSAGES = [
  "DECRYPTING DILEMMA SYNTAX...",
  "EXTRACTING COGNITIVE FALLACIES...",
  "FLAGGING CONTEXTUAL BIASES...",
  "MAPPING VALUE CONSTRAINTS...",
  "CALCULATING FUTURE RISK VECTORS...",
  "SIMULATING YEAR 1 TIMELINES...",
  "SIMULATING YEAR 3 TIMELINES...",
  "SIMULATING YEAR 5 TIMELINES...",
  "COMPUTING PATH METRICS MATRIX...",
  "RESOLVING SCENARIO NODE DEPTH..."
];

export function LoadingSkeleton({ rows = 3 }: { rows?: number }) {
  const [msgIndex, setMsgIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % MESSAGES.length);
    }, 800);
    return () => clearInterval(interval);
  }, []);

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
          <span>{MESSAGES[msgIndex]}</span>
        </div>
        <span className="text-gray-400 font-mono text-[10px] tabular-nums">{progress}%</span>
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div 
          key={i} 
          className="h-5 bg-surface/30 border border-border-dim/40 w-full flex items-center px-4 rounded-full"
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
