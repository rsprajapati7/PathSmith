"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useDecisionStore } from "@/store/decisionStore";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { ErrorBlock } from "@/components/ui/ErrorBlock";

export default function IntakePage() {
  const router = useRouter();
  const { dilemma, setDilemma, setSession, reset, config, setConfig } = useDecisionStore();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [mounted, setMounted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Sync mounted state to prevent Next.js hydration mismatches from localStorage
  useEffect(() => {
    setMounted(true);
  }, []);

  async function handleSubmit() {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    
    // Reset state before starting a new session
    reset();
    setDilemma(text);

    try {
      const res = await fetch("/api/start_session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          dilemma: text,
          config: mounted ? config : undefined 
        }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail ?? "Server error");
      }
      const data = await res.json();
      setSession(data.session_id, data.detected_biases, data.clarifying_questions);
      router.push("/clarify");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 md:p-8">
      {/* Decorative background effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-border-bright/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-[250px] h-[250px] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-2xl z-10 space-y-8"
      >
        {/* Header Branding */}
        <div className="text-center md:text-left space-y-3">
          <div className="flex items-center justify-center md:justify-start space-x-2.5">
            <span className="h-[2px] w-8 bg-border-bright" />
            <span className="font-mono text-[10px] tracking-[0.25em] text-border-bright font-bold uppercase">
              STRATEGY DECISION PLATFORM
            </span>
          </div>
          <h1 className="font-sans font-bold text-4xl md:text-5xl uppercase tracking-tight text-white glow-text-indigo">
            PATHSMITH
          </h1>
          <p className="text-gray-400 text-xs md:text-sm max-w-lg leading-relaxed font-sans">
            Forging, hammering out, and modeling your futures. Enter your current crossroads to analyze underlying cognitive biases and model parallel life directions.
          </p>
        </div>

        {/* Input Area */}
        <div className="space-y-4">
          <div className="relative">
            <textarea
              id="dilemma-textarea"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="I am trying to decide whether to leave my corporate engineering job to start a boutique coffee shop, or accept a promotion that requires relocating to another country..."
              rows={5}
              disabled={loading}
              className="w-full bg-surface/30 backdrop-blur-sm border border-border-dim p-4 text-sm resize-none focus:outline-none focus:border-border-bright/60 focus:ring-1 focus:ring-border-bright/20 text-white placeholder-gray-600 transition-all duration-300 font-sans leading-relaxed"
            />
            {/* HUD Indicators */}
            <div className="absolute bottom-3 right-3 font-mono text-[9px] text-gray-500 uppercase select-none">
              chars: {text.length}
            </div>
          </div>

          {/* Model Provider Config Toggler */}
          <div className="border border-border-dim/60 bg-surface/10 p-4">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex justify-between items-center w-full font-mono text-[10px] tracking-widest text-gray-400 hover:text-white uppercase transition-colors"
            >
              <span>[⚙] Engine Parameters</span>
              <span className="text-accent font-bold">
                {mounted ? `${config.provider.toUpperCase()} ACTIVE` : "LOADING..."}{" "}
                {showSettings ? "▲" : "▼"}
              </span>
            </button>

            <AnimatePresence>
              {showSettings && mounted && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="pt-4 mt-3 border-t border-border-dim/40 space-y-4 font-mono text-xs text-gray-300">
                    {/* Provider Selection */}
                    <div className="space-y-2">
                      <label className="text-[10px] text-gray-500 tracking-wider block">LLM PROVIDER</label>
                      <div className="grid grid-cols-3 gap-2">
                        {["openai", "gemini", "ollama"].map((p) => (
                          <button
                            key={p}
                            onClick={() => setConfig({ provider: p })}
                            className={`border p-2 text-[10px] font-bold tracking-wider uppercase transition-all duration-300 ${
                              config.provider === p
                                ? "border-accent bg-accent/10 text-white"
                                : "border-border-dim text-gray-500 hover:border-gray-500 hover:text-white"
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* API Key / Connection Inputs */}
                    {config.provider !== "ollama" ? (
                      <div className="space-y-2">
                        <label className="text-[10px] text-gray-500 tracking-wider block">
                          {config.provider.toUpperCase()} API KEY
                        </label>
                        <input
                          type="password"
                          value={config.api_key || ""}
                          onChange={(e) => setConfig({ api_key: e.target.value })}
                          placeholder={
                            config.provider === "openai"
                              ? "sk-... (defaults to backend .env if empty)"
                              : "AIzaSy... (defaults to backend .env if empty)"
                          }
                          className="w-full bg-surface border border-border-dim px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-accent text-xs"
                        />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <label className="text-[10px] text-gray-500 tracking-wider block">OLLAMA BASE URL</label>
                        <input
                          type="text"
                          value={config.base_url || ""}
                          onChange={(e) => setConfig({ base_url: e.target.value })}
                          placeholder="http://localhost:11434/v1"
                          className="w-full bg-surface border border-border-dim px-3 py-2 text-white focus:outline-none focus:border-accent text-xs"
                        />
                      </div>
                    )}

                    {/* Model Custom Overrides */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <label className="text-[10px] text-gray-500 tracking-wider block">FAST MODEL</label>
                        <input
                          type="text"
                          value={config.model_fast || ""}
                          onChange={(e) => setConfig({ model_fast: e.target.value })}
                          placeholder={
                            config.provider === "openai"
                              ? "gpt-4o-mini"
                              : config.provider === "gemini"
                              ? "gemini-1.5-flash"
                              : "gemma2"
                          }
                          className="w-full bg-surface border border-border-dim px-3 py-2 text-white focus:outline-none focus:border-accent text-xs"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] text-gray-500 tracking-wider block">POWERFUL MODEL</label>
                        <input
                          type="text"
                          value={config.model_powerful || ""}
                          onChange={(e) => setConfig({ model_powerful: e.target.value })}
                          placeholder={
                            config.provider === "openai"
                              ? "gpt-4o"
                              : config.provider === "gemini"
                              ? "gemini-1.5-pro"
                              : "llama3"
                          }
                          className="w-full bg-surface border border-border-dim px-3 py-2 text-white focus:outline-none focus:border-accent text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-center">
            {loading ? (
              <div className="w-full">
                <LoadingSkeleton rows={2} />
              </div>
            ) : (
              <button
                id="analyse-button"
                onClick={handleSubmit}
                disabled={!text.trim()}
                className="w-full md:w-auto border border-border-bright bg-border-bright/5 hover:bg-border-bright hover:text-black font-mono text-xs tracking-widest px-8 py-3.5 text-white transition-all duration-300 disabled:opacity-30 disabled:pointer-events-none shadow-[0_0_15px_rgba(99,102,241,0.1)] hover:shadow-[0_0_20px_rgba(99,102,241,0.3)] font-bold"
              >
                INITIALIZE ANALYSIS →
              </button>
            )}
          </div>
          
          {error && <ErrorBlock message={error} />}
        </div>
      </motion.div>
    </main>
  );
}
