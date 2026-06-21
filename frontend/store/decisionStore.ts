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

export interface StressTestResult {
  path_id: string;
  failure_scenario: string;
  resilience_rating: number; // 1-10
  mitigation_actions: string[];
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

export interface HistoryEntry {
  id: string;
  timestamp: number;
  dilemma: string;
  decisionMode: DecisionMode;
  paths: Path[];
  recommendation: Recommendation | null;
  biases: string[];
}

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
  stressTest: StressTestResult[] | null;
  history: HistoryEntry[];
  setDilemma: (d: string) => void;
  setSession: (id: string, biases: string[], questions: ClarifyingQuestion[]) => void;
  setAnswers: (a: Record<string, string>) => void;
  setPaths: (paths: Path[]) => void;
  addBranch: (parentId: string, child: Path) => void;
  setConfig: (cfg: Partial<LLMConfig>) => void;
  setProfileContext: (text: string) => void;
  setDecisionMode: (mode: DecisionMode) => void;
  setRecommendation: (r: Recommendation | null) => void;
  setStressTest: (results: StressTestResult[] | null) => void;
  saveToHistory: () => void;
  loadFromHistory: (id: string) => void;
  deleteFromHistory: (id: string) => void;
  reset: () => void;
}

const HISTORY_KEY = "pathsmith_history";

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

const getInitialHistory = (): HistoryEntry[] => {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem(HISTORY_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
  }
  return [];
};

const saveHistoryToStorage = (history: HistoryEntry[]) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }
};

export const useDecisionStore = create<DecisionStore>((set, get) => ({
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
  stressTest: null,
  history: getInitialHistory(),
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
  setStressTest: (results) => set({ stressTest: results }),
  saveToHistory: () => {
    const state = get();
    if (!state.paths.length) return;
    const entry: HistoryEntry = {
      id: `hist_${Date.now()}`,
      timestamp: Date.now(),
      dilemma: state.dilemma,
      decisionMode: state.decisionMode,
      paths: state.paths,
      recommendation: state.recommendation,
      biases: state.biases,
    };
    const newHistory = [entry, ...state.history].slice(0, 20); // keep latest 20
    saveHistoryToStorage(newHistory);
    set({ history: newHistory });
  },
  loadFromHistory: (id) => {
    const state = get();
    const entry = state.history.find((h) => h.id === id);
    if (!entry) return;
    set({
      dilemma: entry.dilemma,
      paths: entry.paths,
      recommendation: entry.recommendation,
      biases: entry.biases,
      decisionMode: entry.decisionMode,
      stressTest: null,
      session_id: entry.id, // use history id as pseudo-session
    });
  },
  deleteFromHistory: (id) => {
    set((state) => {
      const newHistory = state.history.filter((h) => h.id !== id);
      saveHistoryToStorage(newHistory);
      return { history: newHistory };
    });
  },
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
      stressTest: null,
      // Keep configuration, decision mode, and history persistent across sessions
      config: state.config,
      decisionMode: state.decisionMode,
      history: state.history,
    })),
}));
