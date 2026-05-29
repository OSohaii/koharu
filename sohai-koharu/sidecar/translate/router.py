"""
Translation module supporting local LLMs and external APIs.

Local backends:
- llama.cpp via llama-cpp-python (GGUF models)

External backends:
- Gemini (Google)
- OpenAI (GPT)
- DeepL
- DeepSeek
"""

from fastapi import APIRouter, Body
from pydantic import BaseModel

router = APIRouter()


class TranslationRequest(BaseModel):
    texts: list[str]
    source_language: str = "ja"
    target_language: str = "pt-BR"
    backend: str = "local-llm"
    model: str = "qwen3.5-4b"
    context: list[str] = []  # Previous translations for context
    api_key: str | None = None


class TranslationEntry(BaseModel):
    original: str
    translated: str
    confidence: float | None = None


class TranslationResult(BaseModel):
    translations: list[TranslationEntry]
    backend_used: str
    model_used: str
    total_tokens: int
    inference_time_ms: float


@router.post("/batch", response_model=TranslationResult)
async def translate_batch(request: TranslationRequest = Body(...)):
    """
    Translate a batch of text entries.
    
    Supports context-aware translation by providing previous
    translations in the `context` field. This helps maintain
    consistency across a manga page or chapter.
    """
    import time
    start = time.perf_counter()

    # TODO: Implement actual translation logic
    # - For local-llm: load GGUF model via llama-cpp-python
    # - For external APIs: use httpx to call provider endpoints
    
    translations = [
        TranslationEntry(original=text, translated=f"[TODO: translate] {text}", confidence=None)
        for text in request.texts
    ]

    elapsed = (time.perf_counter() - start) * 1000

    return TranslationResult(
        translations=translations,
        backend_used=request.backend,
        model_used=request.model,
        total_tokens=0,
        inference_time_ms=elapsed,
    )


@router.get("/backends")
async def list_backends():
    """List available translation backends and their status."""
    return {
        "backends": [
            {"id": "local-llm", "name": "LLM Local", "status": "available", "requires_api_key": False},
            {"id": "gemini", "name": "Google Gemini", "status": "available", "requires_api_key": True},
            {"id": "openai", "name": "OpenAI", "status": "available", "requires_api_key": True},
            {"id": "deepl", "name": "DeepL", "status": "available", "requires_api_key": True},
            {"id": "deepseek", "name": "DeepSeek", "status": "available", "requires_api_key": True},
        ]
    }
