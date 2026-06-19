"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useDecisionStore } from "@/store/decisionStore";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { ErrorBlock } from "@/components/ui/ErrorBlock";

export default function ClarifyPage() {
  const router = useRouter();
  const { dilemma, session_id, biases, questions, answers, setAnswers, setPaths, config, setConfig, profileContext } =
    useDecisionStore();
  const [localAnswers, setLocalAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // Sync with store if already populated
  useEffect(() => {
    setLocalAnswers(answers);
  }, [answers]);

  // Protect route if no active session
  useEffect(() => {
    if (!session_id) {
      router.push("/");
    }
  }, [session_id, router]);

  function selectAnswer(qid: string, option: string) {
    setLocalAnswers((prev) => ({ ...prev, [qid]: option }));
  }

  const allAnswered = questions.every((q) => localAnswers[q.question_id]);

  async function handleGenerate() {
    if (!allAnswered) return;
    setLoading(true);
    setError(null);
    setAnswers(localAnswers);
    try {
      const res = await fetch("/api/generate_paths", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          session_id, 
          dilemma, 
          answers: localAnswers,
          config,
          profile_context: profileContext || undefined
        }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail ?? "Server error");
      }
      const data = await res.json();
      setPaths(data.paths);
      router.push("/matrix");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (!session_id) {
    return (
      <div className="min-h-screen flex items-center justify-center font-mono text-gray-500">
        REDIRECTING TO SESSION INITIALIZATION...
      </div>
    );
  }

  return (
    <main className="min-h-screen grid grid-cols-1 lg:grid-cols-[2fr_3fr] divide-y lg:divide-y-0 lg:divide-x divide-border-dim bg-bg">
      {/* Left Panel: Dilemma & Biases */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="p-6 md:p-10 space-y-8 lg:max-h-screen lg:overflow-y-auto"
      >
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <span className="font-mono text-[9px] tracking-widest text-border-bright font-bold uppercase block">
              SESSION ACTIVE
            </span>
            <h2 className="font-sans font-bold text-2xl uppercase tracking-tight text-main">
              COGNITIVE BLUEPRINT
            </h2>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="w-8 h-8 rounded-full border border-border-dim hover:border-accent flex items-center justify-center text-muted hover:text-accent transition-all duration-300 font-bold cursor-pointer"
            title="Configure LLM"
          >
            ⚙
          </button>
        </div>

        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden border border-border-dim bg-surface/50 p-4 rounded-xl space-y-4 font-mono text-[10px] text-muted"
            >
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
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-4">
          <p className="font-mono text-[10px] text-muted tracking-wider uppercase font-bold">INPUT DILEMMA</p>
          <blockquote className="border-l border-accent bg-accent/5 p-4 text-xs leading-relaxed italic text-main font-mono rounded-r-xl">
            &ldquo;{dilemma}&rdquo;
          </blockquote>
        </div>

        <div className="space-y-4">
          <p className="font-mono text-[10px] text-muted tracking-wider uppercase font-bold">DETECTED COGNITIVE BIASES</p>
          {biases.length === 0 ? (
            <p className="text-xs text-muted font-sans italic">No prominent cognitive biases flagged in session start.</p>
          ) : (
            <ul className="space-y-3">
              {biases.map((b, i) => (
                <motion.li 
                  key={i} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="border border-danger/40 bg-danger/5 p-3 flex flex-col gap-1.5 rounded-xl"
                >
                  <span className="font-mono text-[10px] font-bold text-danger uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-danger rounded-full" />
                    {b.split(":")[0] || b}
                  </span>
                  {b.includes(":") && (
                    <span className="text-[11px] text-muted leading-normal">
                      {b.substring(b.indexOf(":") + 1).trim()}
                    </span>
                  )}
                </motion.li>
              ))}
            </ul>
          )}
        </div>
      </motion.div>

      {/* Right Panel: Clarifying Questions */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="p-6 md:p-10 space-y-8 lg:max-h-screen lg:overflow-y-auto flex flex-col justify-between"
      >
        <div className="space-y-8">
          <div className="space-y-2">
            <span className="font-mono text-[9px] tracking-widest text-accent font-bold uppercase block">
              INPUT REQUIRED
            </span>
            <h2 className="font-sans font-bold text-2xl uppercase tracking-tight text-main">
              CLARIFY CONSTRAINTS
            </h2>
            <p className="text-muted text-xs">
              Answer the following AI-generated prompts to scope real limits, values, and downside tolerance.
            </p>
          </div>

          <div className="space-y-8">
            {questions.map((q, idx) => (
              <div key={q.question_id} className="space-y-3 border-l-2 border-border-dim pl-4 py-1">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-[10px] font-bold text-accent">Q{idx + 1}</span>
                  <span className="h-[1px] w-4 bg-border-dim" />
                </div>
                <p className="text-xs md:text-sm text-main font-sans leading-relaxed">{q.text}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                  {q.options.map((opt) => {
                    const isSelected = localAnswers[q.question_id] === opt;
                    return (
                      <button
                        key={opt}
                        onClick={() => selectAnswer(q.question_id, opt)}
                        disabled={loading}
                        className={`border p-3 text-left transition-all duration-300 text-xs font-mono relative rounded-xl ${
                          isSelected
                            ? "border-accent bg-accent/10 text-main font-bold"
                            : "border-border-dim hover:border-accent text-muted hover:text-main bg-white"
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
                        )}
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-8 border-t border-border-dim/60 space-y-4">
          {loading ? (
            <LoadingSkeleton rows={2} />
          ) : (
            <button
              id="generate-paths-button"
              onClick={handleGenerate}
              disabled={!allAnswered}
              className="w-full border border-accent bg-accent/5 hover:bg-accent hover:text-white font-mono text-xs tracking-widest py-4 text-accent transition-all duration-300 disabled:opacity-30 disabled:pointer-events-none shadow-[0_0_15px_rgba(52,144,139,0.05)] hover:shadow-[0_0_20px_rgba(52,144,139,0.15)] font-bold uppercase rounded-xl"
            >
              MODEL FUTURES MATRIX →
            </button>
          )}
          {error && <ErrorBlock message={error} />}
        </div>
      </motion.div>
    </main>
  );
}
