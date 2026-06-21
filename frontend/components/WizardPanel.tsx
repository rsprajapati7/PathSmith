"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface WizardPanelProps {
  onComplete: (dilemma: string) => void;
  onCancel: () => void;
}

const CONSTRAINT_OPTIONS = [
  { id: "budget", label: "💰 Budget", desc: "Financial limits are a major factor" },
  { id: "time", label: "⏱ Time", desc: "Limited time or tight deadlines" },
  { id: "family", label: "👨‍👩‍👧 Family", desc: "Family commitments or dependents" },
  { id: "career", label: "📈 Career", desc: "Career growth and professional goals" },
  { id: "health", label: "❤️ Health", desc: "Physical or mental health considerations" },
  { id: "location", label: "📍 Location", desc: "Geographic or relocation constraints" },
  { id: "values", label: "🧭 Values", desc: "Personal ethics or lifestyle values" },
  { id: "relationships", label: "🤝 Social", desc: "Friendships, relationships, community" },
];

type Step = 0 | 1 | 2;

export function WizardPanel({ onComplete, onCancel }: WizardPanelProps) {
  const [step, setStep] = useState<Step>(0);
  const [coreDecision, setCoreDecision] = useState("");
  const [options, setOptions] = useState(["", "", ""]);
  const [constraints, setConstraints] = useState<string[]>([]);

  const canProceedStep0 = coreDecision.trim().length >= 15;
  const canProceedStep1 = options.filter((o) => o.trim()).length >= 2;
  const canProceedStep2 = constraints.length >= 1;

  function toggleConstraint(id: string) {
    setConstraints((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }

  function updateOption(idx: number, val: string) {
    setOptions((prev) => {
      const next = [...prev];
      next[idx] = val;
      return next;
    });
  }

  function handleBuild() {
    const validOptions = options.filter((o) => o.trim());
    const constraintLabels = constraints.map(
      (id) => CONSTRAINT_OPTIONS.find((c) => c.id === id)?.label.replace(/^\S+\s/, "") ?? id
    );
    const dilemma = [
      coreDecision.trim(),
      `The options I am considering are: ${validOptions.join(", ")}.`,
      constraintLabels.length > 0
        ? `My primary constraints are: ${constraintLabels.join(", ")}.`
        : "",
    ]
      .filter(Boolean)
      .join(" ");
    onComplete(dilemma);
  }

  const steps = [
    { label: "Decision", num: "01" },
    { label: "Options", num: "02" },
    { label: "Constraints", num: "03" },
  ];

  return (
    <div className="border border-border-dim bg-bg/30 rounded-xl overflow-hidden">
      {/* Step Progress */}
      <div className="flex border-b border-border-dim/40 bg-surface/30">
        {steps.map((s, i) => (
          <button
            key={i}
            onClick={() => i < step ? setStep(i as Step) : undefined}
            className={`flex-1 py-2.5 px-2 flex flex-col items-center gap-0.5 transition-all duration-200 ${
              step === i
                ? "bg-accent/10 border-b-2 border-accent"
                : i < step
                ? "opacity-60 cursor-pointer hover:opacity-80"
                : "opacity-30 cursor-not-allowed"
            }`}
          >
            <span
              className="font-mono text-[8px] font-bold"
              style={{ color: step === i ? "#34908B" : "inherit" }}
            >
              {s.num}
            </span>
            <span
              className="font-mono text-[8px] uppercase tracking-wider font-bold"
              style={{ color: step === i ? "#34908B" : "#6B8C8E" }}
            >
              {s.label}
            </span>
          </button>
        ))}
      </div>

      <div className="p-4">
        <AnimatePresence mode="wait">
          {/* Step 0: Core Decision */}
          {step === 0 && (
            <motion.div
              key="step0"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="space-y-3"
            >
              <p className="font-mono text-[9px] font-bold text-main uppercase tracking-widest">
                What core dilemma are you facing?
              </p>
              <p className="text-[10px] text-muted font-sans">
                Describe the situation in 1–3 sentences. Be specific about what makes this decision hard.
              </p>
              <textarea
                value={coreDecision}
                onChange={(e) => setCoreDecision(e.target.value)}
                rows={3}
                placeholder="I need to decide whether to quit my stable corporate job to pursue a startup idea that could be life-changing but carries significant risk..."
                className="w-full bg-bg/40 border border-border-dim focus:border-accent rounded-xl p-3 text-sm text-main placeholder-muted/40 font-sans resize-none focus:outline-none transition-colors duration-200 leading-relaxed"
              />
              <div className="flex justify-between items-center">
                <span className="font-mono text-[9px] text-muted/50">
                  {coreDecision.length < 15 ? `${15 - coreDecision.length} more chars needed` : `${coreDecision.length} chars`}
                </span>
                <button
                  onClick={() => setStep(1)}
                  disabled={!canProceedStep0}
                  className="glow-btn font-mono text-[9px] font-bold uppercase tracking-widest border-2 border-accent bg-accent text-white px-4 py-2 rounded-xl disabled:opacity-30 disabled:pointer-events-none hover:shadow-md hover:shadow-accent/20 transition-all duration-200"
                >
                  Next →
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 1: Options */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="space-y-3"
            >
              <p className="font-mono text-[9px] font-bold text-main uppercase tracking-widest">
                What options are you considering?
              </p>
              <p className="text-[10px] text-muted font-sans">
                Enter at least 2 specific paths or choices you're weighing up.
              </p>
              <div className="space-y-2">
                {options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="font-mono text-[9px] font-bold text-accent w-4 shrink-0">
                      {i + 1}.
                    </span>
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => updateOption(i, e.target.value)}
                      placeholder={
                        i === 0
                          ? "e.g. Start the startup full-time"
                          : i === 1
                          ? "e.g. Keep corporate job and build on weekends"
                          : "e.g. Take a sabbatical to decide (optional)"
                      }
                      className="flex-1 bg-bg/40 border border-border-dim focus:border-accent rounded-xl px-3 py-2 text-[11px] text-main placeholder-muted/40 font-sans focus:outline-none transition-colors duration-200"
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center">
                <button
                  onClick={() => setStep(0)}
                  className="font-mono text-[9px] font-bold uppercase tracking-widest border border-border-dim text-muted hover:text-main px-4 py-2 rounded-xl transition-all duration-200"
                >
                  ← Back
                </button>
                <button
                  onClick={() => setStep(2)}
                  disabled={!canProceedStep1}
                  className="glow-btn font-mono text-[9px] font-bold uppercase tracking-widest border-2 border-accent bg-accent text-white px-4 py-2 rounded-xl disabled:opacity-30 disabled:pointer-events-none hover:shadow-md hover:shadow-accent/20 transition-all duration-200"
                >
                  Next →
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Constraints */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="space-y-3"
            >
              <p className="font-mono text-[9px] font-bold text-main uppercase tracking-widest">
                What are your primary constraints?
              </p>
              <p className="text-[10px] text-muted font-sans">
                Select all that significantly affect your decision.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {CONSTRAINT_OPTIONS.map((c) => {
                  const active = constraints.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      onClick={() => toggleConstraint(c.id)}
                      className={`border p-2.5 text-left rounded-xl transition-all duration-200 flex flex-col gap-0.5 ${
                        active
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-border-dim text-muted hover:border-accent/50 hover:text-main bg-surface/50"
                      }`}
                    >
                      <span className="font-sans text-xs font-semibold">{c.label}</span>
                      <span className="font-sans text-[9px] opacity-70 leading-tight">{c.desc}</span>
                    </button>
                  );
                })}
              </div>
              <div className="flex justify-between items-center pt-1">
                <button
                  onClick={() => setStep(1)}
                  className="font-mono text-[9px] font-bold uppercase tracking-widest border border-border-dim text-muted hover:text-main px-4 py-2 rounded-xl transition-all duration-200"
                >
                  ← Back
                </button>
                <button
                  onClick={handleBuild}
                  disabled={!canProceedStep2}
                  className="glow-btn font-mono text-[9px] font-bold uppercase tracking-widest border-2 border-accent bg-accent text-white px-5 py-2 rounded-xl disabled:opacity-30 disabled:pointer-events-none hover:shadow-md hover:shadow-accent/20 transition-all duration-200"
                >
                  Build & Analyse →
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
