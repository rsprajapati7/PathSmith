"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Path, useDecisionStore } from "@/store/decisionStore";
import { PathCard } from "./PathCard";
import { LoadingSkeleton } from "./LoadingSkeleton";
import { ErrorBlock } from "./ui/ErrorBlock";

export function WhatIfExplorer({ parentPath }: { parentPath: Path }) {
  const { session_id, branches, addBranch } = useDecisionStore();
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
      className="ml-4 md:ml-6 border-l border-accent/40 pl-4 mt-4 space-y-4"
    >
      <div className="flex gap-2">
        <input
          value={scenario}
          onChange={(e) => setScenario(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="What if I..."
          className="flex-1 bg-transparent border border-border-dim px-3 py-2 font-mono text-xs focus:border-accent outline-none text-white placeholder-gray-600 transition-all duration-300"
        />
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="border border-accent px-4 py-2 font-mono text-xs text-accent hover:bg-accent hover:text-black transition-colors duration-300 disabled:opacity-40"
        >
          SIMULATE →
        </button>
      </div>

      {loading && <LoadingSkeleton rows={2} />}
      {error && <ErrorBlock message={error} />}

      <AnimatePresence>
        {childPaths.map((child, i) => (
          <motion.div
            key={child.path_id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="mt-4"
          >
            <PathCard path={child} index={i} parentMetrics={parentPath.metrics} />
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
