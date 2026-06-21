"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDecisionStore, HistoryEntry } from "@/store/decisionStore";
import { useRouter } from "next/navigation";

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

function formatDate(ts: number) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(ts));
}

function truncate(str: string, n: number) {
  return str.length > n ? str.slice(0, n) + "…" : str;
}

export function HistoryDrawer({ isOpen, onClose }: HistoryDrawerProps) {
  const { history, loadFromHistory, deleteFromHistory } = useDecisionStore();
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function handleLoad(entry: HistoryEntry) {
    loadFromHistory(entry.id);
    onClose();
    router.push("/matrix");
  }

  function handleDelete(id: string) {
    setDeletingId(id);
    setTimeout(() => {
      deleteFromHistory(id);
      setDeletingId(null);
    }, 300);
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            key="drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 35 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-bg border-l border-border-dim shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border-dim/60 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-1.5 h-4 bg-accent rounded-full" />
                <span className="font-mono text-[11px] font-bold text-main uppercase tracking-widest">
                  Decision History
                </span>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg border border-border-dim hover:border-accent hover:text-accent text-muted flex items-center justify-center font-bold text-sm transition-all duration-200"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-16">
                  <div className="w-12 h-12 rounded-2xl border border-border-dim bg-surface flex items-center justify-center text-xl">
                    📋
                  </div>
                  <div className="space-y-1">
                    <p className="font-mono text-[10px] font-bold text-muted uppercase tracking-widest">
                      No saved simulations
                    </p>
                    <p className="text-[11px] text-muted/60 font-sans leading-relaxed max-w-[200px]">
                      After running a simulation, click "Save" in the matrix page header.
                    </p>
                  </div>
                </div>
              ) : (
                history.map((entry) => (
                  <AnimatePresence key={entry.id}>
                    {deletingId !== entry.id && (
                      <motion.div
                        initial={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 60 }}
                        transition={{ duration: 0.25 }}
                        className="border border-border-dim/60 bg-surface/70 rounded-xl p-4 space-y-3 group hover:border-accent/40 transition-all duration-200"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span
                                className={`font-mono text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                                  entry.decisionMode === "short_term"
                                    ? "text-[#C2963E] border-[#C2963E40] bg-[#C2963E0D]"
                                    : "text-accent border-accent/30 bg-accent/8"
                                }`}
                              >
                                {entry.decisionMode === "short_term" ? "⚡ Short" : "🔭 Long"}
                              </span>
                              <span className="font-mono text-[9px] text-muted/60">
                                {formatDate(entry.timestamp)}
                              </span>
                            </div>
                            <p className="text-[11px] text-main font-sans leading-snug font-medium">
                              {truncate(entry.dilemma, 100)}
                            </p>
                            <div className="flex gap-1.5 flex-wrap mt-1">
                              {entry.paths.map((p, i) => {
                                const colors = ["#34908B", "#4A7FC1", "#7C5CBF"];
                                return (
                                  <span
                                    key={p.path_id}
                                    className="font-mono text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border"
                                    style={{
                                      color: colors[i] ?? "#34908B",
                                      borderColor: `${colors[i] ?? "#34908B"}40`,
                                      background: `${colors[i] ?? "#34908B"}0D`,
                                    }}
                                  >
                                    {p.title.length > 18 ? p.title.slice(0, 18) + "…" : p.title}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-1 border-t border-border-dim/40">
                          <button
                            onClick={() => handleLoad(entry)}
                            className="flex-1 font-mono text-[9px] font-bold uppercase tracking-widest border border-accent bg-accent/10 text-accent hover:bg-accent hover:text-white px-3 py-1.5 rounded-lg transition-all duration-200"
                          >
                            Load →
                          </button>
                          <button
                            onClick={() => handleDelete(entry.id)}
                            className="font-mono text-[9px] font-bold uppercase tracking-widest border border-border-dim text-muted hover:border-danger hover:text-danger px-3 py-1.5 rounded-lg transition-all duration-200"
                          >
                            Delete
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                ))
              )}
            </div>

            {/* Footer */}
            {history.length > 0 && (
              <div className="shrink-0 border-t border-border-dim/40 px-5 py-3">
                <p className="font-mono text-[9px] text-muted/50 uppercase tracking-widest text-center">
                  {history.length} simulation{history.length !== 1 ? "s" : ""} saved · Up to 20 stored locally
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
