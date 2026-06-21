# PathSmith


PathSmith is an AI-powered life decision simulator designed to help users clarify complex dilemmas, weigh competing choices, and evaluate branching futures. By combining structured decision-making framework inputs with advanced LLM reasoning, PathSmith maps out pathways, identifies cognitive blind spots, and recommends the optimal course of action based on user-defined constraints.

---

##  Key Features

*   **Short-Term vs. Long-Term Decision Toggles:**
    *   **Short-Term Mode:** Focuses on immediate tradeoffs, pros/cons, and core statistics for each alternative.
    *   **Long-Term Mode:** Projects future scenarios, long-term outcomes, and branching possibilities over time.
*   **Unbiased AI Recommendation:**
    *   Analyze options based on constraint weights and objective reasoning. The system compares every path dynamically and provides a recommended choice, explicitly explaining *why* it fits best.
*   **Dynamic Alignment Matrix (Radar Chart):**
    *   Compare paths visually across five key axes: **Reward**, **Risk**, **Growth**, **Effort**, and **Values Alignment** using a custom themed radar chart.
*   **Path Stress Testing (Regret Minimization):**
    *   Select any path to run a "Stress Test" simulate extreme downside scenarios, and evaluate regret potential before committing.
*   **Side-by-Side Comparison:**
    *   Select any two generated paths to compare key stats, tradeoffs, and metrics side-by-side in a split-screen dashboard.
*   **Drag-and-Drop Document Context (RAG):**
    *   Upload external resumes, budget spreadsheets, or diary notes (`.pdf` or `.txt`) to inject personalized context into the simulator.
*   **Local Simulation History:**
    *   Save simulations locally. Browse, reload, or delete past decisions using the sliding history panel.

---

## Tech Stack

### Frontend
*   **Framework:** Next.js 14 (App Router)
*   **Styling:** Tailwind CSS & Custom CSS (Glassmorphism & animations)
*   **Animations:** Framer Motion
*   **Charts:** Recharts (Custom SVG Radar Charts)
*   **State Management:** Zustand (with localStorage persistence)

### Backend
*   **Framework:** FastAPI (Python)
*   **Orchestration:** LangChain & Pydantic
*   **AI Integration:** OpenAI & Gemini (configurable via frontend UI)

---

## Architecture Flow

```mermaid
graph TD
    A[Client Browser] -->|User Inputs + Context Files| B(Next.js App - Vercel)
    B -->|API Proxy Routes| C(FastAPI Backend - Render)
    C -->|Orchestrated Chains| D(LangChain Agent)
    D -->|Reasoning Engine| E(Gemini / OpenAI API)
    E -->|Structured JSON Response| C
    C -->|Aggregated Data| B
    B -->|Interactive Dashboard & Radar Chart| A
```

---

## Local Setup & Development

### 1. Backend Setup

Prerequisites: Python 3.9+ installed.

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # On Windows (PowerShell):
   .\venv\Scripts\Activate.ps1
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the FastAPI server:
   ```bash
   uvicorn main:app --port 8000 --reload
   ```

The backend API will be available at `http://127.0.0.1:8000`.

---

### 2. Frontend Setup

Prerequisites: Node.js 18+ installed.

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install package dependencies:
   ```bash
   npm install
   ```
3. Copy environment template and set variables:
   ```bash
   cp .env.local.example .env.local
   ```
   *In `.env.local`, set `BACKEND_URL` to `http://localhost:8000` for local testing.*
4. Start the Next.js development server:
   ```bash
   npm run dev
   ```

Open `http://localhost:3000` (or the port specified in terminal) in your browser.

---

## Production Deployment

### Frontend (Vercel)
The frontend is hosted on Vercel. 
*   **Root Directory:** Set to `frontend` in Project Settings.
*   **Environment Variables:**
    *   `NEXT_PUBLIC_INTERNAL_API`: `/api`
    *   `BACKEND_URL`: Your hosted backend URL.

### Backend (Render)
The backend FastAPI service is hosted on Render.
*   **Root Directory:** Set to `backend` in Project Settings.
*   **Build Command:** `pip install -r requirements.txt`
*   **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
*   **Environment Variables:**
    *   `GEMINI_API_KEY`: *(Optional default API key)*

> [!NOTE]
> **Free-Tier Cold Starts:**
> Because the backend is hosted on Render's free tier, the server spins down after 15 minutes of inactivity. When initiating your first path simulation, it may take up to **30–50 seconds** to wake up. Subsequent requests will load instantly.
