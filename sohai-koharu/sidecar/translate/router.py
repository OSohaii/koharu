"""
Translation module supporting local LLMs and external APIs.

Local backends:
- llama.cpp via llama-cpp-python (GGUF models)

External backends:
- Gemini (Google) - google-genai SDK
- OpenAI (GPT) - openai SDK
- DeepL - REST API
- DeepSeek - OpenAI-compatible endpoint
"""

import os
import time

from fastapi import APIRouter, Body
from pydantic import BaseModel

router = APIRouter()

# Cached LLM instance for local models
_local_llm = None


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


def _build_translation_prompt(
    texts: list[str],
    source_language: str,
    target_language: str,
    context: list[str],
) -> str:
    """Build a manga-translation-optimized prompt."""
    lang_names = {
        "ja": "Japanese", "ko": "Korean", "zh": "Chinese",
        "en": "English", "pt-BR": "Brazilian Portuguese",
        "es": "Spanish", "fr": "French", "de": "German",
    }
    src_name = lang_names.get(source_language, source_language)
    tgt_name = lang_names.get(target_language, target_language)

    prompt = f"""You are a professional manga/comic translator from {src_name} to {tgt_name}.

Rules:
- Translate naturally and fluently for the target audience
- Keep the tone and register of the original (casual, formal, angry, etc.)
- Preserve onomatopoeia when culturally appropriate, otherwise adapt
- Keep translations concise (they must fit in speech bubbles)
- Do NOT add explanations, just translate

"""
    if context:
        prompt += "Previous translations for context:\n"
        for c in context[-5:]:  # Last 5 for context window
            prompt += f"  {c}\n"
        prompt += "\n"

    prompt += "Translate each line below. Return ONLY the translations, one per line, in the same order:\n\n"
    for i, text in enumerate(texts):
        prompt += f"{i+1}. {text}\n"

    return prompt


def _parse_batch_response(response_text: str, count: int) -> list[str]:
    """Parse numbered or line-separated translation response."""
    lines = [l.strip() for l in response_text.strip().split("\n") if l.strip()]

    # Try to parse numbered format: "1. translated text"
    parsed = []
    for line in lines:
        # Remove leading number and dot/colon
        import re
        cleaned = re.sub(r"^\d+[\.\)\:\-]\s*", "", line)
        if cleaned:
            parsed.append(cleaned)

    # If we got the right count, great
    if len(parsed) == count:
        return parsed

    # Fallback: just take first N lines
    if len(lines) >= count:
        return lines[:count]

    # Pad with empty strings if not enough
    return parsed + [""] * (count - len(parsed))


async def _translate_gemini(
    texts: list[str],
    source_language: str,
    target_language: str,
    context: list[str],
    api_key: str,
    model: str = "gemini-2.0-flash",
) -> tuple[list[str], int]:
    """Translate via Google Gemini API."""
    try:
        from google import genai

        client = genai.Client(api_key=api_key)
        prompt = _build_translation_prompt(texts, source_language, target_language, context)

        response = client.models.generate_content(
            model=model,
            contents=prompt,
        )

        result_text = response.text or ""
        translations = _parse_batch_response(result_text, len(texts))
        total_tokens = (response.usage_metadata.total_token_count
                        if response.usage_metadata else 0)

        return translations, total_tokens

    except ImportError:
        raise RuntimeError("google-genai not installed. Run: pip install google-genai")


async def _translate_openai(
    texts: list[str],
    source_language: str,
    target_language: str,
    context: list[str],
    api_key: str,
    model: str = "gpt-4o-mini",
    base_url: str | None = None,
) -> tuple[list[str], int]:
    """Translate via OpenAI-compatible API (also works for DeepSeek)."""
    try:
        from openai import AsyncOpenAI

        client = AsyncOpenAI(api_key=api_key, base_url=base_url)
        prompt = _build_translation_prompt(texts, source_language, target_language, context)

        response = await client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "You are a professional manga translator. Respond only with translations."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.3,
        )

        result_text = response.choices[0].message.content or ""
        translations = _parse_batch_response(result_text, len(texts))
        total_tokens = response.usage.total_tokens if response.usage else 0

        return translations, total_tokens

    except ImportError:
        raise RuntimeError("openai not installed. Run: pip install openai")


async def _translate_deepl(
    texts: list[str],
    source_language: str,
    target_language: str,
    api_key: str,
) -> tuple[list[str], int]:
    """Translate via DeepL API."""
    try:
        import httpx

        # DeepL language codes
        deepl_source = {"ja": "JA", "ko": "KO", "zh": "ZH", "en": "EN"}.get(source_language, source_language.upper())
        deepl_target = {"pt-BR": "PT-BR", "en": "EN-US", "es": "ES", "fr": "FR"}.get(target_language, target_language.upper())

        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api-free.deepl.com/v2/translate",
                headers={"Authorization": f"DeepL-Auth-Key {api_key}"},
                json={
                    "text": texts,
                    "source_lang": deepl_source,
                    "target_lang": deepl_target,
                },
            )
            response.raise_for_status()
            data = response.json()

        translations = [t["text"] for t in data.get("translations", [])]
        # Pad if needed
        translations += [""] * (len(texts) - len(translations))

        return translations, 0  # DeepL doesn't report tokens

    except ImportError:
        raise RuntimeError("httpx not installed. Run: pip install httpx")


