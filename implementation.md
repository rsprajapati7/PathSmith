# Life Decision Simulator — Technical Implementation Plan

## System Architecture & Tech Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion, Zustand
- **Backend:** Python 3.11+, FastAPI, Uvicorn
- **AI/LLM:** LangChain (LCEL), OpenAI `gpt-4o-mini` (path generation) / `gpt-4o` (what-if branching). Structured outputs via Pydantic + `with_structured_output`.
- **Communication:** REST API (POST requests with JSON). Next.js API routes proxy all FastAPI calls to keep the OpenAI key server-side only.
- **Session storage:** In-memory Python dict (suitable for demo/hackathon). Swap for Redis in production.
- **Secret management:** `.env` files on both backend and frontend. Never hardcode keys.

---

## Part 0: Environment & Secret Management

### Backend — `backend/.env`

```env
OPENAI_API_KEY=sk-...
ALLOWED_ORIGIN=http://localhost:3000
```

Load in `main.py` via `python-dotenv`:

```python
from dotenv import load_dotenv
load_dotenv()
import os
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
ALLOWED_ORIGIN = os.getenv("ALLOWED_ORIGIN", "http://localhost:3000")
```

### Frontend — `frontend/.env.local`

```env
NEXT_PUBLIC_INTERNAL_API=/api   # points to Next.js proxy routes only
BACKEND_URL=http://localhost:8000
```

The frontend **never** receives the OpenAI key. All LLM calls flow:

```
Browser → Next.js API Route (/api/*) → FastAPI backend → OpenAI
```

---

## Part 1: Backend Framework (FastAPI + LLM Logic)

### 1. Directory Structure

```
backend/
├── main.py           # FastAPI entry point, CORS, session store
├── models.py         # Pydantic schemas
├── prompts.py        # System prompts
├── chains.py         # LangChain/LCEL logic
├── .env              # Secrets (git-ignored)
└── requirements.txt  # Pinned dependencies
```

### 2. Pinned Dependencies — `requirements.txt`

```
fastapi==0.111.0
uvicorn[standard]==0.29.0
pydantic==2.7.1
langchain==0.2.1
langchain-openai==0.1.8
openai==1.30.1
python-dotenv==1.0.1
tenacity==8.3.0
```

Install: `pip install -r requirements.txt`

### 3. Pydantic Data Models — `models.py`

```python
from pydantic import BaseModel, Field
from typing import List, Optional

class Metrics(BaseModel):
    financial_stability: int = Field(description="Score 1-10")
    personal_growth: int = Field(description="Score 1-10")
    risk_level: int = Field(description="Score 1-10")
    time_commitment: int = Field(description="Score 1-10")

class Timeline(BaseModel):
    year_1: str
    year_3: str
    year_5: str

class Path(BaseModel):
    path_id: str
    title: str
    summary: str
    metrics: Metrics
    timeline: Timeline
    hidden_tradeoffs: List[str]

class ClarifyingQuestion(BaseModel):
    question_id: str
    text: str
    options: List[str]

class StartSessionResponse(BaseModel):
    session_id: str
    detected_biases: List[str]
    clarifying_questions: List[ClarifyingQuestion]

class GeneratePathsResponse(BaseModel):
    paths: List[Path]

class WhatIfResponse(BaseModel):
    original_path_id: str
    what_if_scenario: str
    modified_path: Path

# ── Request bodies ──────────────────────────────────────────────
class StartSessionRequest(BaseModel):
    dilemma: str

class GeneratePathsRequest(BaseModel):
    session_id: str
    dilemma: str
    answers: dict

class WhatIfRequest(BaseModel):
    session_id: str
    original_path: Path
    what_if_scenario: str
```

### 4. AI Prompt Architecture — `prompts.py`

Temperature is intentionally low (`0.3`) for all structured metric fields to ensure schema compliance. Higher temperature risks producing out-of-range integers or malformed JSON.

