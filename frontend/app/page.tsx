"use client";
import React, { useState, useEffect, useRef } from "react";
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

  // Mock Sandbox State
  const [activeMockPath, setActiveMockPath] = useState(0);

  // Sync mounted state to prevent Next.js hydration mismatches from localStorage
  useEffect(() => {
    setMounted(true);
  }, []);

  const consoleRef = useRef<HTMLDivElement>(null);
  const scrollSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const focusConsole = () => {
    if (consoleRef.current) {
      consoleRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

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

  // Mock paths data for the Interactive Sandbox
  const mockPaths = [
    {
      title: "AI Startup Founder",
      summary: "Quit corporate role to co-found a niche generative AI agent consultancy, bootstrapping the initial MVP.",
      metrics: { financial: 3, growth: 10, risk: 9, time: 8 },
      timeline: { year_1: "Sweat equity, zero salary, launch MVP", year_3: "Raise Seed, hire 4 devs, $250k ARR", year_5: "Acquired or series A scale, financial buyout" },
      tradeoffs: ["Extremely high rate of early-stage failure", "Severe personal relationship strain due to 80hr weeks", "Deep identity pivot required"]
    },
    {
      title: "Big Tech Senior Manager",
      summary: "Accept the relocate offer, staying in safe employment, climbing the career path to Director.",
      metrics: { financial: 9, growth: 6, risk: 2, time: 6 },
      timeline: { year_1: "$250k TC, relocate to Dublin, join group team", year_3: "Promotion to Manager II, equity vests", year_5: "$400k TC, high corporate equity, golden handcuffs" },
      tradeoffs: ["High opportunity cost of starting an independent firm", "Geographic relocation strain", "Potential identity foreclosure"]
    },
    {
      title: "Digital Nomad Consultant",
      summary: "Go independent freelance contract advisor, traveling across Southeast Asia.",
      metrics: { financial: 6, growth: 7, risk: 5, time: 4 },
      timeline: { year_1: "First 3 clients secured, relocate to Bali", year_3: "$120k ARR, select work 20hrs/week", year_5: "Create micro-SaaS, steady passive cashflow" },
      tradeoffs: ["Lack of institutional scale or long-term brand building", "Isolation and transient relationship cycles", "Self-employment tax overhead"]
    }
  ];

  return (
    <div className="min-h-screen bg-bg flex flex-col font-sans select-none overflow-x-hidden">
      
      {/* 1. Global Navigation Header */}
      <header className="sticky top-0 z-50 border-b border-border-dim/85 bg-surface/85 backdrop-blur-md px-6 md:px-12 py-3.5 flex justify-between items-center transition-all duration-300">
        <div className="flex items-center space-x-8">
          <div className="flex items-center space-x-2.5 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <div className="w-5 h-5 border border-accent flex items-center justify-center relative rounded-md">
              <div className="w-2.5 h-2.5 bg-accent rounded-[2px]" />
            </div>
            <span className="font-mono text-sm tracking-[0.2em] font-bold text-main glow-text-indigo">
              PATHSMITH
            </span>
          </div>

          <nav className="hidden md:flex items-center space-x-6 font-mono text-[10px] tracking-widest text-muted uppercase font-bold">
            <button onClick={() => scrollSection("features")} className="hover:text-main transition-colors duration-200">
              Capabilities
            </button>
            <button onClick={() => scrollSection("sandbox")} className="hover:text-main transition-colors duration-200">
              Interactive Sandbox
            </button>
            <button onClick={() => scrollSection("pricing")} className="hover:text-main transition-colors duration-200">
              Pricing
            </button>
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          <span className="hidden lg:inline font-mono text-[9px] text-muted uppercase font-bold">
            {mounted ? `ENGINE: ${config.provider.toUpperCase()}` : "LOADING ENGINE..."}
          </span>
          <button
            onClick={focusConsole}
            className="glow-btn border border-accent bg-accent/5 hover:bg-accent hover:text-white font-mono text-[10px] tracking-widest px-4 py-2 text-accent transition-all duration-300 font-bold uppercase rounded-full"
          >
            Launch Simulator
          </button>
        </div>
      </header>

      {/* 2. Hero Section (with embedded simulator) */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center p-6 md:p-12 border-b border-border-dim/50">
        {/* Background glow effects */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gold/5 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/4 w-[300px] h-[300px] bg-accent-glow/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="w-full max-w-4xl text-center z-10 space-y-10">
          {/* Tagline */}
          <div className="space-y-4">
            <motion.div 
              initial={{ opacity: 0, y: -15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center space-x-2"
            >
              <span className="h-[1px] w-5 bg-border-bright" />
              <span className="font-mono text-[9px] tracking-[0.25em] text-border-bright font-bold uppercase">
                COGNITIVE FUTURES SIMULATION
              </span>
              <span className="h-[1px] w-5 bg-border-bright" />
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.15 }}
              className="font-sans font-bold text-4xl sm:text-6xl uppercase tracking-tight leading-[0.95] text-main"
            >
              Model your life.<br />
              <span className="text-accent">Simulate in PathSmith.</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-muted text-xs sm:text-sm max-w-xl mx-auto leading-relaxed font-sans font-medium"
            >
              The unified model playground to scan cognitive fallacies, clarify constraint metrics, and chart branching futures.
            </motion.p>
          </div>

          {/* Prompt Console Widget */}
          <motion.div
            ref={consoleRef}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="w-full max-w-2xl mx-auto border border-border-dim bg-surface/75 backdrop-blur-md p-6 text-left rounded-2xl shadow-lg shadow-accent/5 border-border-dim/80"
          >
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-border-dim/40 pb-2">
                <span className="font-mono text-[9px] text-muted uppercase font-bold">CONSOLE: DILEMMA_INPUT</span>
                <div className="flex items-center space-x-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                  <span className="font-mono text-[9px] text-accent font-bold">READY</span>
                </div>
              </div>

              <div className="relative border border-border-dim bg-surface/40 p-4 rounded-xl">
                <textarea
                  id="dilemma-textarea"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="I am trying to decide whether to leave my corporate engineering job to start a boutique coffee shop, or accept a promotion that requires relocating to another country..."
                  rows={4}
                  disabled={loading}
                  className="w-full bg-transparent p-0 text-sm resize-none focus:outline-none text-main placeholder-muted/60 font-sans leading-relaxed"
                />
                <div className="absolute bottom-3 right-3 font-mono text-[9px] text-gray-500 select-none">
                  chars: {text.length}
                </div>
              </div>

              {/* Collapsible settings toggle */}
              <div className="border-t border-border-dim/40 pt-3">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="flex justify-between items-center w-full font-mono text-[9px] tracking-widest text-muted hover:text-main uppercase transition-colors font-bold"
                >
                  <span>[⚙] Parameters Override</span>
                  <span className="text-accent">
                    {mounted ? `${config.provider.toUpperCase()} ENGINE` : "LOADING..."}{" "}
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
                      <div className="pt-4 mt-3 border-t border-border-dim/40 space-y-4 font-mono text-[10px] text-muted">
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
                                  ? "gemini-1.5-flash"
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
                                  ? "gemini-1.5-pro"
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
              </div>

              {/* Submit Trigger */}
              <div className="pt-2">
                {loading ? (
                  <LoadingSkeleton rows={2} />
                ) : (
                  <button
                    id="analyse-button"
                    onClick={handleSubmit}
                    disabled={!text.trim()}
                    className="w-full border border-accent bg-accent/5 hover:bg-accent hover:text-white font-mono text-[10px] tracking-widest py-3.5 text-accent transition-all duration-300 disabled:opacity-30 disabled:pointer-events-none shadow-[0_0_15px_rgba(52,144,139,0.05)] hover:shadow-[0_0_20px_rgba(52,144,139,0.15)] font-bold uppercase rounded-xl"
                  >
                    INITIALIZE SCENARIO DECRYPTOR →
                  </button>
                )}
              </div>
              
              {error && <ErrorBlock message={error} />}
            </div>
          </motion.div>
        </div>
      </section>

      {/* 3. Capabilities Section */}
      <motion.section 
        id="features" 
        initial={{ opacity: 0, y: 35 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="py-24 px-6 md:px-12 border-b border-border-dim/50 max-w-6xl mx-auto w-full space-y-16"
      >
        <div className="text-center space-y-3">
          <span className="font-mono text-[9px] tracking-widest text-accent font-bold uppercase">
            CORE CAPABILITIES
          </span>
          <h2 className="font-sans font-bold text-3xl uppercase tracking-tight text-main">
            Unified Engine for Future Paths
          </h2>
          <p className="text-muted text-xs sm:text-sm max-w-lg mx-auto font-medium">
            PathSmith combines cognitive psychology and LLM modeling layers to test pathways in a sandbox before commit.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="retool-glow-hover border border-border-dim bg-surface/60 backdrop-blur-sm p-6 space-y-4 relative rounded-2xl shadow-sm">
            <div className="text-accent font-mono text-xs font-bold">[01]</div>
            <h3 className="font-mono text-xs font-bold text-main uppercase tracking-widest">
              Bias Detector
            </h3>
            <p className="text-muted text-xs leading-relaxed font-sans">
              Analyzes your dilemma query instantly to identify cognitive distortions like loss aversion, sunk cost fallacies, or status quo biases.
            </p>
          </div>

          {/* Card 2 */}
          <div className="retool-glow-hover border border-border-dim bg-surface/60 backdrop-blur-sm p-6 space-y-4 relative rounded-2xl shadow-sm">
            <div className="text-accent font-mono text-xs font-bold">[02]</div>
            <h3 className="font-mono text-xs font-bold text-main uppercase tracking-widest">
              Timeline Forecaster
            </h3>
            <p className="text-muted text-xs leading-relaxed font-sans">
              Projects Year 1, Year 3, and Year 5 metrics along three distinct pathways, evaluating wealth options and hidden trade-offs.
            </p>
          </div>

          {/* Card 3 */}
          <div className="retool-glow-hover border border-border-dim bg-surface/60 backdrop-blur-sm p-6 space-y-4 relative rounded-2xl shadow-sm">
            <div className="text-accent font-mono text-xs font-bold">[03]</div>
            <h3 className="font-mono text-xs font-bold text-main uppercase tracking-widest">
              What-If Sandbox
            </h3>
            <p className="text-muted text-xs leading-relaxed font-sans">
              Enables sandbox branching to adjust variables dynamically, recalculating outcomes up to 2 nodes deep.
            </p>
          </div>
        </div>
      </motion.section>

      {/* 4. Interactive Mock Sandbox Section */}
      <motion.section 
        id="sandbox" 
        initial={{ opacity: 0, y: 35 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="py-24 px-6 md:px-12 border-b border-border-dim/50 max-w-6xl mx-auto w-full space-y-16"
      >
        <div className="text-center space-y-3">
          <span className="font-mono text-[9px] tracking-widest text-accent font-bold uppercase">
            PRODUCT DEMO
          </span>
          <h2 className="font-sans font-bold text-3xl uppercase tracking-tight text-main">
            Interactive Mock Sandbox
          </h2>
          <p className="text-muted text-xs max-w-md mx-auto font-medium">
            Toggle between these sample scenarios to preview how PathSmith quantifies and diagrams outcomes.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          {/* Path selectors (2 cols) */}
          <div className="lg:col-span-2 space-y-3 font-mono">
            {mockPaths.map((p, idx) => (
              <button
                key={idx}
                onClick={() => setActiveMockPath(idx)}
                className={`w-full border p-4 text-left relative transition-all duration-300 flex flex-col gap-2 rounded-xl bg-white ${
                  activeMockPath === idx
                    ? "border-accent bg-accent/5 text-main"
                    : "border-border-dim text-muted hover:border-accent hover:text-main"
                }`}
              >
                {activeMockPath === idx && (
                  <div className="absolute top-3.5 right-3.5 w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
                )}
                <span className="text-[10px] font-bold tracking-widest text-accent">PATH 0{idx + 1}</span>
                <span className={`font-sans text-xs font-bold uppercase ${activeMockPath === idx ? "text-main" : "text-muted"}`}>{p.title}</span>
              </button>
            ))}
          </div>

          {/* Sandbox Preview Board (3 cols) */}
          <div className="lg:col-span-3 border border-border-dim bg-surface/70 backdrop-blur-sm p-6 space-y-6 relative rounded-2xl shadow-sm">
            <div className="space-y-1">
              <span className="font-mono text-[9px] text-muted uppercase font-bold block">LIVE SIMULATION OUTPUT</span>
              <h3 className="font-sans font-bold text-lg text-main uppercase">{mockPaths[activeMockPath].title}</h3>
              <p className="text-xs text-muted font-sans leading-normal">{mockPaths[activeMockPath].summary}</p>
            </div>

            {/* Metrics */}
            <div className="border-t border-border-dim/40 pt-4 space-y-3 font-mono text-[10px]">
              <span className="text-muted uppercase tracking-widest text-[9px] block">SIMULATION METRICS</span>
              
              {/* Financial stability */}
              <div>
                <div className="flex justify-between mb-1">
                  <span>FINANCIAL STABILITY</span>
                  <span>{mockPaths[activeMockPath].metrics.financial}/10</span>
                </div>
                <div className="border border-border-dim h-4 flex p-[2.5px] rounded-full">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className={`flex-1 h-full rounded-full mx-[1px] ${i < mockPaths[activeMockPath].metrics.financial ? "bg-accent" : "bg-transparent"}`} />
                  ))}
                </div>
              </div>

              {/* Personal Growth */}
              <div>
                <div className="flex justify-between mb-1">
                  <span>PERSONAL GROWTH</span>
                  <span>{mockPaths[activeMockPath].metrics.growth}/10</span>
                </div>
                <div className="border border-border-dim h-4 flex p-[2.5px] rounded-full">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className={`flex-1 h-full rounded-full mx-[1px] ${i < mockPaths[activeMockPath].metrics.growth ? "bg-accent" : "bg-transparent"}`} />
                  ))}
                </div>
              </div>

              {/* Risk Level */}
              <div>
                <div className="flex justify-between mb-1">
                  <span>RISK LEVEL</span>
                  <span className="text-danger">{mockPaths[activeMockPath].metrics.risk}/10</span>
                </div>
                <div className="border border-border-dim h-4 flex p-[2.5px] rounded-full">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className={`flex-1 h-full rounded-full mx-[1px] ${i < mockPaths[activeMockPath].metrics.risk ? "bg-danger" : "bg-transparent"}`} />
                  ))}
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="border-t border-border-dim/40 pt-4 font-mono text-xs">
              <span className="text-muted uppercase tracking-widest text-[9px] block mb-3 font-bold">TIMELINE PROJECTION</span>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <span className="text-accent uppercase text-[9px] tracking-wider font-bold w-12 shrink-0">Year 1:</span>
                  <span className="text-muted font-sans text-xs">{mockPaths[activeMockPath].timeline.year_1}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-accent uppercase text-[9px] tracking-wider font-bold w-12 shrink-0">Year 3:</span>
                  <span className="text-muted font-sans text-xs">{mockPaths[activeMockPath].timeline.year_3}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-accent uppercase text-[9px] tracking-wider font-bold w-12 shrink-0">Year 5:</span>
                  <span className="text-muted font-sans text-xs">{mockPaths[activeMockPath].timeline.year_5}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* 5. Pricing Section */}
      <motion.section 
        id="pricing" 
        initial={{ opacity: 0, y: 35 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="py-24 px-6 md:px-12 border-b border-border-dim/50 max-w-6xl mx-auto w-full space-y-16"
      >
        <div className="text-center space-y-3">
          <span className="font-mono text-[9px] tracking-widest text-accent font-bold uppercase">
            PRICING PLANS
          </span>
          <h2 className="font-sans font-bold text-3xl uppercase tracking-tight text-white">
            Pricing built for every scale
          </h2>
          <p className="text-gray-400 text-xs max-w-md mx-auto">
            Choose a plan that fits your strategy needs, from free local models to high-volume enterprise pipelines.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono">
          {/* Card 1 */}
          <div className="border border-border-dim bg-surface/10 p-6 flex flex-col justify-between h-[380px] relative rounded-2xl">
            <div className="space-y-6">
              <div className="space-y-1">
                <span className="text-[9px] text-gray-500 tracking-wider block uppercase">FREE PLAN</span>
                <h3 className="font-sans font-bold text-2xl text-white">$0</h3>
              </div>
              <p className="text-gray-400 text-xs font-sans leading-relaxed">
                Standard dilemma dilemma, 3 parallel paths, and integration with local Ollama endpoints out-of-the-box.
              </p>
            </div>
            <button onClick={focusConsole} className="w-full border border-border-dim py-2.5 text-xs text-gray-400 hover:border-white hover:text-white hover:bg-white/5 transition-all duration-300 rounded-full">
              GET STARTED
            </button>
          </div>

          {/* Card 2 */}
          <div className="border border-border-bright bg-border-bright/5 p-6 flex flex-col justify-between h-[380px] relative rounded-2xl">
            <div className="absolute top-3 right-3 bg-border-bright text-black font-bold px-2.5 py-0.5 text-[8px] tracking-widest uppercase rounded-full">
              POPULAR
            </div>
            
            <div className="space-y-6">
              <div className="space-y-1">
                <span className="text-[9px] text-border-bright tracking-wider block uppercase">STRATEGIST PLAN</span>
                <h3 className="font-sans font-bold text-2xl text-white">$15<span className="text-xs text-gray-400">/mo</span></h3>
              </div>
              <p className="text-gray-400 text-xs font-sans leading-relaxed">
                Includes deeper What-If sandboxes (up to 5 levels), API key overrides for Gemini and OpenAI GPT-4o-mini, and bias summary exports.
              </p>
            </div>
            <button onClick={focusConsole} className="w-full border border-border-bright bg-border-bright py-2.5 text-xs text-black font-bold hover:opacity-90 transition-opacity rounded-full">
              UPGRADE NOW
            </button>
          </div>

          {/* Card 3 */}
          <div className="border border-border-dim bg-surface/10 p-6 flex flex-col justify-between h-[380px] relative rounded-2xl">
            <div className="space-y-6">
              <div className="space-y-1">
                <span className="text-[9px] text-gray-500 tracking-wider block uppercase">ENTERPRISE PLAN</span>
                <h3 className="font-sans font-bold text-2xl text-white">Custom</h3>
              </div>
              <p className="text-gray-400 text-xs font-sans leading-relaxed">
                Unlimited concurrent session logs, custom model mappings, priority API rate allocations, and dedicated enterprise support.
              </p>
            </div>
            <button onClick={focusConsole} className="w-full border border-border-dim py-2.5 text-xs text-gray-400 hover:border-white hover:text-white hover:bg-white/5 transition-all duration-300 rounded-full">
              CONTACT SALES
            </button>
          </div>
        </div>
      </motion.section>

      {/* 6. Footer Section */}
      <footer className="bg-bg border-t border-border-dim/80 py-12 px-6 md:px-12 mt-auto font-mono text-[10px] text-gray-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex items-center space-x-2.5">
            <div className="w-4 h-4 border border-accent flex items-center justify-center relative rounded-md">
              <div className="w-2.5 h-2.5 bg-accent rounded-[2px]" />
            </div>
            <span className="tracking-[0.2em] font-bold text-main text-[11px]">
              PATHSMITH
            </span>
          </div>
          
          <div className="flex space-x-6 text-[9px] uppercase tracking-wider">
            <span>© 2026 PathSmith. All Rights Reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
