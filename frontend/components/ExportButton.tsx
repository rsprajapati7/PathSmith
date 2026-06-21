"use client";
import React, { useState } from "react";
import { Path, Recommendation, DecisionMode } from "@/store/decisionStore";

interface ExportButtonProps {
  paths: Path[];
  dilemma: string;
  recommendation: Recommendation | null;
  decisionMode: DecisionMode;
}

const PATH_COLORS_HEX = ["#34908B", "#4A7FC1", "#7C5CBF"];

export function ExportButton({ paths, dilemma, recommendation, decisionMode }: ExportButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      // Dynamic import to avoid SSR issues
      const jsPDFModule = await import("jspdf");
      const jsPDF = jsPDFModule.default;

      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 16;
      const colW = pageW - margin * 2;
      let y = margin;

      // ── Helper functions ──
      const checkPageBreak = (needed: number) => {
        if (y + needed > pageH - margin) {
          doc.addPage();
          y = margin;
        }
      };

      const drawSectionHeader = (text: string, color: [number, number, number] = [52, 144, 139]) => {
        checkPageBreak(12);
        doc.setFillColor(...color);
        doc.rect(margin, y, 3, 6, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(...color);
        doc.text(text.toUpperCase(), margin + 6, y + 4.5);
        y += 10;
        doc.setTextColor(30, 30, 30);
      };

      const drawText = (text: string, size: number, bold = false, color: [number, number, number] = [30, 30, 30], indent = 0) => {
        doc.setFont("helvetica", bold ? "bold" : "normal");
        doc.setFontSize(size);
        doc.setTextColor(...color);
        const lines = doc.splitTextToSize(text, colW - indent);
        checkPageBreak(lines.length * (size * 0.4 + 1));
        doc.text(lines, margin + indent, y);
        y += lines.length * (size * 0.4 + 1) + 1;
      };

      const drawDivider = () => {
        checkPageBreak(5);
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.3);
        doc.line(margin, y, pageW - margin, y);
        y += 5;
      };

      // ── COVER ──
      // Background header band
      doc.setFillColor(10, 18, 22);
      doc.rect(0, 0, pageW, 50, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(52, 144, 139);
      doc.text("PATHSMITH", margin, 22);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(120, 160, 158);
      doc.text("Decision Simulation Report", margin, 30);

      doc.setFontSize(7.5);
      doc.setTextColor(80, 110, 110);
      doc.text(
        `Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}`,
        margin,
        38
      );
      doc.text(
        `Mode: ${decisionMode === "short_term" ? "Short Term (6–12 months)" : "Long Term (Year 1–5)"}`,
        margin,
        44
      );

      y = 60;

      // ── DILEMMA ──
      drawSectionHeader("Decision Dilemma");
      doc.setFillColor(245, 250, 250);
      const dilemmaLines = doc.splitTextToSize(`"${dilemma}"`, colW - 8);
      const dilemmaH = dilemmaLines.length * 4.5 + 6;
      checkPageBreak(dilemmaH + 6);
      doc.roundedRect(margin, y, colW, dilemmaH, 2, 2, "F");
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.setTextColor(40, 60, 60);
      doc.text(dilemmaLines, margin + 4, y + 5.5);
      y += dilemmaH + 8;

      // ── AI RECOMMENDATION ──
      if (recommendation) {
        const recPath = paths.find((p) => p.path_id === recommendation.recommended_path_id);
        if (recPath) {
          drawSectionHeader("AI Recommendation");
          doc.setFillColor(52, 144, 139, 0.08);
          doc.setFillColor(236, 248, 247);
          const recLines = doc.splitTextToSize(recommendation.reasoning, colW - 8);
          const recH = recLines.length * 4.5 + 20;
          checkPageBreak(recH + 6);
          doc.roundedRect(margin, y, colW, recH, 2, 2, "F");
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.setTextColor(52, 144, 139);
          doc.text(`✦ ${recPath.title}`, margin + 4, y + 7);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8.5);
          doc.setTextColor(50, 70, 70);
          doc.text(recLines, margin + 4, y + 14);
          y += recH + 6;

          // Key factors
          if (recommendation.key_factors.length > 0) {
            checkPageBreak(8);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(8);
            doc.setTextColor(52, 144, 139);
            doc.text("Key Factors:", margin, y);
            y += 5;
            recommendation.key_factors.forEach((f) => {
              checkPageBreak(6);
              doc.setFont("helvetica", "normal");
              doc.setFontSize(8);
              doc.setTextColor(50, 70, 70);
              const fLines = doc.splitTextToSize(`• ${f}`, colW - 6);
              doc.text(fLines, margin + 3, y);
              y += fLines.length * 4 + 1;
            });
            y += 4;
          }
          drawDivider();
        }
      }

      // ── PATHS ──
      drawSectionHeader("Generated Paths");
      y += 2;

      paths.forEach((path, idx) => {
        const hexColor = PATH_COLORS_HEX[idx] ?? "#34908B";
        // Parse hex to rgb
        const r = parseInt(hexColor.slice(1, 3), 16);
        const g = parseInt(hexColor.slice(3, 5), 16);
        const b = parseInt(hexColor.slice(5, 7), 16);

        checkPageBreak(20);

        // Path header
        doc.setFillColor(r, g, b);
        doc.rect(margin, y, colW, 0.6, "F");
        y += 3;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(r, g, b);
        doc.text(`PATH 0${idx + 1}`, margin, y + 4);
        doc.setFontSize(12);
        doc.text(path.title.toUpperCase(), margin, y + 10);
        y += 14;

        // Summary
        drawText(path.summary, 8.5, false, [60, 80, 80]);
        y += 2;

        // Metrics
        checkPageBreak(30);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(100, 130, 130);
        doc.text("METRICS", margin, y);
        y += 4;

        const metricEntries = Object.entries(path.metrics);
        metricEntries.forEach(([key, val]) => {
          checkPageBreak(6);
          const label = key.replace(/_/g, " ").toUpperCase();
          doc.setFont("helvetica", "normal");
          doc.setFontSize(7.5);
          doc.setTextColor(70, 90, 90);
          doc.text(label, margin, y + 3.5);
          // Bar background
          doc.setFillColor(230, 235, 235);
          doc.roundedRect(margin + 42, y, 60, 4, 1, 1, "F");
          // Bar fill
          doc.setFillColor(r, g, b);
          doc.roundedRect(margin + 42, y, (val / 10) * 60, 4, 1, 1, "F");
          // Score
          doc.setFont("helvetica", "bold");
          doc.setTextColor(r, g, b);
          doc.text(`${val}/10`, margin + 105, y + 3.5);
          y += 6;
        });
        y += 3;

        // Pros & Cons
        if ((path.pros && path.pros.length > 0) || (path.cons && path.cons.length > 0)) {
          checkPageBreak(20);
          const halfW = (colW - 4) / 2;
          if (path.pros && path.pros.length > 0) {
            doc.setFont("helvetica", "bold");
            doc.setFontSize(7.5);
            doc.setTextColor(34, 120, 80);
            doc.text("▲ PROS", margin, y);
            y += 4;
            path.pros.forEach((pro) => {
              checkPageBreak(5);
              doc.setFont("helvetica", "normal");
              doc.setFontSize(7.5);
              doc.setTextColor(50, 80, 60);
              const lines = doc.splitTextToSize(`+ ${pro}`, halfW);
              doc.text(lines, margin + 2, y);
              y += lines.length * 3.5;
            });
            y += 2;
          }
          if (path.cons && path.cons.length > 0) {
            doc.setFont("helvetica", "bold");
            doc.setFontSize(7.5);
            doc.setTextColor(190, 18, 60);
            doc.text("▼ CONS", margin, y);
            y += 4;
            path.cons.forEach((con) => {
              checkPageBreak(5);
              doc.setFont("helvetica", "normal");
              doc.setFontSize(7.5);
              doc.setTextColor(120, 40, 50);
              const lines = doc.splitTextToSize(`− ${con}`, halfW);
              doc.text(lines, margin + 2, y);
              y += lines.length * 3.5;
            });
            y += 2;
          }
        }

        // Timeline
        checkPageBreak(25);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(100, 130, 130);
        doc.text(decisionMode === "short_term" ? "NEAR-TERM OUTLOOK" : "TIMELINE PROJECTION", margin, y);
        y += 5;

        const timelineKeys = decisionMode === "short_term"
          ? ["year_1"]
          : ["year_1", "year_3", "year_5"];

        timelineKeys.forEach((yk) => {
          const val = path.timeline[yk as keyof typeof path.timeline];
          if (!val || val.startsWith("(Short-term")) return;
          checkPageBreak(8);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(7.5);
          doc.setTextColor(r, g, b);
          doc.text(`${yk.replace("_", " ").toUpperCase()}:`, margin, y);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(60, 80, 80);
          const tLines = doc.splitTextToSize(val, colW - 20);
          doc.text(tLines, margin + 18, y);
          y += Math.max(tLines.length * 3.8, 5) + 1;
        });
        y += 3;

        // Hidden Tradeoffs
        if (path.hidden_tradeoffs.length > 0) {
          checkPageBreak(10);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(7.5);
          doc.setTextColor(150, 80, 80);
          doc.text("HIDDEN TRADEOFFS", margin, y);
          y += 4;
          path.hidden_tradeoffs.forEach((t) => {
            checkPageBreak(6);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(7.5);
            doc.setTextColor(100, 60, 60);
            const lines = doc.splitTextToSize(`[!] ${t}`, colW - 4);
            doc.text(lines, margin + 2, y);
            y += lines.length * 3.8 + 1;
          });
        }

        y += 6;
        if (idx < paths.length - 1) drawDivider();
      });

      // ── FOOTER on last page ──
      const totalPages = (doc.internal as any).getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(6.5);
        doc.setTextColor(160, 170, 170);
        doc.text("PathSmith · AI Life Decision Simulator", margin, pageH - 6);
        doc.text(`Page ${i} of ${totalPages}`, pageW - margin - 14, pageH - 6);
      }

      const dateStr = new Date().toISOString().slice(0, 10);
      doc.save(`pathsmith-report-${dateStr}.pdf`);
    } catch (err) {
      console.error("[ExportButton] Error generating PDF:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="font-mono text-[10px] tracking-widest border border-border-dim px-4 py-2 text-muted hover:text-accent hover:border-accent hover:bg-accent/5 transition-all duration-300 uppercase font-bold rounded-xl h-9 flex items-center gap-1.5 disabled:opacity-40 disabled:pointer-events-none"
      title="Export PDF Report"
    >
      {loading ? (
        <>
          <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span>Exporting…</span>
        </>
      ) : (
        <>⬇ PDF</>
      )}
    </button>
  );
}
