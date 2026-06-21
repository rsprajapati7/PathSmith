"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Path, DecisionMode, Recommendation } from "@/store/decisionStore";

interface ComparePanelProps {
  paths: Path[];
  selectedIds: string[];
  recommendedId?: string;
  decisionMode: DecisionMode;
  onClose: () => void;
}

const PATH_COLORS = ["#34908B", "#4A7FC1", "#7C5CBF"];
const METRIC_KEYS = ["financial_stability", "personal_growth", "risk_level", "time_commitment"] as const;
const METRIC_LABELS: Record<string, string> = {
  financial_stability: "Financial Stability",
  personal_growth: "Personal Growth",
  risk_level: "Risk Level",
  time_commitment: "Time Commitment",
};

function MetricDelta({ val, other, color }: { val: number; other: number; color: string }) {
  const delta = val - other;
  const absD = Math.abs(delta);
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex-1 h-1.5 bg-border-dim rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${val * 10}%`, background: color }}
        />
      </div>
      <span className="font-mono text-[10px] font-bold w-8 text-right" style={{ color }}>
        {val}/10
      </span>
      {delta !== 0 && (
        <span
          className="font-mono text-[9px] font-bold w-10 text-right"
          style={{ color: delta > 0 ? "#34908B" : "#BE123C" }}
        >
          {delta > 0 ? `▲ +${absD}` : `▼ −${absD}`}
        </span>
      )}
      {delta === 0 && (
        <span className="font-mono text-[9px] text-muted/50 w-10 text-right">= tie</span>
      )}
    </div>
  );
}

export function ComparePanel({ paths, selectedIds, recommendedId, decisionMode, onClose }: ComparePanelProps) {
  const selected = selectedIds
    .map((id) => paths.find((p) => p.path_id === id))
    .filter(Boolean) as Path[];

  if (selected.length < 2) return null;

  const [pathA, pathB] = selected;
  const colorA = PATH_COLORS[paths.indexOf(pathA)] ?? PATH_COLORS[0];
  const colorB = PATH_COLORS[paths.indexOf(pathB)] ?? PATH_COLORS[1];
  const isShortTerm = decisionMode === "short_term";

  return (
    <AnimatePresence>
      <motion.div
        key="compare-overlay"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ type: "spring", stiffness: 200, damping: 28 }}
        className="fixed inset-0 z-50 bg-bg/95 backdrop-blur-xl overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-border-dim/60 glass px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-5 bg-accent rounded-full" />
            <span className="font-mono text-[11px] font-bold text-main uppercase tracking-widest">
              Path Comparison
            </span>
            <span className="font-mono text-[9px] text-muted/60 uppercase tracking-widest hidden sm:inline">
              · Side-by-Side Analysis
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl border border-border-dim hover:border-danger hover:bg-danger/5 flex items-center justify-center text-muted hover:text-danger transition-all duration-200 font-bold text-sm"
          >
            ✕
          </button>
        </div>

        <div className="max-w-5xl mx-auto p-6 md:p-8">
          {/* Path header row */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {[pathA, pathB].map((path, idx) => {
              const color = idx === 0 ? colorA : colorB;
              const isRec = path.path_id === recommendedId;
              return (
                <div
                  key={path.path_id}
                  className="border rounded-2xl p-4 relative overflow-hidden"
                  style={{ borderColor: `${color}40`, background: `${color}08` }}
                >
                  <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: `linear-gradient(to right, ${color}, transparent)` }} />
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <span className="font-mono text-[9px] font-bold uppercase tracking-widest" style={{ color }}>
                        PATH 0{paths.indexOf(path) + 1}
                      </span>
                      <h3 className="font-mono text-sm font-bold text-main uppercase tracking-wide mt-0.5">
                        {path.title}
                      </h3>
                    </div>
                    {isRec && (
                      <span
                        className="font-mono text-[8px] font-bold uppercase tracking-widest px-2 py-1 rounded-full border flex items-center gap-1"
                        style={{ color, borderColor: `${color}50`, background: `${color}15` }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: color }} />
                        ✦ AI Pick
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted font-sans leading-relaxed mt-2">{path.summary}</p>
                </div>
              );
            })}
          </div>

          {/* Metrics Comparison */}
          <div className="border border-border-dim/50 bg-surface/60 rounded-2xl overflow-hidden mb-4">
            <div className="px-5 py-3 border-b border-border-dim/40 bg-surface/40">
              <span className="font-mono text-[9px] font-bold text-muted uppercase tracking-widest">
                Quantified Metrics — Head to Head
              </span>
            </div>
            <div className="p-5 space-y-5">
              {METRIC_KEYS.map((key) => {
                const valA = pathA.metrics[key];
                const valB = pathB.metrics[key];
                return (
                  <div key={key}>
                    <p className="font-mono text-[9px] text-muted uppercase tracking-widest font-bold mb-2">
                      {METRIC_LABELS[key]}
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <MetricDelta val={valA} other={valB} color={colorA} />
                      <MetricDelta val={valB} other={valA} color={colorB} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pros/Cons Split */}
          {((pathA.pros && pathA.pros.length > 0) || (pathB.pros && pathB.pros.length > 0)) && (
            <div className="border border-border-dim/50 bg-surface/60 rounded-2xl overflow-hidden mb-4">
              <div className="px-5 py-3 border-b border-border-dim/40 bg-surface/40">
                <span className="font-mono text-[9px] font-bold text-muted uppercase tracking-widest">
                  Pros & Cons Comparison
                </span>
              </div>
              <div className="grid grid-cols-2 divide-x divide-border-dim/40">
                {[pathA, pathB].map((path, idx) => {
                  const color = idx === 0 ? colorA : colorB;
                  return (
                    <div key={path.path_id} className="p-5 space-y-4">
                      {path.pros && path.pros.length > 0 && (
                        <div>
                          <p className="font-mono text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: "#34908B" }}>
                            ▲ Pros
                          </p>
                          <ul className="space-y-1.5">
                            {path.pros.map((pro, i) => (
                              <li key={i} className="flex items-start gap-1.5 text-[11px] text-muted font-sans">
                                <span className="text-[#34908B] font-bold shrink-0">+</span>
                                {pro}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {path.cons && path.cons.length > 0 && (
                        <div>
                          <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-danger mb-2">▼ Cons</p>
                          <ul className="space-y-1.5">
                            {path.cons.map((con, i) => (
                              <li key={i} className="flex items-start gap-1.5 text-[11px] text-muted font-sans">
                                <span className="text-danger font-bold shrink-0">−</span>
                                {con}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Timeline Comparison */}
          <div className="border border-border-dim/50 bg-surface/60 rounded-2xl overflow-hidden mb-4">
            <div className="px-5 py-3 border-b border-border-dim/40 bg-surface/40">
              <span className="font-mono text-[9px] font-bold text-muted uppercase tracking-widest">
                {isShortTerm ? "Near-Term Outlook (6–12 Months)" : "Timeline Projection"}
              </span>
            </div>
            <div className="grid grid-cols-2 divide-x divide-border-dim/40">
              {[pathA, pathB].map((path, idx) => {
                const color = idx === 0 ? colorA : colorB;
                const years = isShortTerm
                  ? (["year_1"] as const)
                  : (["year_1", "year_3", "year_5"] as const);
                return (
                  <div key={path.path_id} className="p-5 space-y-3">
                    {years.map((y) => (
                      <div key={y} className="flex gap-2 items-start">
                        <span className="font-mono font-bold tracking-widest w-14 shrink-0 uppercase text-[9px] pt-[1px]" style={{ color }}>
                          {y.replace("_", " ")}:
                        </span>
                        <span className="text-muted font-sans text-[11px] leading-relaxed">{path.timeline[y]}</span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Hidden Tradeoffs */}
          <div className="border border-border-dim/50 bg-surface/60 rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-border-dim/40 bg-surface/40">
              <span className="font-mono text-[9px] font-bold text-muted uppercase tracking-widest">
                Hidden Tradeoffs
              </span>
            </div>
            <div className="grid grid-cols-2 divide-x divide-border-dim/40">
              {[pathA, pathB].map((path) => (
                <div key={path.path_id} className="p-5 space-y-2">
                  {path.hidden_tradeoffs.map((t, i) => (
                    <div key={i} className="flex gap-2 items-start text-muted">
                      <span className="text-danger font-mono font-bold text-[10px] shrink-0">[!]</span>
                      <span className="font-sans text-[11px] leading-relaxed">{t}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
