import os
from typing import Optional
from dotenv import load_dotenv
# Load environment variables first
load_dotenv()

from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from langchain_openai import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from pydantic import ValidationError
from models import StartSessionResponse, GeneratePathsResponse, WhatIfResponse, Path
from prompts import START_SESSION_PROMPT, GENERATE_PATHS_PROMPT, WHAT_IF_PROMPT

def get_llm(config: Optional[dict], is_powerful: bool, temperature: float = 0.3):
    if not config:
        config = {}
    
    provider = config.get("provider", "openai").lower()
    api_key = config.get("api_key")
    base_url = config.get("base_url")
    model_fast = config.get("model_fast")
    model_powerful = config.get("model_powerful")
    
    if provider == "openai":
        model_name = model_powerful if is_powerful else model_fast
        if not model_name:
            model_name = "gpt-4o" if is_powerful else "gpt-4o-mini"
        key = api_key or os.getenv("OPENAI_API_KEY")
        return ChatOpenAI(
            model=model_name,
            temperature=temperature,
            api_key=key,
        )
    elif provider == "gemini":
        model_name = model_powerful if is_powerful else model_fast
        if not model_name:
            model_name = "gemini-1.5-pro" if is_powerful else "gemini-1.5-flash"
        key = api_key or os.getenv("GEMINI_API_KEY")
        return ChatGoogleGenerativeAI(
            model=model_name,
            temperature=temperature,
            google_api_key=key,
        )
    elif provider == "ollama":
        model_name = model_powerful if is_powerful else model_fast
        if not model_name:
            model_name = "llama3" if is_powerful else "gemma2"
        url = base_url or "http://localhost:11434/v1"
        return ChatOpenAI(
            model=model_name,
            temperature=temperature,
            api_key="ollama",  # OpenAI client expects a key even if it's ignored
            base_url=url,
        )
    else:
        raise ValueError(f"Unsupported LLM provider: {provider}")

@retry(
    retry=retry_if_exception_type((ValidationError, ValueError)),
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=8),
)
async def run_start_session(dilemma: str, config: Optional[dict] = None) -> StartSessionResponse:
    print(f"[run_start_session] Starting with config: {config}")
    try:
        llm = get_llm(config, is_powerful=False)
        structured_llm = llm.with_structured_output(StartSessionResponse)
        prompt = ChatPromptTemplate.from_template(START_SESSION_PROMPT)
        chain = prompt | structured_llm
        res = await chain.ainvoke({"dilemma": dilemma})
        print(f"[run_start_session] Success: {res}")
        return res
    except Exception as e:
        print(f"[run_start_session] Error: {e}")
        raise e

@retry(
    retry=retry_if_exception_type((ValidationError, ValueError)),
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=8),
)
async def run_generate_paths(dilemma: str, answers: dict, config: Optional[dict] = None) -> GeneratePathsResponse:
    print(f"[run_generate_paths] Starting with config: {config}")
    try:
        llm = get_llm(config, is_powerful=False)
        structured_llm = llm.with_structured_output(GeneratePathsResponse)
        prompt = ChatPromptTemplate.from_template(GENERATE_PATHS_PROMPT)
        chain = prompt | structured_llm
        res = await chain.ainvoke({"dilemma": dilemma, "answers": str(answers)})
        print(f"[run_generate_paths] Success: {res}")
        return res
    except Exception as e:
        print(f"[run_generate_paths] Error: {e}")
        raise e

@retry(
    retry=retry_if_exception_type((ValidationError, ValueError)),
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=8),
)
async def run_what_if(original_path, what_if_scenario: str, config: Optional[dict] = None) -> WhatIfResponse:
    print(f"[run_what_if] Starting with config: {config}")
    try:
        llm = get_llm(config, is_powerful=True)
        structured_llm = llm.with_structured_output(Path)
        prompt = ChatPromptTemplate.from_template(WHAT_IF_PROMPT)
        chain = prompt | structured_llm
        modified_path = await chain.ainvoke({
            "original_path": original_path.model_dump_json(),
            "what_if_scenario": what_if_scenario,
        })
        res = WhatIfResponse(
            original_path_id=original_path.path_id,
            what_if_scenario=what_if_scenario,
            modified_path=modified_path
        )
        print(f"[run_what_if] Success: {res}")
        return res
    except Exception as e:
        print(f"[run_what_if] Error: {e}")
        raise e
