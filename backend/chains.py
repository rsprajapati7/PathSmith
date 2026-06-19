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
            model_name = "gemma-4-31b-it"
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

class QuotaExhaustedException(Exception):
    pass

@retry(
    retry=retry_if_exception_type((ValidationError, ValueError)),
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=8),
)
async def _invoke_start_session(dilemma: str, config: Optional[dict] = None) -> StartSessionResponse:
    llm = get_llm(config, is_powerful=False)
    structured_llm = llm.with_structured_output(StartSessionResponse)
    prompt = ChatPromptTemplate.from_template(START_SESSION_PROMPT)
    chain = prompt | structured_llm
    return await chain.ainvoke({"dilemma": dilemma})

@retry(
    retry=retry_if_exception_type((ValidationError, ValueError)),
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=8),
)
async def _invoke_generate_paths(dilemma: str, answers: dict, config: Optional[dict] = None) -> GeneratePathsResponse:
    llm = get_llm(config, is_powerful=False)
    structured_llm = llm.with_structured_output(GeneratePathsResponse)
    prompt = ChatPromptTemplate.from_template(GENERATE_PATHS_PROMPT)
    chain = prompt | structured_llm
    return await chain.ainvoke({"dilemma": dilemma, "answers": str(answers)})

@retry(
    retry=retry_if_exception_type((ValidationError, ValueError)),
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=8),
)
async def _invoke_what_if(original_path, what_if_scenario: str, config: Optional[dict] = None) -> Path:
    llm = get_llm(config, is_powerful=True)
    structured_llm = llm.with_structured_output(Path)
    prompt = ChatPromptTemplate.from_template(WHAT_IF_PROMPT)
    chain = prompt | structured_llm
    return await chain.ainvoke({
        "original_path": original_path.model_dump_json(),
        "what_if_scenario": what_if_scenario,
    })

async def run_start_session(dilemma: str, config: Optional[dict] = None) -> StartSessionResponse:
    print(f"[run_start_session] Starting with config: {config}")
    try:
        res = await _invoke_start_session(dilemma, config)
        print(f"[run_start_session] Success: {res}")
        return res
    except Exception as e:
        error_msg = str(e).upper()
        if "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg or "QUOTA" in error_msg:
            current_model = config.get("model_fast") if config else None
            if current_model != "gemma-4-31b-it":
                print("[run_start_session] Quota exhausted! Falling back to gemma-4-31b-it automatically...")
                fallback_config = dict(config) if config else {}
                fallback_config["model_fast"] = "gemma-4-31b-it"
                fallback_config["model_powerful"] = "gemma-4-31b-it"
                try:
                    res = await _invoke_start_session(dilemma, fallback_config)
                    print(f"[run_start_session] Success (fallback): {res}")
                    return res
                except Exception as fallback_err:
                    e = fallback_err
            
            raise QuotaExhaustedException(
                "API call quota limit reached. We cannot proceed further. "
                "Please change your API key / model parameters, or try again later."
            )
        print(f"[run_start_session] Error: {e}")
        raise e

async def run_generate_paths(dilemma: str, answers: dict, config: Optional[dict] = None) -> GeneratePathsResponse:
    print(f"[run_generate_paths] Starting with config: {config}")
    try:
        res = await _invoke_generate_paths(dilemma, answers, config)
        print(f"[run_generate_paths] Success: {res}")
        return res
    except Exception as e:
        error_msg = str(e).upper()
        if "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg or "QUOTA" in error_msg:
            current_model = config.get("model_fast") if config else None
            if current_model != "gemma-4-31b-it":
                print("[run_generate_paths] Quota exhausted! Falling back to gemma-4-31b-it automatically...")
                fallback_config = dict(config) if config else {}
                fallback_config["model_fast"] = "gemma-4-31b-it"
                fallback_config["model_powerful"] = "gemma-4-31b-it"
                try:
                    res = await _invoke_generate_paths(dilemma, answers, fallback_config)
                    print(f"[run_generate_paths] Success (fallback): {res}")
                    return res
                except Exception as fallback_err:
                    e = fallback_err
            
            raise QuotaExhaustedException(
                "API call quota limit reached. We cannot proceed further. "
                "Please change your API key / model parameters, or try again later."
            )
        print(f"[run_generate_paths] Error: {e}")
        raise e

async def run_what_if(original_path, what_if_scenario: str, config: Optional[dict] = None) -> WhatIfResponse:
    print(f"[run_what_if] Starting with config: {config}")
    try:
        modified_path = await _invoke_what_if(original_path, what_if_scenario, config)
        res = WhatIfResponse(
            original_path_id=original_path.path_id,
            what_if_scenario=what_if_scenario,
            modified_path=modified_path
        )
        print(f"[run_what_if] Success: {res}")
        return res
    except Exception as e:
        error_msg = str(e).upper()
        if "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg or "QUOTA" in error_msg:
            current_model = config.get("model_powerful") if config else None
            if current_model != "gemma-4-31b-it":
                print("[run_what_if] Quota exhausted! Falling back to gemma-4-31b-it automatically...")
                fallback_config = dict(config) if config else {}
                fallback_config["model_fast"] = "gemma-4-31b-it"
                fallback_config["model_powerful"] = "gemma-4-31b-it"
                try:
                    modified_path = await _invoke_what_if(original_path, what_if_scenario, fallback_config)
                    res = WhatIfResponse(
                        original_path_id=original_path.path_id,
                        what_if_scenario=what_if_scenario,
                        modified_path=modified_path
                    )
                    print(f"[run_what_if] Success (fallback): {res}")
                    return res
                except Exception as fallback_err:
                    e = fallback_err
            
            raise QuotaExhaustedException(
                "API call quota limit reached. We cannot proceed further. "
                "Please change your API key / model parameters, or try again later."
            )
        print(f"[run_what_if] Error: {e}")
        raise e
