"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";

interface ErrorBlockProps {
  message: string;
  onDismiss?: () => void;
}

export function ErrorBlock({ message, onDismiss }: ErrorBlockProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  // Detect quota exceeded errors and show a friendlier message
  const isQuota = message.toLowerCase().includes("quota") || message.toLowerCase().includes("429") || message.toLowerCase().includes("resource exhausted");
  const displayMessage = isQuota
    ? "API quota exhausted. Please update your API key in settings, switch to a different provider, or try again later."
    : message;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8, scale: 0.97 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, type: "spring", stiffness: 200, damping: 20 }}
      className="border border-danger/50 bg-danger/5 p-4 font-mono text-xs text-danger tracking-wide flex items-start gap-3 my-3 rounded-xl"
    >
      <span className="font-bold select-none text-base leading-none shrink-0 mt-0.5">⚠</span>
      <div className="flex-1 min-w-0">
        <p className="font-bold uppercase tracking-wider mb-1 text-[9px]">
          {isQuota ? "API QUOTA EXCEEDED" : "SYSTEM EXCEPTION"}
        </p>
        <p className="opacity-80 text-[10px] leading-relaxed break-words">{displayMessage}</p>
      </div>
      <button
        onClick={handleDismiss}
        className="text-danger/50 hover:text-danger shrink-0 font-bold transition-colors duration-200 text-sm leading-none mt-0.5"
        title="Dismiss"
      >
        ✕
      </button>
    </motion.div>
  );
}
