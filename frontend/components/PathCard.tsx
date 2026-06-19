"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Path, DecisionMode } from "@/store/decisionStore";
import { MetricBar } from "./MetricBar";
import { WhatIfExplorer } from "./WhatIfExplorer";

interface PathCardProps {
  path: Path;
  index: number;
  parentMetrics?: Path["metrics"];
  decisionMode?: DecisionMode;
  isRecommended?: boolean;
}

// Per-path color accents
const PATH_COLORS = ["#34908B", "#4A7FC1", "#7C5CBF"];
const PATH_LABELS = ["PATH 01", "PATH 02", "PATH 03"];

export function PathCard({ path, index, parentMetrics, decisionMode = "long_term", isRecommended = false }: PathCardProps) {
  const [showWhatIf, setShowWhatIf] = useState(false);
  const color = PATH_COLORS[index % PATH_COLORS.length] || "#34908B";
  const isShortTerm = decisionMode === "short_term";

  return (
    <div
      className="border border-border-dim/60 bg-surface shadow-sm hover:shadow-lg p-6 flex flex-col gap-5 relative transition-all duration-350 hover:border-opacity-60 rounded-2xl overflow-hidden group"
      style={{
        borderLeftColor: isRecommended ? color : undefined,
        borderLeftWidth: isRecommended ? "3px" : undefined,
        boxShadow: isRecommended
          ? `0 2px 12px rgba(0,0,0,0.04), 0 0 0 1px ${color}22`
          : `0 2px 12px rgba(0,0,0,0.04)`,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 32px rgba(0,0,0,0.07), 0 0 0 1px ${color}22`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = isRecommended
          ? `0 2px 12px rgba(0,0,0,0.04), 0 0 0 1px ${color}22`
          : `0 2px 12px rgba(0,0,0,0.04)`;
      }}
    >
      {/* Top accent gradient */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] opacity-60 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: `linear-gradient(to right, ${color}, transparent)` }}
      />

      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span
            className="font-mono text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border"
            style={{ color, borderColor: `${color}40`, background: `${color}0D` }}
          >
            {PATH_LABELS[index % PATH_LABELS.length] || `PATH 0${index + 1}`}
          </span>

          <div className="flex items-center gap-2 flex-wrap">
            {isRecommended && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="font-mono text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border flex items-center gap-1.5"
                style={{ color, borderColor: `${color}50`, background: `${color}15` }}
              >
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: color }} />
                ✦ AI Recommended
              </motion.span>
            )}
            {parentMetrics && (
              <span className="font-mono text-[9px] text-muted bg-surface border border-border-dim/60 px-2 py-0.5 rounded-full">
                BRANCH
              </span>
            )}
            {isShortTerm && (
              <span
                className="font-mono text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border"
                style={{ color: "#C2963E", borderColor: "#C2963E40", background: "#C2963E0D" }}
              >
                Short Term
              </span>
            )}
          </div>
        </div>
        <h2 className="font-mono text-sm font-bold text-main uppercase tracking-wide">
          {path.title}
        </h2>
      </div>

      <p className="text-xs text-muted leading-relaxed font-sans -mt-1">{path.summary}</p>

      {/* Metrics Section */}
      <div className="border-t border-border-dim/50 pt-4 space-y-0.5">
        <p className="font-mono text-[9px] tracking-widest text-muted mb-3 uppercase font-bold">
          QUANTIFIED METRICS
        </p>
        {(Object.entries(path.metrics) as [keyof Path["metrics"], number][]).map(([key, val], i) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.07, duration: 0.35 }}
          >
            <MetricBar
              label={key.replace(/_/g, " ")}
              value={val}
              previous={parentMetrics?.[key]}
              accentColor={color}
            />
          </motion.div>
        ))}
      </div>

      {/* Pros & Cons — always shown if available */}
      {((path.pros && path.pros.length > 0) || (path.cons && path.cons.length > 0)) && (
        <div className="border-t border-border-dim/50 pt-4 grid grid-cols-2 gap-4">
          {path.pros && path.pros.length > 0 && (
            <div className="space-y-2">
              <p className="font-mono text-[9px] tracking-widest font-bold" style={{ color: "#34908B" }}>
                ▲ PROS
              </p>
              <ul className="space-y-1.5">
                {path.pros.map((pro, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.07 }}
                    className="flex items-start gap-1.5 text-[11px] text-muted font-sans leading-snug"
                  >
                    <span className="text-[#34908B] font-bold shrink-0 mt-[1px]">+</span>
                    {pro}
                  </motion.li>
                ))}
              </ul>
            </div>
          )}
          {path.cons && path.cons.length > 0 && (
            <div className="space-y-2">
              <p className="font-mono text-[9px] tracking-widest font-bold text-danger">
                ▼ CONS
              </p>
              <ul className="space-y-1.5">
                {path.cons.map((con, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.07 }}
                    className="flex items-start gap-1.5 text-[11px] text-muted font-sans leading-snug"
                  >
                    <span className="text-danger font-bold shrink-0 mt-[1px]">−</span>
                    {con}
                  </motion.li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Timeline Section — full in long term, year_1 only in short term */}
      <div className="border-t border-border-dim/50 pt-4">
        <p className="font-mono text-[9px] tracking-widest text-muted mb-3 uppercase font-bold">
          {isShortTerm ? "NEAR-TERM OUTLOOK (6–12 MONTHS)" : "TIMELINE PROJECTION"}
        </p>
        <div className="space-y-3">
          {isShortTerm ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex gap-3 items-start"
            >
              <span
                className="font-mono font-bold tracking-widest w-16 shrink-0 uppercase text-[9px] pt-[1px]"
                style={{ color }}
              >
                Year 1:
              </span>
              <span className="text-muted font-sans text-xs leading-relaxed">{path.timeline.year_1}</span>
            </motion.div>
          ) : (
            (["year_1", "year_3", "year_5"] as const).map((y, i) => (
              <motion.div
                key={y}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 + i * 0.08 }}
                className="flex gap-3 items-start"
              >
                <span
                  className="font-mono font-bold tracking-widest w-16 shrink-0 uppercase text-[9px] pt-[1px]"
                  style={{ color }}
                >
                  {y.replace("_", " ")}:
                </span>
                <span className="text-muted font-sans text-xs leading-relaxed">{path.timeline[y]}</span>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Hidden Tradeoffs Section */}
      <div className="border-t border-border-dim/50 pt-4">
        <p className="font-mono text-[9px] tracking-widest text-muted mb-3 uppercase font-bold">
          HIDDEN TRADEOFFS
        </p>
        <ul className="space-y-2">
          {path.hidden_tradeoffs.map((t, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.07 }}
              className="flex gap-2.5 items-start text-muted"
            >
              <span className="text-danger font-mono font-bold text-[10px] shrink-0 mt-[1px]">[!]</span>
              <span className="font-sans text-xs leading-relaxed">{t}</span>
            </motion.li>
          ))}
        </ul>
      </div>

      {/* What-If Toggle — only in long term mode */}
      {!isShortTerm && (
        <div className="border-t border-border-dim/50 pt-4 mt-auto">
          <button
            onClick={() => setShowWhatIf((v) => !v)}
            className={`w-full border px-4 py-2.5 font-mono text-[10px] tracking-widest transition-all duration-300 rounded-xl font-bold flex items-center justify-center gap-2 group/btn ${
              showWhatIf
                ? "border-accent bg-accent/10 text-accent"
                : "border-border-dim text-muted hover:border-accent hover:text-accent hover:bg-accent/5"
            }`}
          >
            <span>{showWhatIf ? "CLOSE BRANCH ENGINE" : "SIMULATE WHAT-IF BRANCH"}</span>
            <span
              className={`text-sm transition-transform duration-300 ${showWhatIf ? "rotate-90" : "group-hover/btn:translate-x-0.5"}`}
            >
              →
            </span>
          </button>
        </div>
      )}

      {!isShortTerm && showWhatIf && <WhatIfExplorer parentPath={path} parentColor={color} />}
    </div>
  );
}
