"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useDecisionStore } from "@/store/decisionStore";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { ErrorBlock } from "@/components/ui/ErrorBlock";
import { HistoryDrawer } from "@/components/HistoryDrawer";
import { WizardPanel } from "@/components/WizardPanel";

export default function IntakePage() {
  const router = useRouter();
  const { dilemma, setDilemma, setSession, reset, config, setConfig, profileContext, setProfileContext, decisionMode, setDecisionMode } = useDecisionStore();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [started, setStarted] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [wizardMode, setWizardMode] = useState(false);

  // File Upload State
  const [uploading, setUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Mock Sandbox State
  const [activeMockPath, setActiveMockPath] = useState(0);
  const [prevMockPath, setPrevMockPath] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  const consoleRef = useRef<HTMLDivElement>(null);

  const scrollSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const focusConsole = () => {
    setStarted(true);
    setTimeout(() => {
      if (consoleRef.current) {
        consoleRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);
  };

  const handleGetStarted = () => {
    setStarted(true);
    setTimeout(() => {
      if (consoleRef.current) {
        consoleRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);
  };

  async function processFile(file: File) {
    setUploading(true);
    setUploadError(null);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload_document", { method: "POST", body: formData });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail ?? "Failed to upload document");
      }
      const data = await res.json();
      setProfileContext(data.text);
      setUploadedFileName(file.name);
    } catch (err: any) {
      setUploadError(err.message || "Failed to process document");
      setProfileContext("");
      setUploadedFileName(null);
    } finally {
      setUploading(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
  }

  function handleRemoveFile() {
    setProfileContext("");
    setUploadedFileName(null);
    setUploadError(null);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(true);
  }

  function handleDragLeave() {
    setIsDragOver(false);
  }

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.name.endsWith(".pdf") || file.name.endsWith(".txt"))) {
      await processFile(file);
    } else if (file) {
      setUploadError("Only .pdf and .txt files are supported");
    }
  }

  async function handleSubmit() {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    const currentProfile = profileContext;
    reset();
    setDilemma(text);
    if (currentProfile) setProfileContext(currentProfile);

    try {
      const res = await fetch("/api/start_session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dilemma: text,
          config: mounted ? config : undefined,
          profile_context: mounted && currentProfile ? currentProfile : undefined,
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

  const mockPaths = [
    {
      title: "AI Startup Founder",
      summary: "Quit corporate role to co-found a niche generative AI agent consultancy, bootstrapping the initial MVP.",
      metrics: { financial: 3, growth: 10, risk: 9, time: 8 },
      timeline: { year_1: "Sweat equity, zero salary, launch MVP", year_3: "Raise Seed, hire 4 devs, $250k ARR", year_5: "Acquired or series A scale" },
      tradeoffs: ["Extremely high rate of early-stage failure", "Severe personal relationship strain", "Deep identity pivot required"],
      color: "#34908B",
    },
    {
      title: "Big Tech Senior Manager",
      summary: "Accept the relocate offer, staying in safe employment, climbing the career path to Director.",
      metrics: { financial: 9, growth: 6, risk: 2, time: 6 },
      timeline: { year_1: "$250k TC, relocate to Dublin, join group team", year_3: "Promotion to Manager II, equity vests", year_5: "$400k TC, high corporate equity" },
      tradeoffs: ["High opportunity cost of starting an independent firm", "Geographic relocation strain", "Potential identity foreclosure"],
      color: "#4A7FC1",
    },
    {
      title: "Digital Nomad Consultant",
      summary: "Go independent freelance contract advisor, traveling across Southeast Asia.",
      metrics: { financial: 6, growth: 7, risk: 5, time: 4 },
      timeline: { year_1: "First 3 clients secured, relocate to Bali", year_3: "$120k ARR, select work 20hrs/week", year_5: "Create micro-SaaS, steady passive cashflow" },
      tradeoffs: ["Lack of institutional scale or long-term brand", "Isolation and transient relationship cycles", "Self-employment tax overhead"],
      color: "#7C5CBF",
    },
  ];

  const activePath = mockPaths[activeMockPath];

  const capabilities = [
    {
      num: "01",
      title: "Bias Detector",
      desc: "Before you decide, PathSmith checks if your thinking is being influenced by common mental traps — like fear of losing what you have, or sticking with something just because you've already invested time in it.",
      icon: "🧠",
    },
    {
      num: "02",
      title: "Future Timeline",
      desc: "See what each path could look like 1, 3, and 5 years from now — covering money, growth, risk, and time — so you can compare your options side by side.",
      icon: "📈",
    },
    {
      num: "03",
      title: "What-If Explorer",
      desc: "Change the variables and instantly see how your outcomes shift. Ask \"What if I waited 6 months?\" or \"What if I had more savings?\" and get updated results right away.",
      icon: "🔀",
    },
  ];

  return (
    <div className="min-h-screen bg-bg flex flex-col font-sans overflow-x-hidden">

      {/* ── NAVIGATION HEADER ── */}
      <header className="sticky top-0 z-50 border-b border-border-dim/80 glass px-6 md:px-12 py-3.5 flex justify-between items-center transition-all duration-300">
        <div className="flex items-center space-x-8">
          <div
            className="flex items-center space-x-2.5 cursor-pointer group"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <div className="w-6 h-6 border-2 border-accent flex items-center justify-center relative rounded-lg group-hover:bg-accent/10 transition-colors duration-300">
              <div className="w-2.5 h-2.5 bg-accent rounded-[3px]" />
            </div>
            <span className="font-mono text-sm tracking-[0.2em] font-bold text-main glow-text-indigo">
              PATHSMITH
            </span>
          </div>

          <nav className="hidden md:flex items-center space-x-6 font-mono text-[10px] tracking-widest text-muted uppercase font-bold">
            <button onClick={() => scrollSection("features")} className="hover:text-accent transition-colors duration-200 hover:glow-text-cyan">
              Capabilities
            </button>
            <button onClick={() => scrollSection("sandbox")} className="hover:text-accent transition-colors duration-200">
              Demo
            </button>
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          {mounted && (
            <div className="hidden lg:flex items-center space-x-2">
              <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
              <span className="font-mono text-[9px] text-muted uppercase font-bold tracking-wider">
                {config.provider.toUpperCase()} ENGINE
              </span>
            </div>
          )}
          {/* History button */}
          <button
            onClick={() => setShowHistory(true)}
            className="hidden sm:flex items-center gap-1.5 font-mono text-[10px] tracking-wider text-muted hover:text-accent border border-border-dim hover:border-accent px-3 py-2 rounded-full font-bold uppercase transition-all duration-200"
          >
            📋 History
          </button>
          <button
            onClick={focusConsole}
            className="glow-btn border-2 border-accent bg-accent text-white font-mono text-[10px] tracking-[0.18em] px-5 py-2.5 transition-all duration-300 font-bold uppercase rounded-full hover:shadow-lg hover:shadow-accent/25 hover:scale-[1.04] active:scale-95"
          >
            Launch →
          </button>
        </div>
      </header>

      {/* ── HERO SECTION ── */}
      <section className="relative min-h-[92vh] flex flex-col items-center justify-center p-6 md:p-12 border-b border-border-dim/40">

        {/* Animated background orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[160px] pointer-events-none animate-float" />
        <div className="absolute bottom-1/4 left-1/4 w-[350px] h-[350px] bg-accent-glow/8 rounded-full blur-[120px] pointer-events-none animate-float-slow" />
        <div className="absolute top-3/4 right-1/4 w-[280px] h-[280px] bg-gold/20 rounded-full blur-[100px] pointer-events-none animate-float" style={{ animationDelay: "3s" }} />

        {/* Scan line effect */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.03]">
          <div className="w-full h-[2px] bg-accent animate-scan-line" />
        </div>

        <div className="w-full max-w-4xl text-center z-10 space-y-10">

          {/* Badge + Headline */}
          <div className="space-y-5">


            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.1 }}
              className="font-sans font-bold text-4xl sm:text-6xl md:text-7xl uppercase tracking-tight leading-[0.92] text-main"
            >
              Model your life.
              <br />
              <span className="accent-gradient-text">Simulate the future.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.75, delay: 0.25 }}
              className="text-muted text-sm sm:text-base max-w-xl mx-auto leading-relaxed font-sans font-medium"
            >
              Stuck at a crossroads? Describe your situation and let AI map out your options, spot blind spots, and show you what each path could look like — before you commit.
            </motion.p>
          </div>

          {/* CTA Button */}
          <AnimatePresence>
            {!started && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: -10 }}
                transition={{ duration: 0.45 }}
                className="flex flex-col items-center gap-5"
              >
                <button
                  onClick={handleGetStarted}
                  className="glow-btn group relative border-2 border-accent bg-accent text-white font-mono text-xs tracking-[0.2em] px-10 py-4.5 rounded-full font-bold uppercase shadow-xl shadow-accent/20 hover:shadow-2xl hover:shadow-accent/30 transition-all duration-350 hover:scale-[1.06] active:scale-95"
                  style={{ paddingTop: "14px", paddingBottom: "14px" }}
                >
                  <span className="relative z-10 flex items-center gap-3">
                    Get Started
                    <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
                  </span>
                  <span className="absolute inset-0 bg-gradient-to-r from-accent via-accent-glow to-accent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full" />
                </button>
                <p className="text-[10px] font-mono text-muted/70 tracking-wider uppercase font-bold">
                  No account required · Free to use
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Prompt Console */}
          <motion.div
            ref={consoleRef}
            initial={false}
            animate={started ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.94, y: 20 }}
            style={{ pointerEvents: started ? "auto" : "none", display: started ? "block" : "none" }}
            transition={{ type: "spring", stiffness: 120, damping: 20, mass: 0.8 }}
            className="w-full max-w-2xl mx-auto"
          >
            <div className="border border-border-dim bg-surface/80 backdrop-blur-xl text-left rounded-2xl shadow-xl shadow-accent/8 overflow-hidden glow-border-accent">
              {/* Console header bar */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-border-dim/60 bg-surface/50">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-danger/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-warning/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-accent/60" />
                  </div>
                  <span className="font-mono text-[9px] text-muted/70 uppercase font-bold tracking-wider ml-2">
                    PATHSMITH CONSOLE v2.0
                  </span>
                </div>
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="w-7 h-7 rounded-lg border border-border-dim hover:border-accent flex items-center justify-center text-muted hover:text-accent transition-all duration-300 font-bold cursor-pointer text-[11px]"
                  title="Configure Engine"
                >
                  ⚙
                </button>
              </div>

              <div className="p-5 space-y-4">
                {/* Decision Mode Toggle */}
                <div className="space-y-2">
                  <p className="font-mono text-[9px] text-muted uppercase tracking-widest font-bold">How far ahead are you planning?</p>
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      { id: "long_term" as const, label: "Long Term Decision", icon: "🔭", desc: "Year 1–5 projections" },
                      { id: "short_term" as const, label: "Short Term Decision", icon: "⚡", desc: "Next 6–12 months" },
                    ]).map((mode) => (
                      <button
                        key={mode.id}
                        onClick={() => setDecisionMode(mode.id)}
                        className={`border p-3 text-left transition-all duration-300 rounded-xl flex flex-col gap-1 group ${
                          decisionMode === mode.id
                            ? "border-accent bg-accent/10 text-accent"
                            : "border-border-dim text-muted hover:border-accent/60 hover:text-main bg-surface"
                        }`}
                      >
                        <span className="text-base leading-none">{mode.icon}</span>
                        <span className="font-mono text-[9px] font-bold tracking-wider uppercase leading-tight">{mode.label}</span>
                        <span className={`font-sans text-[9px] leading-tight ${
                          decisionMode === mode.id ? "text-accent/70" : "text-muted/60"
                        }`}>{mode.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Input Mode Toggle: Free Text vs. Guided Wizard */}
                <div className="flex items-center justify-between">
                  <p className="font-mono text-[9px] text-muted uppercase tracking-widest font-bold">How do you want to describe your situation?</p>
                  <button
                    onClick={() => { setWizardMode((v) => !v); setText(""); }}
                    className={`font-mono text-[8px] font-bold uppercase tracking-widest border px-3 py-1.5 rounded-lg transition-all duration-200 ${
                      wizardMode
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-border-dim text-muted hover:border-accent hover:text-accent"
                    }`}
                  >
                    {wizardMode ? "✏ Type it myself" : "🧭 Answer questions instead"}
                  </button>
                </div>

                {/* Wizard or Textarea */}
                <AnimatePresence mode="wait">
                  {wizardMode ? (
                    <motion.div
                      key="wizard"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                    >
                      <WizardPanel
                        onComplete={(assembled) => {
                          setText(assembled);
                          setWizardMode(false);
                        }}
                        onCancel={() => setWizardMode(false)}
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="textarea"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                    >
                      {/* Textarea */}
                      <div className="relative border border-border-dim bg-bg/40 p-4 rounded-xl focus-within:border-accent transition-colors duration-300">
                        <textarea
                          id="dilemma-textarea"
                          value={text}
                          onChange={(e) => setText(e.target.value)}
                          placeholder="I am trying to decide whether to leave my corporate engineering job to start a boutique coffee shop, or accept a promotion that requires relocating to another country..."
                          rows={4}
                          disabled={loading}
                          className="w-full bg-transparent p-0 text-sm resize-none focus:outline-none text-main placeholder-muted/50 font-sans leading-relaxed"
                          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit(); }}
                        />
                        <div className="absolute bottom-3 right-3 flex items-center gap-2">
                          <span className="font-mono text-[9px] text-muted/60 select-none">
                            {text.length > 0 ? `${text.length} chars` : "Ctrl+Enter to submit"}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* RAG Document Uploader */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border border-dashed rounded-xl p-4 transition-all duration-300 ${
                    isDragOver
                      ? "border-accent bg-accent/8 scale-[1.01]"
                      : uploadedFileName
                      ? "border-accent/50 bg-accent/5"
                      : "border-border-dim bg-bg/30 hover:border-accent/40"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center space-x-3 w-full sm:w-auto">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-base transition-all duration-300 ${uploadedFileName ? "bg-accent text-white" : "bg-accent/10 text-accent"}`}>
                        {uploadedFileName ? "✓" : "🗎"}
                      </div>
                      <div className="text-left">
                        <p className="text-[10px] font-mono font-bold text-main uppercase tracking-wider">
                          Upload Your Background (Optional)
                        </p>
                        <p className="text-[9px] text-muted leading-relaxed">
                          {isDragOver ? "Drop your file here!" : "Add your resume or notes (.pdf, .txt) to get more personalized path suggestions"}
                        </p>
                      </div>
                    </div>

                    <div className="w-full sm:w-auto flex justify-end">
                      {uploading ? (
                        <div className="flex items-center space-x-2 font-mono text-[9px] text-accent font-bold">
                          <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          <span>Processing...</span>
                        </div>
                      ) : uploadedFileName ? (
                        <div className="flex items-center space-x-2 border border-accent bg-accent/8 px-3 py-1.5 rounded-lg font-mono text-[9px]">
                          <span className="text-accent font-bold truncate max-w-[130px]">{uploadedFileName}</span>
                          <button
                            type="button"
                            onClick={handleRemoveFile}
                            className="text-muted hover:text-danger font-bold cursor-pointer transition-colors duration-200 ml-1"
                            title="Remove file"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <label className="border border-border-dim hover:border-accent hover:bg-accent/5 px-4 py-1.5 rounded-lg font-mono text-[9px] text-muted hover:text-accent font-bold uppercase tracking-wider cursor-pointer transition-all duration-300 block text-center">
                          Upload File
                          <input type="file" accept=".pdf,.txt" onChange={handleFileUpload} className="hidden" />
                        </label>
                      )}
                    </div>
                  </div>
                  {uploadError && (
                    <p className="text-[9px] font-mono text-danger mt-2.5 font-bold flex items-center gap-1.5">
                      <span>⚠</span> {uploadError}
                    </p>
                  )}
                </div>

                {/* Settings Panel */}
                <AnimatePresence>
                  {showSettings && mounted && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="border border-border-dim/60 bg-bg/30 rounded-xl p-4 space-y-4 font-mono text-[10px] text-muted">
                        <p className="text-[9px] uppercase tracking-widest font-bold text-muted/70">⚙ AI Settings</p>

                        {/* Provider Selector */}
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

                        {/* Credentials */}
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

                        {/* Custom model overrides */}
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

                  {/* Submit — only show when not in wizard mode */}
                  {!wizardMode && (
                    <div className="pt-1">
                      {loading ? (
                        <LoadingSkeleton rows={2} />
                      ) : (
                        <button
                          id="analyse-button"
                          onClick={handleSubmit}
                          disabled={!text.trim()}
                          className="glow-btn w-full border-2 border-accent bg-accent text-white font-mono text-[10px] tracking-widest py-4 transition-all duration-300 disabled:opacity-30 disabled:pointer-events-none hover:shadow-lg hover:shadow-accent/25 font-bold uppercase rounded-xl hover:scale-[1.01] active:scale-[0.99]"
                        >
                          Show Me My Options →
                        </button>
                      )}
                    </div>
                  )}

                {error && <ErrorBlock message={error} />}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── CAPABILITIES SECTION ── */}
      <motion.section
        id="features"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="py-28 px-6 md:px-12 border-b border-border-dim/40 max-w-6xl mx-auto w-full space-y-16"
      >
        <div className="text-center space-y-4">
          <span className="inline-block font-mono text-[9px] tracking-widest text-accent font-bold uppercase border border-accent/30 bg-accent/5 px-4 py-1.5 rounded-full">
            HOW IT HELPS
          </span>
          <h2 className="font-sans font-bold text-3xl sm:text-4xl uppercase tracking-tight text-main">
            Everything You Need to Decide with Confidence
          </h2>
          <p className="text-muted text-sm max-w-lg mx-auto font-medium leading-relaxed">
            PathSmith uses AI to think through your situation from every angle — helping you see the full picture before making a big move.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {capabilities.map((cap, i) => (
            <motion.div
              key={cap.num}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              className="retool-glow-hover border border-border-dim bg-surface/70 backdrop-blur-sm p-6 space-y-4 relative rounded-2xl group cursor-default"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">{cap.icon}</span>
                <span className="text-accent font-mono text-xs font-bold bg-accent/8 px-2 py-0.5 rounded-full">[{cap.num}]</span>
              </div>
              <h3 className="font-mono text-xs font-bold text-main uppercase tracking-widest">
                {cap.title}
              </h3>
              <p className="text-muted text-xs leading-relaxed font-sans">
                {cap.desc}
              </p>
              <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-accent/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-b-2xl" />
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ── INTERACTIVE MOCK SANDBOX ── */}
      <motion.section
        id="sandbox"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="py-28 px-6 md:px-12 border-b border-border-dim/40 max-w-6xl mx-auto w-full space-y-16"
      >
        <div className="text-center space-y-4">
          <span className="inline-block font-mono text-[9px] tracking-widest text-accent font-bold uppercase border border-accent/30 bg-accent/5 px-4 py-1.5 rounded-full">
            SEE IT IN ACTION
          </span>
          <h2 className="font-sans font-bold text-3xl sm:text-4xl uppercase tracking-tight text-main">
            A Live Example — Try It Yourself
          </h2>
          <p className="text-muted text-sm max-w-md mx-auto font-medium">
            Click through these real career scenarios to see exactly how PathSmith breaks down each option with scores and a year-by-year forecast.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          {/* Path selectors */}
          <div className="lg:col-span-2 space-y-3">
            {mockPaths.map((p, idx) => (
              <button
                key={idx}
                onClick={() => { setPrevMockPath(activeMockPath); setActiveMockPath(idx); }}
                className={`w-full border p-4 text-left relative transition-all duration-300 flex items-start gap-4 rounded-xl ${
                  activeMockPath === idx
                    ? "border-accent bg-accent/8 shadow-md shadow-accent/8"
                    : "border-border-dim bg-surface hover:border-accent/50 hover:bg-surface"
                }`}
              >
                <div
                  className="w-1 self-stretch rounded-full shrink-0 mt-1"
                  style={{ background: p.color, opacity: activeMockPath === idx ? 1 : 0.3 }}
                />
                <div className="flex flex-col gap-1.5 flex-1">
                  {activeMockPath === idx && (
                    <div className="absolute top-3.5 right-3.5 flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full animate-ping-slow" style={{ background: p.color }} />
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: p.color }} />
                    </div>
                  )}
                  <span className="font-mono text-[9px] font-bold tracking-widest uppercase" style={{ color: p.color }}>
                    PATH 0{idx + 1}
                  </span>
                  <span className={`font-sans text-xs font-bold uppercase ${activeMockPath === idx ? "text-main" : "text-muted"}`}>
                    {p.title}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Sandbox Preview */}
          <div className="lg:col-span-3 border border-border-dim bg-surface/80 backdrop-blur-sm p-6 space-y-6 relative rounded-2xl shadow-lg">
            <div
              className="absolute top-0 left-0 w-full h-[3px] rounded-t-2xl transition-all duration-500"
              style={{ background: `linear-gradient(to right, ${activePath.color}, transparent)` }}
            />

            <AnimatePresence mode="wait">
              <motion.div
                key={activeMockPath}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="space-y-1.5">
                  <span className="font-mono text-[9px] text-muted uppercase font-bold block">PATH OVERVIEW</span>
                  <h3 className="font-sans font-bold text-xl text-main uppercase tracking-tight" style={{ color: activePath.color }}>
                    {activePath.title}
                  </h3>
                  <p className="text-sm text-muted font-sans leading-relaxed">{activePath.summary}</p>
                </div>

                {/* Metrics */}
                <div className="border-t border-border-dim/40 pt-5 space-y-3 font-mono text-[10px]">
                  <span className="text-muted uppercase tracking-widest text-[9px] block font-bold">SCORES (out of 10)</span>

                  {[
                    { label: "FINANCIAL STABILITY", value: activePath.metrics.financial, colorOverride: "" },
                    { label: "PERSONAL GROWTH", value: activePath.metrics.growth, colorOverride: "" },
                    { label: "RISK LEVEL", value: activePath.metrics.risk, colorOverride: "#BE123C" },
                    { label: "TIME COMMITMENT", value: activePath.metrics.time, colorOverride: "" },
                  ].map((m) => (
                    <div key={m.label}>
                      <div className="flex justify-between mb-1.5">
                        <span className="uppercase tracking-wider">{m.label}</span>
                        <span className="font-bold" style={{ color: m.colorOverride || activePath.color }}>{m.value}/10</span>
                      </div>
                      <div className="border border-border-dim/60 h-4 flex p-[2.5px] rounded-full overflow-hidden">
                        {Array.from({ length: 10 }).map((_, i) => (
                          <div
                            key={i}
                            className="flex-1 h-full rounded-full mx-[1px] transition-all duration-500"
                            style={{
                              background: i < m.value ? (m.colorOverride || activePath.color) : "transparent",
                              transitionDelay: `${i * 40}ms`,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Timeline */}
                <div className="border-t border-border-dim/40 pt-5 font-mono">
                  <span className="text-muted uppercase tracking-widest text-[9px] block mb-4 font-bold">WHAT HAPPENS OVER TIME</span>
                  <div className="space-y-3">
                    {[
                      { label: "Year 1", value: activePath.timeline.year_1 },
                      { label: "Year 3", value: activePath.timeline.year_3 },
                      { label: "Year 5", value: activePath.timeline.year_5 },
                    ].map((t, i) => (
                      <div key={t.label} className="flex gap-3 items-start">
                        <span className="font-bold text-[9px] tracking-wider w-14 shrink-0 uppercase pt-[2px]" style={{ color: activePath.color }}>
                          {t.label}:
                        </span>
                        <span className="text-muted font-sans text-xs leading-relaxed">{t.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </motion.section>

      {/* ── FOOTER ── */}
      <footer className="bg-surface/60 border-t border-border-dim/60 py-16 px-6 md:px-12 mt-auto">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            {/* Brand */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2.5">
                <div className="w-6 h-6 border-2 border-accent flex items-center justify-center rounded-lg">
                  <div className="w-2.5 h-2.5 bg-accent rounded-[3px]" />
                </div>
                <span className="font-mono tracking-[0.2em] font-bold text-main text-sm">PATHSMITH</span>
              </div>
              <p className="text-muted text-xs leading-relaxed font-sans max-w-xs">
                {"AI-powered help for life's biggest decisions — explore your options, spot blind spots, and move forward with clarity."}
              </p>
            </div>

            {/* Quick Links */}
            <div className="space-y-4">
              <p className="font-mono text-[9px] uppercase tracking-widest font-bold text-muted">Navigation</p>
              <div className="space-y-2.5">
                {[
                  { label: "Launch Simulator", action: focusConsole },
                  { label: "Capabilities", action: () => scrollSection("features") },
                  { label: "Demo Sandbox", action: () => scrollSection("sandbox") },
                ].map((link) => (
                  <button
                    key={link.label}
                    onClick={link.action}
                    className="block font-mono text-[10px] text-muted hover:text-accent transition-colors duration-200 font-medium tracking-wider"
                  >
                    {link.label} →
                  </button>
                ))}
              </div>
            </div>

            {/* Tech Stack */}
            <div className="space-y-4">
              <p className="font-mono text-[9px] uppercase tracking-widest font-bold text-muted">Powered By</p>
              <div className="flex flex-wrap gap-2">
                {["Next.js", "FastAPI", "Gemini AI", "OpenAI", "LangChain", "Ollama"].map((tech) => (
                  <span key={tech} className="font-mono text-[9px] border border-border-dim bg-bg px-2.5 py-1 rounded-full text-muted font-bold uppercase tracking-wider">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-border-dim/50 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <span className="font-mono text-[9px] text-muted/60 uppercase tracking-wider">© 2026 PathSmith · All Rights Reserved</span>
            <div className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
              <span className="font-mono text-[9px] text-muted/60 uppercase tracking-wider">System Online</span>
            </div>
          </div>
        </div>
      </footer>

      {/* History Drawer */}
      <HistoryDrawer isOpen={showHistory} onClose={() => setShowHistory(false)} />
    </div>
  );
}
