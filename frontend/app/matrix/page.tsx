"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useDecisionStore } from "@/store/decisionStore";
import { PathCard } from "@/components/PathCard";

export default function MatrixPage() {
  const router = useRouter();
  const { paths, dilemma, reset } = useDecisionStore();

  // Redirect if no paths are generated
  useEffect(() => {
    if (!paths.length) {
      router.push("/");
    }
  }, [paths, router]);

  function handleRestart() {
    reset();
    router.push("/");
  }

  if (!paths.length) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center font-mono text-xs text-muted gap-4">
        <span>NO GENERATED SCENARIOS REGISTERED IN SYSTEM MEMORY.</span>
        <button 
          onClick={handleRestart}
          className="border border-border-dim px-4 py-2 hover:border-accent hover:text-accent hover:bg-accent/5 transition-colors rounded-xl font-bold font-mono"
        >
          REBOOT SESSION
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bg flex flex-col">
      <header className="border-b border-border-dim/80 bg-surface/80 backdrop-blur-md px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sticky top-0 z-20">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="w-1.5 h-1.5 bg-accent animate-pulse" />
            <h1 className="font-mono text-xs font-bold tracking-widest text-main uppercase">
              DECISION SIMULATION MATRIX
            </h1>
          </div>
          <p className="text-[11px] text-muted font-sans max-w-xl truncate italic">
            Dilemma: &ldquo;{dilemma}&rdquo;
          </p>
        </div>
        <button 
          onClick={handleRestart}
          className="font-mono text-[10px] tracking-widest border border-border-dim px-4 py-2 text-muted hover:text-accent hover:border-accent hover:bg-accent/5 transition-all duration-300 uppercase shrink-0 font-bold rounded-xl"
        >
          [!] RESET SESSION
        </button>
      </header>

      {/* Main Grid Comparison */}
      <div className="flex-1 p-6 md:p-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start"
        >
          {paths.map((path, i) => (
            <motion.div
              key={path.path_id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
            >
              <PathCard path={path} index={i} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </main>
  );
}
