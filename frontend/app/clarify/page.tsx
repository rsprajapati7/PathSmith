"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useDecisionStore } from "@/store/decisionStore";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { ErrorBlock } from "@/components/ui/ErrorBlock";

export default function ClarifyPage() {
  const router = useRouter();
  const { dilemma, session_id, biases, questions, answers, setAnswers, setPaths, config, setConfig, profileContext, decisionMode, setRecommendation } =
    useDecisionStore();
  const [localAnswers, setLocalAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const questionRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    setLocalAnswers(answers);
  }, [answers]);

  useEffect(() => {
    if (!session_id) {
      router.push("/");
    }
  }, [session_id, router]);

  function selectAnswer(qid: string, option: string, idx: number) {
    setLocalAnswers((prev) => ({ ...prev, [qid]: option }));
    // Auto-scroll to next question
    const next = questionRefs.current[idx + 1];
    if (next) {
      setTimeout(() => next.scrollIntoView({ behavior: "smooth", block: "center" }), 200);
    }
  }

  const answeredCount = questions.filter((q) => localAnswers[q.question_id]).length;
  const allAnswered = answeredCount === questions.length && questions.length > 0;
  const progressPct = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;

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
          profile_context: profileContext || undefined,
          decision_mode: decisionMode,
        }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail ?? "Server error");
      }
      const data = await res.json();
      setPaths(data.paths);
      setRecommendation(data.recommendation ?? null);
      router.push("/matrix");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (!session_id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-mono text-[10px] text-muted uppercase tracking-widest font-bold">
            Redirecting to session...
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen grid grid-cols-1 lg:grid-cols-[2fr_3fr] divide-y lg:divide-y-0 lg:divide-x divide-border-dim/50 bg-bg page-enter">

      {/* ── LEFT PANEL: Dilemma & Biases ── */}
      <motion.div
        initial={{ opacity: 0, x: -24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        className="p-6 md:p-10 space-y-8 lg:max-h-screen lg:overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-bg/90 backdrop-blur-sm -mx-6 md:-mx-10 px-6 md:px-10 py-4 border-b border-border-dim/40 z-10">
          <div className="flex justify-between items-center">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
                <span className="font-mono text-[9px] tracking-widest text-muted font-bold uppercase">
                  SESSION ACTIVE
                </span>
              </div>
              <h1 className="font-sans font-bold text-xl uppercase tracking-tight text-main">
                COGNITIVE BLUEPRINT
              </h1>
            </div>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="w-9 h-9 rounded-xl border border-border-dim hover:border-accent flex items-center justify-center text-muted hover:text-accent transition-all duration-300 font-bold cursor-pointer text-sm"
              title="Configure LLM"
            >
              ⚙
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden border border-border-dim bg-surface/60 backdrop-blur-sm p-4 rounded-xl space-y-4 font-mono text-[10px] text-muted"
            >
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
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dilemma display */}
        <div className="space-y-3">
          <p className="font-mono text-[9px] text-muted tracking-widest uppercase font-bold flex items-center gap-2">
            <span className="w-1 h-3 bg-accent rounded-full" />
            INPUT DILEMMA
          </p>
          <blockquote className="border-l-2 border-accent bg-accent/5 p-4 text-xs leading-relaxed italic text-main font-sans rounded-r-xl">
            &ldquo;{dilemma}&rdquo;
          </blockquote>
        </div>

        {/* Detected Biases */}
        <div className="space-y-4">
          <p className="font-mono text-[9px] text-muted tracking-widest uppercase font-bold flex items-center gap-2">
            <span className="w-1 h-3 bg-danger rounded-full" />
            DETECTED COGNITIVE BIASES
          </p>
          {biases.length === 0 ? (
            <div className="border border-border-dim/40 bg-surface/40 rounded-xl p-4 text-xs text-muted font-sans italic">
              No prominent cognitive biases flagged in session start.
            </div>
          ) : (
            <ul className="space-y-2.5">
              {biases.map((b, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.4 }}
                  className="border border-danger/30 bg-danger/4 p-3 flex flex-col gap-1.5 rounded-xl"
                >
                  <span className="font-mono text-[10px] font-bold text-danger uppercase tracking-wider flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-danger rounded-full shrink-0" />
                    {b.split(":")[0] || b}
                  </span>
                  {b.includes(":") && (
                    <span className="text-[11px] text-muted leading-normal pl-3.5">
                      {b.substring(b.indexOf(":") + 1).trim()}
                    </span>
                  )}
                </motion.li>
              ))}
            </ul>
          )}
        </div>
      </motion.div>

      {/* ── RIGHT PANEL: Clarifying Questions ── */}
      <motion.div
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.55, ease: "easeOut", delay: 0.05 }}
        className="p-6 md:p-10 space-y-8 lg:max-h-screen lg:overflow-y-auto flex flex-col"
      >
        {/* Right panel header with progress */}
        <div className="sticky top-0 bg-bg/90 backdrop-blur-sm -mx-6 md:-mx-10 px-6 md:px-10 py-4 border-b border-border-dim/40 z-10">
          <div className="flex items-center justify-between mb-3">
            <div className="space-y-0.5">
              <span className="font-mono text-[9px] tracking-widest text-accent font-bold uppercase block">
                INPUT REQUIRED
              </span>
              <h2 className="font-sans font-bold text-xl uppercase tracking-tight text-main">
                CLARIFY CONSTRAINTS
              </h2>
            </div>
            <div className="text-right">
              <span className="font-mono text-xs font-bold text-accent">{answeredCount}</span>
              <span className="font-mono text-xs text-muted">/{questions.length}</span>
              <p className="font-mono text-[9px] text-muted uppercase tracking-wider">answered</p>
            </div>
          </div>
          {/* Progress bar */}
          <div className="h-1.5 bg-border-dim rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-accent rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>

        <p className="text-muted text-xs font-sans leading-relaxed -mt-4">
          Answer the following AI-generated prompts to scope real limits, values, and downside tolerance. Selections auto-advance to the next question.
        </p>

        <div className="space-y-8 flex-1">
          {questions.map((q, idx) => {
            const isAnswered = !!localAnswers[q.question_id];
            return (
              <motion.div
                key={q.question_id}
                ref={(el) => { questionRefs.current[idx] = el; }}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1, duration: 0.45 }}
                className={`space-y-3 border-l-2 pl-4 py-1 transition-colors duration-500 ${isAnswered ? "border-accent" : "border-border-dim"}`}
              >
                <div className="flex items-center space-x-2">
                  <span
                    className="font-mono text-[10px] font-bold transition-colors duration-300"
                    style={{ color: isAnswered ? "#34908B" : "#4e6a6c" }}
                  >
                    Q{idx + 1}
                  </span>
                  {isAnswered && (
                    <motion.span
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-[9px] font-mono text-accent font-bold"
                    >
                      ✓
                    </motion.span>
                  )}
                </div>
                <p className="text-xs md:text-sm text-main font-sans leading-relaxed">{q.text}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                  {q.options.map((opt) => {
                    const isSelected = localAnswers[q.question_id] === opt;
                    return (
                      <button
                        key={opt}
                        onClick={() => selectAnswer(q.question_id, opt, idx)}
                        disabled={loading}
                        className={`border p-3 text-left transition-all duration-250 text-xs font-sans relative rounded-xl group ${
                          isSelected
                            ? "border-accent bg-accent/10 text-main font-semibold shadow-sm shadow-accent/8"
                            : "border-border-dim hover:border-accent/60 text-muted hover:text-main bg-surface hover:bg-accent/3"
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
                        )}
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Generate CTA */}
        <div className="pt-6 border-t border-border-dim/50 space-y-4 sticky bottom-0 bg-bg/95 backdrop-blur-sm -mx-6 md:-mx-10 px-6 md:px-10 py-5">
          {loading ? (
            <LoadingSkeleton rows={2} />
          ) : (
            <div className="space-y-3">
              {!allAnswered && questions.length > 0 && (
                <p className="text-[10px] font-mono text-muted text-center">
                  {questions.length - answeredCount} question{questions.length - answeredCount !== 1 ? "s" : ""} remaining
                </p>
              )}
              <button
                id="generate-paths-button"
                onClick={handleGenerate}
                disabled={!allAnswered}
                className="glow-btn w-full border-2 border-accent bg-accent text-white font-mono text-[10px] tracking-widest py-4 transition-all duration-300 disabled:opacity-25 disabled:pointer-events-none hover:shadow-lg hover:shadow-accent/25 font-bold uppercase rounded-xl hover:scale-[1.01] active:scale-[0.99]"
              >
                Model Futures Matrix →
              </button>
            </div>
          )}
          {error && <ErrorBlock message={error} />}
        </div>
      </motion.div>
    </main>
  );
}