```python
START_SESSION_PROMPT = """
You are a sharp, empathetic life strategist. Analyze the user's dilemma below.

1. Identify up to 3 cognitive biases present (e.g. sunk cost fallacy, status quo
   bias, optimism bias, loss aversion). Be specific and name the exact bias.
2. Generate exactly 3 highly targeted clarifying questions to surface the user's
   real constraints, core values, and risk tolerance. Each question must have
   exactly 4 answer options (the last may be "Other / none of these").

Output ONLY valid JSON matching the schema. No preamble, no markdown.

DILEMMA:
{dilemma}
"""

GENERATE_PATHS_PROMPT = """
You are a ruthless life strategist. The user has provided their dilemma and
answered three clarifying questions. Your job: model 3 genuinely distinct paths.

Rules:
- Each path must be meaningfully different (not just optimistic/neutral/pessimistic
  variants of the same choice).
- Quantify every path using the Metrics schema (integer 1-10).
  financial_stability: earning power and wealth trajectory
  personal_growth: skill development and identity expansion
  risk_level: probability and severity of downside outcomes (10 = very high risk)
  time_commitment: hours per week consumed (10 = extreme)
- Project realistic Year 1, Year 3, Year 5 outcomes. Be specific — name likely
  job titles, income ranges, or lifestyle markers.
- Surface 2-3 hidden tradeoffs the user has NOT considered (opportunity cost,
  lifestyle inflation, relationship strain, identity foreclosure, etc.).

Output ONLY valid JSON matching the schema. No preamble, no markdown.

DILEMMA:
{dilemma}

ANSWERS TO CLARIFYING QUESTIONS:
{answers}
"""

WHAT_IF_PROMPT = """
You are a scenario modeller. Take the provided Path object and apply the user's
"what-if" variable to it. This is a branching simulation — recalculate Metrics,
update the Timeline, and generate new hidden_tradeoffs that reflect the changed
assumption. Assign a new path_id by appending "_branch" + a random 4-digit number.

Rules:
- Only change what the scenario logically affects. If the what-if is financial,
  update financial_stability and possibly risk_level. Don't arbitrarily shift
  unrelated metrics.
- Keep all integers in range 1-10.
- Be specific in the updated timeline entries.

Output ONLY valid JSON matching the WhatIfResponse schema. No preamble, no markdown.

ORIGINAL PATH:
{original_path}

WHAT-IF SCENARIO:
{what_if_scenario}
"""
```

### 5. LLM Chains with Retry Logic — `chains.py`

```python
import os
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from pydantic import ValidationError
from models import StartSessionResponse, GeneratePathsResponse, WhatIfResponse
from prompts import START_SESSION_PROMPT, GENERATE_PATHS_PROMPT, WHAT_IF_PROMPT

# Use gpt-4o-mini for cheaper high-volume calls; gpt-4o for what-if branching
llm_fast = ChatOpenAI(
    model="gpt-4o-mini",
    temperature=0.3,
    api_key=os.getenv("OPENAI_API_KEY"),
)
llm_powerful = ChatOpenAI(
    model="gpt-4o",
    temperature=0.3,
    api_key=os.getenv("OPENAI_API_KEY"),
)

@retry(
    retry=retry_if_exception_type((ValidationError, ValueError)),
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=8),
)
async def run_start_session(dilemma: str) -> StartSessionResponse:
    structured_llm = llm_fast.with_structured_output(StartSessionResponse)
    prompt = ChatPromptTemplate.from_template(START_SESSION_PROMPT)
    chain = prompt | structured_llm
    return await chain.ainvoke({"dilemma": dilemma})

@retry(
    retry=retry_if_exception_type((ValidationError, ValueError)),
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=8),
)
async def run_generate_paths(dilemma: str, answers: dict) -> GeneratePathsResponse:
    structured_llm = llm_fast.with_structured_output(GeneratePathsResponse)
    prompt = ChatPromptTemplate.from_template(GENERATE_PATHS_PROMPT)
    chain = prompt | structured_llm
    return await chain.ainvoke({"dilemma": dilemma, "answers": str(answers)})

@retry(
    retry=retry_if_exception_type((ValidationError, ValueError)),
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=8),
)
async def run_what_if(original_path, what_if_scenario: str) -> WhatIfResponse:
    structured_llm = llm_powerful.with_structured_output(WhatIfResponse)
    prompt = ChatPromptTemplate.from_template(WHAT_IF_PROMPT)
    chain = prompt | structured_llm
    return await chain.ainvoke({
        "original_path": original_path.model_dump_json(),
        "what_if_scenario": what_if_scenario,
    })
```

