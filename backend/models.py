from pydantic import BaseModel, Field
from typing import List, Optional

class Metrics(BaseModel):
    financial_stability: int = Field(description="Score 1-10")
    personal_growth: int = Field(description="Score 1-10")
    risk_level: int = Field(description="Score 1-10")
    time_commitment: int = Field(description="Score 1-10")

class Timeline(BaseModel):
    year_1: str

class LongTermTimeline(BaseModel):
    year_1: str
    year_3: str
    year_5: str

class Path(BaseModel):
    path_id: str
    title: str
    summary: str
    pros: List[str] = Field(default_factory=list, description="2-3 key advantages of this path")
    cons: List[str] = Field(default_factory=list, description="2-3 key disadvantages of this path")
    metrics: Metrics
    timeline: LongTermTimeline
    hidden_tradeoffs: List[str]

class Recommendation(BaseModel):
    recommended_path_id: str = Field(description="The path_id of the single best recommended path")
    reasoning: str = Field(description="2-4 sentences explaining WHY this path is best for this specific user, comparing all paths and citing their stated constraints. Must not just default to 'balanced'.")
    key_factors: List[str] = Field(description="2-3 specific decisive factors that make this path win over the others")

class ClarifyingQuestion(BaseModel):
    question_id: str
    text: str
    options: List[str]

class StartSessionResponse(BaseModel):
    session_id: Optional[str] = Field(default=None, description="Populated by the server")
    detected_biases: List[str] = Field(description="Up to 3 cognitive biases detected in the dilemma, each formatted strictly as 'Bias Name: 1-2 line explanation'")
    clarifying_questions: List[ClarifyingQuestion] = Field(description="Exactly 3 clarifying questions")

class GeneratePathsResponse(BaseModel):
    paths: List[Path] = Field(description="Exactly 3 distinct paths generated based on the dilemma and answers")
    recommendation: Optional[Recommendation] = Field(default=None, description="AI recommendation for the single best path")

class WhatIfResponse(BaseModel):
    original_path_id: str
    what_if_scenario: str
    modified_path: Path

# ── LLM Configuration Schemas ─────────────────────────────────────
class LLMConfig(BaseModel):
    provider: str = Field(description="LLM provider: openai, gemini, or ollama")
    api_key: Optional[str] = Field(default=None, description="API Key for the provider (if required)")
    base_url: Optional[str] = Field(default=None, description="Base URL (primarily for local Ollama server)")
    model_fast: Optional[str] = Field(default=None, description="Fast model override")
    model_powerful: Optional[str] = Field(default=None, description="Powerful model override")

# ── Request bodies ──────────────────────────────────────────────
class StartSessionRequest(BaseModel):
    dilemma: str
    config: Optional[LLMConfig] = None
    profile_context: Optional[str] = None

class GeneratePathsRequest(BaseModel):
    session_id: str
    dilemma: str
    answers: dict
    config: Optional[LLMConfig] = None
    profile_context: Optional[str] = None
    decision_mode: str = Field(default="long_term", description="'long_term' or 'short_term'")

class WhatIfRequest(BaseModel):
    session_id: str
    original_path: Path
    what_if_scenario: str
    config: Optional[LLMConfig] = None

class UploadDocumentResponse(BaseModel):
    text: str
