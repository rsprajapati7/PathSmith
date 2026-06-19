import { create } from "zustand";

export interface Metrics {
  financial_stability: number;
  personal_growth: number;
  risk_level: number;
  time_commitment: number;
}

export interface LongTermTimeline {
  year_1: string;
  year_3: string;
  year_5: string;
}

export interface Path {
  path_id: string;
  title: string;
  summary: string;
  pros?: string[];
  cons?: string[];
  metrics: Metrics;
  timeline: LongTermTimeline;
  hidden_tradeoffs: string[];
}

export interface Recommendation {
  recommended_path_id: string;
  reasoning: string;
  key_factors: string[];
}

export interface ClarifyingQuestion {
  question_id: string;
  text: string;
  options: string[];
}

export interface LLMConfig {
  provider: string; // "openai" | "gemini" | "ollama"
  api_key?: string;
  base_url?: string;
  model_fast?: string;
  model_powerful?: string;
}

export type DecisionMode = "long_term" | "short_term";

interface DecisionStore {
  dilemma: string;
  session_id: string;
  biases: string[];
  questions: ClarifyingQuestion[];
  answers: Record<string, string>;
  paths: Path[];
  branches: Record<string, Path[]>;   // path_id → child paths
  config: LLMConfig;
  profileContext: string;
  decisionMode: DecisionMode;
  recommendation: Recommendation | null;
  setDilemma: (d: string) => void;
  setSession: (id: string, biases: string[], questions: ClarifyingQuestion[]) => void;
  setAnswers: (a: Record<string, string>) => void;
  setPaths: (paths: Path[]) => void;
  addBranch: (parentId: string, child: Path) => void;
  setConfig: (cfg: Partial<LLMConfig>) => void;
  setProfileContext: (text: string) => void;
  setDecisionMode: (mode: DecisionMode) => void;
  setRecommendation: (r: Recommendation | null) => void;
  reset: () => void;
}

const getInitialConfig = (): LLMConfig => {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("pathsmith_llm_config");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback on parsing error
      }
    }
  }
  return {
    provider: "openai",
    api_key: "",
    base_url: "http://localhost:11434/v1",
    model_fast: "",
    model_powerful: "",
  };
};

export const useDecisionStore = create<DecisionStore>((set) => ({
  dilemma: "",
  session_id: "",
  biases: [],
  questions: [],
  answers: {},
  paths: [],
  branches: {},
  config: getInitialConfig(),
  profileContext: "",
  decisionMode: "long_term",
  recommendation: null,
  setDilemma: (d) => set({ dilemma: d }),
  setSession: (id, biases, questions) => set({ session_id: id, biases, questions }),
  setAnswers: (a) => set({ answers: a }),
  setPaths: (paths) => set({ paths }),
  addBranch: (parentId, child) =>
    set((state) => ({
      branches: {
        ...state.branches,
        [parentId]: [...(state.branches[parentId] ?? []), child],
      },
    })),
  setConfig: (cfg) =>
    set((state) => {
      const newConfig = { ...state.config, ...cfg };
      if (typeof window !== "undefined") {
        localStorage.setItem("pathsmith_llm_config", JSON.stringify(newConfig));
      }
      return { config: newConfig };
    }),
  setProfileContext: (text) => set({ profileContext: text }),
  setDecisionMode: (mode) => set({ decisionMode: mode }),
  setRecommendation: (r) => set({ recommendation: r }),
  reset: () =>
    set((state) => ({
      dilemma: "",
      session_id: "",
      biases: [],
      questions: [],
      answers: {},
      paths: [],
      branches: {},
      profileContext: "",
      recommendation: null,
      // Keep configuration and decision mode persistent across sessions
      config: state.config,
      decisionMode: state.decisionMode,
    })),
}));