### 6. FastAPI App with CORS & Session Storage — `main.py`

```python
import uuid
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from models import (
    StartSessionRequest, StartSessionResponse,
    GeneratePathsRequest, GeneratePathsResponse,
    WhatIfRequest, WhatIfResponse,
)
from chains import run_start_session, run_generate_paths, run_what_if

load_dotenv()

app = FastAPI()

# ── CORS ────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("ALLOWED_ORIGIN", "http://localhost:3000")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── In-memory session store (replace with Redis in production) ──
# Structure: { session_id: { "dilemma": str, "answers": dict, "paths": [...], "branch_depth": {...} } }
SESSION_STORE: dict = {}
MAX_WHATIF_DEPTH = 2   # Prevent infinite branching

# ── Endpoints ────────────────────────────────────────────────────

@app.post("/api/start_session", response_model=StartSessionResponse)
async def start_session(body: StartSessionRequest):
    try:
        result = await run_start_session(body.dilemma)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM error: {str(e)}")

    session_id = str(uuid.uuid4())
    SESSION_STORE[session_id] = {
        "dilemma": body.dilemma,
        "answers": {},
        "paths": [],
        "branch_depth": {},
    }
    result.session_id = session_id
    return result


@app.post("/api/generate_paths", response_model=GeneratePathsResponse)
async def generate_paths(body: GeneratePathsRequest):
    if body.session_id not in SESSION_STORE:
        raise HTTPException(status_code=404, detail="Session not found.")
    try:
        result = await run_generate_paths(body.dilemma, body.answers)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM error: {str(e)}")

    SESSION_STORE[body.session_id]["answers"] = body.answers
    SESSION_STORE[body.session_id]["paths"] = [p.model_dump() for p in result.paths]
    for p in result.paths:
        SESSION_STORE[body.session_id]["branch_depth"][p.path_id] = 0
    return result


@app.post("/api/explore_whatif", response_model=WhatIfResponse)
async def explore_whatif(body: WhatIfRequest):
    if body.session_id not in SESSION_STORE:
        raise HTTPException(status_code=404, detail="Session not found.")

    session = SESSION_STORE[body.session_id]
    depth = session["branch_depth"].get(body.original_path.path_id, 0)
    if depth >= MAX_WHATIF_DEPTH:
        raise HTTPException(
            status_code=400,
            detail=f"Maximum branching depth ({MAX_WHATIF_DEPTH}) reached for this path."
        )

    try:
        result = await run_what_if(body.original_path, body.what_if_scenario)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM error: {str(e)}")

    # Track depth of the new branch
    session["branch_depth"][result.modified_path.path_id] = depth + 1
    return result
```

Run the backend:

```bash
uvicorn main:app --reload --port 8000
```

---

## Part 2: Frontend (Next.js 14 + Tailwind)

### 1. Pinned Dependencies — `package.json` (key packages)

```json
{
  "dependencies": {
    "next": "14.2.3",
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "typescript": "5.4.5",
    "tailwindcss": "3.4.3",
    "framer-motion": "11.2.4",
    "zustand": "4.5.2",
    "axios": "1.7.2"
  }
}
```

Install: `npm install`

### 2. Directory Structure

```
frontend/
├── app/
│   ├── page.tsx                      # Intake screen
│   ├── clarify/page.tsx              # Clarification screen
│   ├── matrix/page.tsx               # Path comparison screen
│   └── api/
│       ├── start_session/route.ts    # Proxy → FastAPI
│       ├── generate_paths/route.ts
│       └── explore_whatif/route.ts
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   └── ErrorBlock.tsx
│   ├── MetricBar.tsx
│   ├── PathCard.tsx
│   ├── Timeline.tsx
│   ├── WhatIfExplorer.tsx
│   └── LoadingSkeleton.tsx
├── store/
│   └── decisionStore.ts
├── .env.local
└── tailwind.config.ts
```

