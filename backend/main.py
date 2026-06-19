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

app = FastAPI(title="PathSmith Backend")

# ── CORS ────────────────────────────────────────────────────────
# Allow requests from Next.js local server (default port 3000)
allowed_origin = os.getenv("ALLOWED_ORIGIN", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[allowed_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── In-memory session store ─────────────────────────────────────
# Structure: { session_id: { "dilemma": str, "answers": dict, "paths": [...], "branch_depth": {...}, "config": {...} } }
SESSION_STORE: dict = {}
MAX_WHATIF_DEPTH = 2   # Prevent infinite branching

@app.post("/api/start_session", response_model=StartSessionResponse)
async def start_session(body: StartSessionRequest):
    # Convert configuration schema to dict
    llm_config = body.config.model_dump() if body.config else None
    
    try:
        result = await run_start_session(body.dilemma, llm_config)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM error: {str(e)}")

    session_id = str(uuid.uuid4())
    SESSION_STORE[session_id] = {
        "dilemma": body.dilemma,
        "answers": {},
        "paths": [],
        "branch_depth": {},
        "config": llm_config,
    }
    result.session_id = session_id
    return result

@app.post("/api/generate_paths", response_model=GeneratePathsResponse)
async def generate_paths(body: GeneratePathsRequest):
    if body.session_id not in SESSION_STORE:
        raise HTTPException(status_code=404, detail="Session not found.")
    
    session = SESSION_STORE[body.session_id]
    llm_config = session.get("config")
    
    try:
        result = await run_generate_paths(body.dilemma, body.answers, llm_config)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM error: {str(e)}")

    session["answers"] = body.answers
    session["paths"] = [p.model_dump() for p in result.paths]
    for p in result.paths:
        session["branch_depth"][p.path_id] = 0
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

    llm_config = session.get("config")

    try:
        result = await run_what_if(body.original_path, body.what_if_scenario, llm_config)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM error: {str(e)}")

    # Track depth of the new branch
    session["branch_depth"][result.modified_path.path_id] = depth + 1
    return result
