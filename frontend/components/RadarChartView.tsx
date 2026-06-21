"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { Path } from "@/store/decisionStore";

interface RadarChartViewProps {
  paths: Path[];
}

const PATH_COLORS = ["#34908B", "#4A7FC1", "#7C5CBF"];
const METRIC_LABELS: Record<string, string> = {
  financial_stability: "Financial",
  personal_growth: "Growth",
  risk_level: "Risk",
  time_commitment: "Time",
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface border border-border-dim rounded-xl px-3 py-2 shadow-lg">
        {payload.map((entry: any) => (
          <div key={entry.name} className="flex items-center gap-2 text-[10px] font-mono font-bold">
            <span className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
            <span style={{ color: entry.color }}>{entry.name}</span>
            <span className="text-main">{entry.value}/10</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function RadarChartView({ paths }: RadarChartViewProps) {
  const [visible, setVisible] = useState(true);

  // Build data format expected by recharts
  const metrics = ["financial_stability", "personal_growth", "risk_level", "time_commitment"];
  const data = metrics.map((key) => ({
    metric: METRIC_LABELS[key] ?? key,
    ...paths.reduce(
      (acc, path, i) => ({
        ...acc,
        [path.title]: path.metrics[key as keyof typeof path.metrics],
      }),
      {}
    ),
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="mb-6 border border-border-dim/60 bg-surface/70 backdrop-blur-sm rounded-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border-dim/40">
        <div className="flex items-center gap-2.5">
          <div className="w-1.5 h-4 bg-accent rounded-full" />
          <span className="font-mono text-[10px] font-bold text-main uppercase tracking-widest">
            Metric Radar — All Paths
          </span>
        </div>
        <button
          onClick={() => setVisible((v) => !v)}
          className="font-mono text-[9px] border border-border-dim text-muted hover:text-accent hover:border-accent px-3 py-1.5 rounded-lg uppercase tracking-widest font-bold transition-all duration-200"
        >
          {visible ? "Hide ▲" : "Show ▼"}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {visible && (
          <motion.div
            key="chart"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="p-4 sm:p-6">
              {/* Legend */}
              <div className="flex items-center gap-4 flex-wrap mb-4">
                {paths.map((path, i) => (
                  <div key={path.path_id} className="flex items-center gap-1.5">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ background: PATH_COLORS[i % PATH_COLORS.length] }}
                    />
                    <span className="font-mono text-[9px] font-bold text-muted uppercase tracking-wider">
                      {path.title}
                    </span>
                  </div>
                ))}
              </div>

              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={data} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                  <PolarGrid
                    stroke="rgba(52, 144, 139, 0.12)"
                    strokeDasharray="3 3"
                  />
                  <PolarAngleAxis
                    dataKey="metric"
                    tick={{
                      fontSize: 10,
                      fontFamily: "monospace",
                      fontWeight: 700,
                      fill: "#4e6a6c",
                    }}
                    tickFormatter={(val) => String(val).toUpperCase()}
                  />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 10]}
                    tick={{ fontSize: 8, fill: "#4e6a6c", fontFamily: "monospace", dx: 4 }}
                    tickCount={6}
                    stroke="transparent"
                    orientation="left"
                  />
                  {paths.map((path, i) => (
                    <Radar
                      key={path.path_id}
                      name={path.title}
                      dataKey={path.title}
                      stroke={PATH_COLORS[i % PATH_COLORS.length]}
                      fill={PATH_COLORS[i % PATH_COLORS.length]}
                      fillOpacity={0.15}
                      strokeWidth={2}
                      dot={{ r: 3, fill: PATH_COLORS[i % PATH_COLORS.length], strokeWidth: 0 }}
                    />
                  ))}
                  <Tooltip content={<CustomTooltip />} />
                </RadarChart>
              </ResponsiveContainer>

              <p className="text-center font-mono text-[9px] text-muted/50 uppercase tracking-widest mt-1">
                All metrics scored 1–10
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