### 3. Next.js API Proxy Routes

These routes sit between the browser and FastAPI, keeping the OpenAI key server-side.

**`app/api/start_session/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8000";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const res = await fetch(`${BACKEND}/api/start_session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) return NextResponse.json(data, { status: res.status });
  return NextResponse.json(data);
}
```

Repeat the same pattern for `generate_paths` and `explore_whatif` routes, substituting the endpoint path.

### 4. Design System — `tailwind.config.ts`

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0a0a0a",
        surface: "#111111",
        "border-dim": "#2a2a2a",
        "border-bright": "#ffffff",
        accent: "#3b82f6",
        danger: "#ef4444",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
```

**Global CSS (`app/globals.css`):**

```css
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=JetBrains+Mono:wght@400;700&display=swap");

* {
  border-radius: 0 !important;
  box-sizing: border-box;
}

body {
  background: #0a0a0a;
  color: #f5f5f5;
  font-family: "Inter", sans-serif;
}
```

### 5. Global State — `store/decisionStore.ts`

```typescript
import { create } from "zustand";

export interface Metrics {
  financial_stability: number;
  personal_growth: number;
  risk_level: number;
  time_commitment: number;
}

export interface Timeline {
  year_1: string;
  year_3: string;
  year_5: string;
}

export interface Path {
  path_id: string;
  title: string;
  summary: string;
  metrics: Metrics;
  timeline: Timeline;
  hidden_tradeoffs: string[];
}

export interface ClarifyingQuestion {
  question_id: string;
  text: string;
  options: string[];
}

interface DecisionStore {
  dilemma: string;
  session_id: string;
  biases: string[];
  questions: ClarifyingQuestion[];
  answers: Record<string, string>;
  paths: Path[];
  branches: Record<string, Path[]>;   // path_id → child paths
  setDilemma: (d: string) => void;
  setSession: (id: string, biases: string[], questions: ClarifyingQuestion[]) => void;
  setAnswers: (a: Record<string, string>) => void;
  setPaths: (paths: Path[]) => void;
  addBranch: (parentId: string, child: Path) => void;
  reset: () => void;
}

export const useDecisionStore = create<DecisionStore>((set) => ({
  dilemma: "",
  session_id: "",
  biases: [],
  questions: [],
  answers: {},
  paths: [],
  branches: {},
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
  reset: () =>
    set({
      dilemma: "",
      session_id: "",
      biases: [],
      questions: [],
      answers: {},
      paths: [],
      branches: {},
    }),
}));
```

### 6. Component Implementations

#### Loading Skeleton — `components/LoadingSkeleton.tsx`

All LLM calls take 3–8 seconds. Show this skeleton while awaiting responses.

```tsx
export function LoadingSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-4 bg-surface border border-border-dim w-full" />
      ))}
    </div>
  );
}
```

#### Error Block — `components/ui/ErrorBlock.tsx`

```tsx
export function ErrorBlock({ message }: { message: string }) {
  return (
    <div className="border border-danger p-4 font-mono text-sm text-danger">
      SYSTEM ERROR: {message.toUpperCase()}
    </div>
  );
}
```

#### MetricBar — `components/MetricBar.tsx`

```tsx
interface MetricBarProps {
  label: string;
  value: number;       // 1-10
  previous?: number;   // for highlighting changes in what-if branches
}

export function MetricBar({ label, value, previous }: MetricBarProps) {
  const changed = previous !== undefined && previous !== value;
  const decreased = previous !== undefined && value < previous;

  return (
    <div className="font-mono text-xs mb-2">
      <div className="flex justify-between mb-1">
        <span>{label.toUpperCase()}</span>
        <span className={changed ? (decreased ? "text-danger" : "text-accent") : ""}>
          {value}/10
        </span>
      </div>
      <div
        className={`border h-4 w-full flex ${
          changed
            ? decreased
              ? "border-danger"
              : "border-accent"
            : "border-border-dim"
        }`}
      >
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className={`flex-1 ${i < value ? "bg-white" : "bg-transparent"} ${
              i > 0 ? "border-l border-border-dim" : ""
            }`}
          />
        ))}
      </div>
    </div>
  );
}
```

