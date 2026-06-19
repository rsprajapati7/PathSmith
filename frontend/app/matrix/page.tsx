"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useDecisionStore } from "@/store/decisionStore";
import { PathCard } from "@/components/PathCard";
import { RecommendationBanner } from "@/components/RecommendationBanner";

export default function MatrixPage() {
  const router = useRouter();
  const { paths, dilemma, reset, config, setConfig, decisionMode, recommendation } = useDecisionStore();
  const [showSettings, setShowSettings] = useState(false);

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
      <main className="min-h-screen flex flex-col items-center justify-center gap-6 bg-bg">
        <div className="space-y-4 text-center">
          <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-mono text-xs text-muted uppercase tracking-widest">No scenarios registered. Rebooting...</p>
        </div>
        <button
          onClick={handleRestart}
          className="glow-btn border-2 border-accent bg-accent text-white font-mono text-[10px] tracking-widest px-6 py-3 rounded-xl font-bold uppercase hover:shadow-lg hover:shadow-accent/25 transition-all duration-300"
        >
          Return to Start
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bg flex flex-col page-enter">

      {/* ── STICKY HEADER ── */}
      <motion.header
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="border-b border-border-dim/70 glass px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sticky top-0 z-20"
      >
        <div className="space-y-1 flex-1 min-w-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-5 h-5 border-2 border-accent flex items-center justify-center rounded-md">
              <div className="w-2 h-2 bg-accent rounded-[2px]" />
            </div>
            <span className="font-mono text-[10px] font-bold tracking-widest text-main uppercase">
              PATHSMITH
            </span>
            <span className="font-mono text-[9px] text-muted/60 hidden sm:inline">·</span>
            <h1 className="font-mono text-[10px] font-bold tracking-widest text-muted uppercase hidden sm:inline">
              Decision Matrix
            </h1>
          </div>
          <p className="text-[11px] text-muted font-sans max-w-xl truncate italic">
            &ldquo;{dilemma}&rdquo;
          </p>
        </div>

        <div className="flex items-center space-x-2.5 shrink-0">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`w-9 h-9 border flex items-center justify-center transition-all duration-300 rounded-xl font-bold cursor-pointer text-sm ${
              showSettings ? "border-accent bg-accent/10 text-accent" : "border-border-dim hover:border-accent text-muted hover:text-accent"
            }`}
            title="Configure LLM"
          >
            ⚙
          </button>
          <button
            onClick={handleRestart}
            className="font-mono text-[10px] tracking-widest border border-border-dim px-4 py-2 text-muted hover:text-danger hover:border-danger hover:bg-danger/5 transition-all duration-300 uppercase font-bold rounded-xl h-9"
          >
            ↩ Reset
          </button>
        </div>
      </motion.header>

      {/* ── SETTINGS PANEL ── */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="border-b border-border-dim/60 bg-surface/60 backdrop-blur-sm px-6 py-5 overflow-hidden"
          >
            <div className="max-w-2xl space-y-4 font-mono text-[10px] text-muted">
              <p className="text-[9px] uppercase tracking-widest font-bold text-muted/70">⚙ LLM Configuration</p>

              <div className="space-y-2">
                <label className="text-[9px] text-muted block uppercase font-bold">Provider</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "openai", label: "OpenAI", icon: "🤖" },
                    { id: "gemini", label: "Gemini", icon: "✨" },
                    { id: "ollama", label: "Ollama", icon: "🦙" },
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setConfig({ provider: p.id })}
                      className={`border p-2.5 text-[9px] font-bold tracking-wider uppercase transition-all duration-300 rounded-xl flex flex-col items-center gap-1 ${
                        config.provider === p.id
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-border-dim text-muted hover:border-accent hover:text-accent bg-surface"
                      }`}
                    >
                      <span className="text-base leading-none">{p.icon}</span>
                      <span>{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {config.provider !== "ollama" ? (
                <div className="space-y-1">
                  <label className="text-[9px] text-muted block uppercase font-bold">
                    {config.provider.toUpperCase()} API Key
                  </label>
                  <input
                    type="password"
                    value={config.api_key || ""}
                    onChange={(e) => setConfig({ api_key: e.target.value })}
                    placeholder={config.provider === "openai" ? "sk-..." : "AIzaSy..."}
                    className="w-full bg-surface border border-border-dim px-3 py-2 text-main placeholder-muted/50 focus:outline-none focus:border-accent text-[10px] rounded-xl transition-colors duration-200"
                  />
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-[9px] text-muted block uppercase font-bold">Ollama Base URL</label>
                  <input
                    type="text"
                    value={config.base_url || ""}
                    onChange={(e) => setConfig({ base_url: e.target.value })}
                    placeholder="http://localhost:11434/v1"
                    className="w-full bg-surface border border-border-dim px-3 py-2 text-main focus:outline-none focus:border-accent text-[10px] rounded-xl transition-colors duration-200"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] text-muted block uppercase font-bold">Fast Model</label>
                  <input
                    type="text"
                    value={config.model_fast || ""}
                    onChange={(e) => setConfig({ model_fast: e.target.value })}
                    placeholder={config.provider === "openai" ? "gpt-4o-mini" : config.provider === "gemini" ? "gemma-4-31b-it" : "gemma2"}
                    className="w-full bg-surface border border-border-dim px-3 py-2 text-main focus:outline-none focus:border-accent text-[10px] rounded-xl transition-colors duration-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-muted block uppercase font-bold">Powerful Model</label>
                  <input
                    type="text"
                    value={config.model_powerful || ""}
                    onChange={(e) => setConfig({ model_powerful: e.target.value })}
                    placeholder={config.provider === "openai" ? "gpt-4o" : config.provider === "gemini" ? "gemma-4-31b-it" : "llama3"}
                    className="w-full bg-surface border border-border-dim px-3 py-2 text-main focus:outline-none focus:border-accent text-[10px] rounded-xl transition-colors duration-200"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── PATH GRID ── */}
      <div className="flex-1 p-6 md:p-8">
        {/* Recommendation Banner */}
        {recommendation && (
          <RecommendationBanner recommendation={recommendation} paths={paths} />
        )}

        {/* Summary ribbon */}
        <div className="mb-8 flex items-center gap-3 flex-wrap">
          <span className="font-mono text-[9px] text-muted uppercase tracking-widest font-bold">
            {paths.length} PATH{paths.length !== 1 ? "S" : ""} GENERATED
          </span>
          <span className="h-[1px] w-8 bg-border-dim" />
          <span className="font-mono text-[9px] text-muted uppercase tracking-widest font-bold">
            {decisionMode === "short_term" ? "⚡ SHORT TERM MODE" : "🔭 LONG TERM MODE"}
          </span>
          <span className="h-[1px] w-8 bg-border-dim" />
          {paths.map((p, i) => {
            const colors = ["#34908B", "#4A7FC1", "#7C5CBF"];
            return (
              <span
                key={p.path_id}
                className="font-mono text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border"
                style={{
                  color: colors[i] || "#34908B",
                  borderColor: colors[i] ? `${colors[i]}40` : "#34908B40",
                  background: colors[i] ? `${colors[i]}0D` : "#34908B0D",
                }}
              >
                {p.title}
              </span>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start"
        >
          {paths.map((path, i) => (
            <motion.div
              key={path.path_id}
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, delay: i * 0.14, ease: "easeOut" }}
            >
              <PathCard
                path={path}
                index={i}
                decisionMode={decisionMode}
                isRecommended={recommendation?.recommended_path_id === path.path_id}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </main>
  );
}
