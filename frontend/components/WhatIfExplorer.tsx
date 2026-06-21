"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Path, useDecisionStore } from "@/store/decisionStore";
import { PathCard } from "./PathCard";
import { LoadingSkeleton } from "./LoadingSkeleton";
import { ErrorBlock } from "./ui/ErrorBlock";

interface WhatIfExplorerProps {
  parentPath: Path;
  parentColor?: string;
}

export function WhatIfExplorer({ parentPath, parentColor = "#34908B" }: WhatIfExplorerProps) {
  const { session_id, branches, addBranch, config } = useDecisionStore();
  const [scenario, setScenario] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const childPaths = branches[parentPath.path_id] ?? [];

  async function handleSubmit() {
    if (!scenario.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/explore_whatif", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id,
          original_path: parentPath,
          what_if_scenario: scenario,
          config,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.detail ?? "Unknown error");
      }
      const data = await res.json();
      addBranch(parentPath.path_id, data.modified_path);
      setScenario("");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="border-l-2 pl-4 mt-2 space-y-4 overflow-hidden"
      style={{ borderLeftColor: `${parentColor}60` }}
    >
      {/* Scenario input */}
      <div className="space-y-2">
        <p
          className="font-mono text-[9px] uppercase tracking-widest font-bold"
          style={{ color: parentColor }}
        >
          WHAT-IF BRANCH ENGINE
        </p>
        <div className="flex gap-2">
          <input
            value={scenario}
            onChange={(e) => setScenario(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="What if I negotiated a higher salary first..."
            className="flex-1 bg-bg border border-border-dim px-3 py-2.5 font-sans text-xs focus:outline-none text-main placeholder-muted/50 transition-all duration-300 rounded-xl"
            style={{ 
              borderColor: scenario ? `${parentColor}60` : undefined,
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = `${parentColor}80`; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = ""; }}
          />
          <button
            onClick={handleSubmit}
            disabled={loading || !scenario.trim()}
            className="border-2 px-4 py-2.5 font-mono text-[10px] font-bold tracking-widest transition-all duration-300 disabled:opacity-35 rounded-xl hover:text-white hover:scale-[1.03] active:scale-95"
            style={{
              borderColor: parentColor,
              color: parentColor,
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = parentColor; (e.currentTarget as HTMLButtonElement).style.color = "white"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = ""; (e.currentTarget as HTMLButtonElement).style.color = parentColor; }}
          >
            GO →
          </button>
        </div>
      </div>

      {loading && <LoadingSkeleton rows={2} />}
      {error && <ErrorBlock message={error} />}

      {/* Empty state */}
      {!loading && childPaths.length === 0 && (
        <div className="border border-dashed border-border-dim/60 rounded-xl p-4 text-center space-y-1">
          <p className="font-mono text-[9px] text-muted uppercase tracking-widest font-bold">No branches simulated yet</p>
          <p className="font-sans text-xs text-muted/70">
            Enter a what-if scenario above and press Go to explore a modified version of this path.
          </p>
        </div>
      )}

      <AnimatePresence>
        {childPaths.map((child, i) => (
          <motion.div
            key={child.path_id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
            className="mt-2"
          >
            <PathCard path={child} index={i} parentMetrics={parentPath.metrics} />
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