#### PathCard — `components/PathCard.tsx`

```tsx
"use client";
import { useState } from "react";
import { Path } from "@/store/decisionStore";
import { MetricBar } from "./MetricBar";
import { WhatIfExplorer } from "./WhatIfExplorer";

interface PathCardProps {
  path: Path;
  index: number;
  parentMetrics?: Path["metrics"];  // used to highlight changed metrics in branches
}

export function PathCard({ path, index, parentMetrics }: PathCardProps) {
  const [showWhatIf, setShowWhatIf] = useState(false);

  return (
    <div className="border border-border-dim p-6 flex flex-col gap-4">
      <h2 className="font-mono text-sm tracking-widest">
        PATH {String(index + 1).padStart(2, "0")}: {path.title.toUpperCase()}
      </h2>
      <p className="text-sm text-gray-400">{path.summary}</p>

      <div>
        {(Object.entries(path.metrics) as [keyof Path["metrics"], number][]).map(
          ([key, val]) => (
            <MetricBar
              key={key}
              label={key.replace(/_/g, " ")}
              value={val}
              previous={parentMetrics?.[key]}
            />
          )
        )}
      </div>

      <div>
        <p className="font-mono text-xs mb-2 text-gray-500">TIMELINE</p>
        {(["year_1", "year_3", "year_5"] as const).map((y) => (
          <div key={y} className="flex gap-3 text-sm mb-1">
            <span className="font-mono text-xs text-gray-500 w-16 shrink-0">
              {y.replace("_", " ").toUpperCase()}:
            </span>
            <span>{path.timeline[y]}</span>
          </div>
        ))}
      </div>

      <div>
        <p className="font-mono text-xs mb-2 text-gray-500">HIDDEN TRADEOFFS</p>
        <ul className="space-y-1 text-sm">
          {path.hidden_tradeoffs.map((t, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-accent font-mono shrink-0">!</span>
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </div>

      <button
        onClick={() => setShowWhatIf((v) => !v)}
        className="border border-white px-4 py-2 font-mono text-xs hover:bg-white hover:text-black transition-colors mt-2"
      >
        {showWhatIf ? "CLOSE WHAT-IF" : "EXPLORE WHAT-IF →"}
      </button>

      {showWhatIf && <WhatIfExplorer parentPath={path} />}
    </div>
  );
}
```

#### WhatIfExplorer — `components/WhatIfExplorer.tsx`

```tsx
"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Path, useDecisionStore } from "@/store/decisionStore";
import { PathCard } from "./PathCard";
import { LoadingSkeleton } from "./LoadingSkeleton";
import { ErrorBlock } from "./ui/ErrorBlock";

export function WhatIfExplorer({ parentPath }: { parentPath: Path }) {
  const { session_id, branches, addBranch } = useDecisionStore();
  const [scenario, setScenario] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const childPaths = branches[parentPath.path_id] ?? [];

  async function handleSubmit() {
    if (!scenario.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/explore_whatif", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id,
          original_path: parentPath,
          what_if_scenario: scenario,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.detail ?? "Unknown error");
      }
      const data = await res.json();
      addBranch(parentPath.path_id, data.modified_path);
      setScenario("");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="ml-8 border-l-2 border-accent pl-4 mt-2 space-y-4"
    >
      <div className="flex gap-2">
        <input
          value={scenario}
          onChange={(e) => setScenario(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="What if I..."
          className="flex-1 bg-transparent border border-border-dim px-3 py-2 font-mono text-sm focus:border-accent outline-none"
        />
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="border border-accent px-4 py-2 font-mono text-xs text-accent hover:bg-accent hover:text-black transition-colors disabled:opacity-40"
        >
          RUN →
        </button>
      </div>

      {loading && <LoadingSkeleton rows={4} />}
      {error && <ErrorBlock message={error} />}

      <AnimatePresence>
        {childPaths.map((child, i) => (
          <motion.div
            key={child.path_id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <PathCard path={child} index={i} parentMetrics={parentPath.metrics} />
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
```