async def _translate_local_llm(
    texts: list[str],
    source_language: str,
    target_language: str,
    context: list[str],
    model_id: str,
) -> tuple[list[str], int]:
    """Translate via local LLM (llama-cpp-python)."""
    global _local_llm

    try:
        from llama_cpp import Llama
        from huggingface_hub import hf_hub_download
        from pathlib import Path

        # Model mapping
        model_files = {
            "qwen3.5-4b": ("unsloth/Qwen3.5-4B-GGUF", "Qwen3.5-4B-Q4_K_M.gguf"),
            "qwen3.5-9b": ("unsloth/Qwen3.5-9B-GGUF", "Qwen3.5-9B-Q4_K_M.gguf"),
            "gemma4-e2b": ("unsloth/gemma-4-E2B-it-GGUF", "gemma-4-E2B-it-Q4_K_M.gguf"),
            "gemma4-e4b": ("unsloth/gemma-4-E4B-it-GGUF", "gemma-4-E4B-it-Q4_K_M.gguf"),
            "sakura-7b": ("SakuraLLM/Sakura-GalTransl-7B-v3.7", None),
        }

        if model_id not in model_files:
            raise ValueError(f"Unknown local model: {model_id}")

        repo_id, filename = model_files[model_id]

        # Load model if not cached or different model
        if _local_llm is None or getattr(_local_llm, '_model_id', None) != model_id:
            cache_dir = str(Path.home() / ".sohai-koharu" / "models")
            model_path = hf_hub_download(
                repo_id=repo_id,
                filename=filename,
                cache_dir=cache_dir,
            ) if filename else None

            if model_path:
                _local_llm = Llama(
                    model_path=model_path,
                    n_ctx=4096,
                    n_gpu_layers=-1,  # Use all GPU layers
                    verbose=False,
                )
                _local_llm._model_id = model_id

        prompt = _build_translation_prompt(texts, source_language, target_language, context)

        output = _local_llm(
            prompt,
            max_tokens=1024,
            temperature=0.3,
            stop=["\n\n"],
        )

        result_text = output["choices"][0]["text"]
        translations = _parse_batch_response(result_text, len(texts))
        total_tokens = output.get("usage", {}).get("total_tokens", 0)

        return translations, total_tokens

    except ImportError:
        raise RuntimeError(
            "llama-cpp-python not installed. Run: pip install llama-cpp-python"
        )


@router.post("/batch", response_model=TranslationResult)
async def translate_batch(request: TranslationRequest = Body(...)):
    """
    Translate a batch of text entries.
    
    Supports context-aware translation by providing previous
    translations in the `context` field.
    
    Backends:
    - gemini: Requires api_key (Google AI Studio key)
    - openai: Requires api_key (OpenAI key)
    - deepl: Requires api_key (DeepL key)
    - deepseek: Requires api_key (DeepSeek key)
    - local-llm: No key needed, downloads model on first use
    """
    start = time.perf_counter()

    api_key = request.api_key or os.environ.get(f"{request.backend.upper().replace('-', '_')}_API_KEY", "")
    translations: list[str] = []
    total_tokens = 0
    model_used = request.model

    try:
        if request.backend == "gemini":
            if not api_key:
                raise ValueError("Gemini API key required. Set via UI or GEMINI_API_KEY env var.")
            translations, total_tokens = await _translate_gemini(
                request.texts, request.source_language, request.target_language,
                request.context, api_key,
            )
            model_used = "gemini-2.0-flash"

        elif request.backend == "openai":
            if not api_key:
                raise ValueError("OpenAI API key required. Set via UI or OPENAI_API_KEY env var.")
            translations, total_tokens = await _translate_openai(
                request.texts, request.source_language, request.target_language,
                request.context, api_key,
            )
            model_used = "gpt-4o-mini"

        elif request.backend == "deepseek":
            if not api_key:
                raise ValueError("DeepSeek API key required. Set via UI or DEEPSEEK_API_KEY env var.")
            translations, total_tokens = await _translate_openai(
                request.texts, request.source_language, request.target_language,
                request.context, api_key, model="deepseek-chat",
                base_url="https://api.deepseek.com",
            )
            model_used = "deepseek-chat"

        elif request.backend == "deepl":
            if not api_key:
                raise ValueError("DeepL API key required. Set via UI or DEEPL_API_KEY env var.")
            translations, total_tokens = await _translate_deepl(
                request.texts, request.source_language, request.target_language, api_key,
            )
            model_used = "deepl-api"

        elif request.backend == "local-llm":
            translations, total_tokens = await _translate_local_llm(
                request.texts, request.source_language, request.target_language,
                request.context, request.model,
            )
            model_used = request.model

        else:
            raise ValueError(f"Unknown backend: {request.backend}")

    except Exception as e:
        # On error, return originals with error note
        elapsed = (time.perf_counter() - start) * 1000
        return TranslationResult(
            translations=[
                TranslationEntry(original=t, translated=f"[Error: {str(e)[:50]}]", confidence=0.0)
                for t in request.texts
            ],
            backend_used=request.backend,
            model_used=model_used,
            total_tokens=0,
            inference_time_ms=elapsed,
        )

    elapsed = (time.perf_counter() - start) * 1000

    return TranslationResult(
        translations=[
            TranslationEntry(original=orig, translated=trans, confidence=0.9)
            for orig, trans in zip(request.texts, translations)
        ],
        backend_used=request.backend,
        model_used=model_used,
        total_tokens=total_tokens,
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
