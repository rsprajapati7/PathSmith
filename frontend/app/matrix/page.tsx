"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useDecisionStore } from "@/store/decisionStore";
import { PathCard } from "@/components/PathCard";

export default function MatrixPage() {
  const router = useRouter();
  const { paths, dilemma, reset, config, setConfig } = useDecisionStore();
  const [showSettings, setShowSettings] = useState(false);

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
        <div className="flex items-center space-x-3 shrink-0">
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="w-9 h-9 border border-border-dim hover:border-accent flex items-center justify-center text-muted hover:text-accent transition-all duration-300 rounded-xl font-bold cursor-pointer"
            title="Configure LLM"
          >
            ⚙
          </button>
          <button 
            onClick={handleRestart}
            className="font-mono text-[10px] tracking-widest border border-border-dim px-4 py-2 text-muted hover:text-accent hover:border-accent hover:bg-accent/5 transition-all duration-300 uppercase font-bold rounded-xl h-9"
          >
            [!] RESET SESSION
          </button>
        </div>
      </header>

      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="border-b border-border-dim/80 bg-surface/50 px-6 py-4 overflow-hidden"
          >
            <div className="max-w-2xl space-y-4 font-mono text-[10px] text-muted">
              {/* Provider */}
              <div className="space-y-2">
                <label className="text-[9px] text-muted block uppercase font-bold">LLM Provider</label>
                <div className="grid grid-cols-3 gap-2">
                  {["openai", "gemini", "ollama"].map((p) => (
                    <button
                      key={p}
                      onClick={() => setConfig({ provider: p })}
                      className={`border p-2 text-[9px] font-bold tracking-wider uppercase transition-all duration-300 rounded-xl ${
                        config.provider === p
                          ? "border-accent bg-accent/10 text-accent font-bold"
                          : "border-border-dim text-muted hover:border-accent hover:text-accent bg-white"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Credentials conditional input */}
              {config.provider !== "ollama" ? (
                <div className="space-y-1">
                  <label className="text-[9px] text-muted block uppercase font-bold">
                    {config.provider.toUpperCase()} API Key
                  </label>
                  <input
                    type="password"
                    value={config.api_key || ""}
                    onChange={(e) => setConfig({ api_key: e.target.value })}
                    placeholder={
                      config.provider === "openai"
                        ? "sk-... (defaults to backend env if empty)"
                        : "AIzaSy... (defaults to backend env if empty)"
                    }
                    className="w-full bg-surface border border-border-dim px-3 py-2 text-main placeholder-muted/60 focus:outline-none focus:border-accent text-[10px] rounded-xl"
                  />
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-[9px] text-muted block uppercase font-bold">Ollama URL</label>
                  <input
                    type="text"
                    value={config.base_url || ""}
                    onChange={(e) => setConfig({ base_url: e.target.value })}
                    placeholder="http://localhost:11434/v1"
                    className="w-full bg-surface border border-border-dim px-3 py-2 text-main focus:outline-none focus:border-accent text-[10px] rounded-xl"
                  />
                </div>
              )}

              {/* Custom overrides */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] text-muted block uppercase font-bold">Fast Model</label>
                  <input
                    type="text"
                    value={config.model_fast || ""}
                    onChange={(e) => setConfig({ model_fast: e.target.value })}
                    placeholder={
                      config.provider === "openai"
                        ? "gpt-4o-mini"
                        : config.provider === "gemini"
                        ? "gemma-4-31b-it"
                        : "gemma2"
                    }
                    className="w-full bg-surface border border-border-dim px-3 py-2 text-main focus:outline-none focus:border-accent text-[10px] rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-muted block uppercase font-bold">Powerful Model</label>
                  <input
                    type="text"
                    value={config.model_powerful || ""}
                    onChange={(e) => setConfig({ model_powerful: e.target.value })}
                    placeholder={
                      config.provider === "openai"
                        ? "gpt-4o"
                        : config.provider === "gemini"
                        ? "gemma-4-31b-it"
                        : "llama3"
                    }
                    className="w-full bg-surface border border-border-dim px-3 py-2 text-main focus:outline-none focus:border-accent text-[10px] rounded-xl"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