#### Intake Screen — `app/page.tsx`

```tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDecisionStore } from "@/store/decisionStore";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { ErrorBlock } from "@/components/ui/ErrorBlock";

export default function IntakePage() {
  const router = useRouter();
  const { setDilemma, setSession } = useDecisionStore();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    setDilemma(text);
    try {
      const res = await fetch("/api/start_session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dilemma: text }),
      });
      if (!res.ok) throw new Error((await res.json()).detail ?? "Server error");
      const data = await res.json();
      setSession(data.session_id, data.detected_biases, data.clarifying_questions);
      router.push("/clarify");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 gap-8">
      <p className="font-mono text-xs tracking-widest text-gray-500">LIFE DECISION SIMULATOR</p>
      <h1 className="font-sans font-bold text-3xl uppercase tracking-tight">
        Define your dilemma
      </h1>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="I am trying to decide whether to..."
        rows={6}
        className="w-full max-w-2xl bg-transparent border-b border-white p-2 text-base resize-none focus:outline-none focus:border-accent"
      />
      {loading ? (
        <div className="w-full max-w-2xl">
          <LoadingSkeleton rows={2} />
        </div>
      ) : (
        <button
          onClick={handleSubmit}
          className="border border-white px-8 py-3 font-mono text-sm hover:bg-white hover:text-black transition-colors"
        >
          ANALYSE →
        </button>
      )}
      {error && (
        <div className="w-full max-w-2xl">
          <ErrorBlock message={error} />
        </div>
      )}
    </main>
  );
}
```

#### Clarify Screen — `app/clarify/page.tsx`

```tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDecisionStore } from "@/store/decisionStore";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { ErrorBlock } from "@/components/ui/ErrorBlock";

export default function ClarifyPage() {
  const router = useRouter();
  const { dilemma, session_id, biases, questions, answers, setAnswers, setPaths } =
    useDecisionStore();
  const [localAnswers, setLocalAnswers] = useState<Record<string, string>>(answers);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function selectAnswer(qid: string, option: string) {
    setLocalAnswers((prev) => ({ ...prev, [qid]: option }));
  }

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    setAnswers(localAnswers);
    try {
      const res = await fetch("/api/generate_paths", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id, dilemma, answers: localAnswers }),
      });
      if (!res.ok) throw new Error((await res.json()).detail ?? "Server error");
      const data = await res.json();
      setPaths(data.paths);
      router.push("/matrix");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen grid grid-cols-[2fr_3fr] divide-x divide-border-dim">
      {/* Left: dilemma + biases */}
      <div className="p-8 space-y-6">
        <p className="font-mono text-xs text-gray-500 tracking-widest">YOUR DILEMMA</p>
        <blockquote className="border-l-2 border-accent pl-4 text-sm leading-relaxed italic">
          {dilemma}
        </blockquote>
        <p className="font-mono text-xs text-gray-500 tracking-widest">DETECTED BIASES</p>
        <ul className="space-y-2">
          {biases.map((b, i) => (
            <li key={i} className="border border-danger p-2 font-mono text-xs text-danger">
              {b}
            </li>
          ))}
        </ul>
      </div>

      {/* Right: questions */}
      <div className="p-8 space-y-8 overflow-y-auto">
        <p className="font-mono text-xs text-gray-500 tracking-widest">CLARIFY YOUR CONSTRAINTS</p>
        {questions.map((q) => (
          <div key={q.question_id} className="space-y-3">
            <p className="text-sm">{q.text}</p>
            <div className="grid grid-cols-2 gap-2">
              {q.options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => selectAnswer(q.question_id, opt)}
                  className={`border p-3 text-xs font-mono text-left transition-colors ${
                    localAnswers[q.question_id] === opt
                      ? "border-white bg-white text-black"
                      : "border-border-dim hover:border-gray-400"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        ))}

        {loading ? (
          <LoadingSkeleton rows={3} />
        ) : (
          <button
            onClick={handleGenerate}
            className="border border-white px-8 py-3 font-mono text-sm hover:bg-white hover:text-black transition-colors w-full"
          >
            GENERATE PATHS →
          </button>
        )}
        {error && <ErrorBlock message={error} />}
      </div>
    </main>
  );
}
```

#### Matrix Screen — `app/matrix/page.tsx`

```tsx
"use client";
import { useDecisionStore } from "@/store/decisionStore";
import { PathCard } from "@/components/PathCard";

export default function MatrixPage() {
  const { paths } = useDecisionStore();

  if (!paths.length) {
    return (
      <main className="min-h-screen flex items-center justify-center font-mono text-gray-500">
        NO PATHS GENERATED.{" "}
        <a href="/" className="ml-2 underline">
          START OVER
        </a>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <div className="border-b border-border-dim px-8 py-4 flex justify-between items-center">
        <p className="font-mono text-xs tracking-widest">DECISION MATRIX</p>
        <a href="/" className="font-mono text-xs text-gray-500 hover:text-white">
          RESTART
        </a>
      </div>
      <div className={`grid grid-cols-${paths.length} divide-x divide-white`}>
        {paths.map((path, i) => (
          <PathCard key={path.path_id} path={path} index={i} />
        ))}
      </div>
    </main>
  );
}
```

---

## Part 3: Data Flow Summary

```
Browser
  │
  ├── POST /api/start_session      (Next.js proxy) → FastAPI → OpenAI
  │     Returns: session_id, detected_biases, clarifying_questions
  │
  ├── POST /api/generate_paths     (Next.js proxy) → FastAPI → OpenAI
  │     Returns: 3 Path objects (stored in Zustand + server SESSION_STORE)
  │
  └── POST /api/explore_whatif     (Next.js proxy) → FastAPI → OpenAI
        Returns: WhatIfResponse with modified_path
        Branch depth enforced server-side (max 2 levels per path)
```

**Key invariants:**
- The OpenAI API key never reaches the browser.
- Session state is stored server-side (in-memory dict, keyed by UUID).
- Branch depth is capped at `MAX_WHATIF_DEPTH = 2` per path on the backend.
- All LLM calls use `tenacity` with up to 3 retries on `ValidationError`.
- `temperature=0.3` across all chains for deterministic metric output.

---

## Part 4: Cost & Performance Notes

| Call | Model | Est. tokens | Est. cost per call |
|---|---|---|---|
| `start_session` | gpt-4o-mini | ~600 in / 400 out | ~$0.001 |
| `generate_paths` | gpt-4o-mini | ~800 in / 800 out | ~$0.002 |
| `explore_whatif` | gpt-4o | ~600 in / 600 out | ~$0.015 |

A full session (start + paths + 3 what-ifs) costs roughly **$0.05–0.08**.

To reduce costs in production: cache `generate_paths` responses keyed on `hash(dilemma + str(answers))`.

---

## Part 5: Development Checklist

- [ ] `backend/.env` created and added to `.gitignore`
- [ ] `frontend/.env.local` created and added to `.gitignore`
- [ ] `pip install -r requirements.txt` successful
- [ ] `npm install` successful
- [ ] FastAPI running: `uvicorn main:app --reload --port 8000`
- [ ] Next.js running: `npm run dev` (port 3000)
- [ ] CORS confirmed: browser network tab shows no CORS errors on cross-origin calls
- [ ] Intake → Clarify → Matrix flow end-to-end tested
- [ ] What-if branching tested with 2 levels (third attempt should return HTTP 400)
- [ ] LLM retry logic confirmed: pass a malformed prompt, verify 3 attempts logged by tenacity
- [ ] Error block renders correctly on 500 responses
- [ ] Loading skeleton visible during all LLM calls (check on slow network)
- [ ] RESTART button on matrix screen resets Zustand state correctly
