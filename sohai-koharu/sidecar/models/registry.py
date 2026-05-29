"""
Model registry: tracks downloaded models and manages local cache.
"""

import os
from pathlib import Path
from dataclasses import dataclass

# Default models directory (can be overridden via env var)
MODELS_DIR = Path(os.environ.get("SOHAI_MODELS_DIR", Path.home() / ".sohai-koharu" / "models"))


@dataclass
class ModelEntry:
    id: str
    hf_repo: str
    filename: str | None = None  # Specific file in the repo
    subfolder: str | None = None


# Official model catalog
MODEL_CATALOG: dict[str, ModelEntry] = {
    "anime-text-yolo": ModelEntry(
        id="anime-text-yolo",
        hf_repo="mayocream/anime-text-yolo",
        filename="model.onnx",
    ),
    "comic-bubble-detector": ModelEntry(
        id="comic-bubble-detector",
        hf_repo="ogkalu/comic-text-and-bubble-detector",
    ),
    "manga-ocr": ModelEntry(
        id="manga-ocr",
        hf_repo="mayocream/manga-ocr",
    ),
    "lama-manga": ModelEntry(
        id="lama-manga",
        hf_repo="mayocream/lama-manga",
        filename="lama_manga.onnx",
    ),
    "aot-inpainting": ModelEntry(
        id="aot-inpainting",
        hf_repo="mayocream/aot-inpainting",
    ),
    "qwen3.5-4b": ModelEntry(
        id="qwen3.5-4b",
        hf_repo="unsloth/Qwen3.5-4B-GGUF",
        filename="Qwen3.5-4B-Q4_K_M.gguf",
    ),
    "qwen3.5-9b": ModelEntry(
        id="qwen3.5-9b",
        hf_repo="unsloth/Qwen3.5-9B-GGUF",
        filename="Qwen3.5-9B-Q4_K_M.gguf",
    ),
    "gemma4-e2b": ModelEntry(
        id="gemma4-e2b",
        hf_repo="unsloth/gemma-4-E2B-it-GGUF",
        filename="gemma-4-E2B-it-Q4_K_M.gguf",
    ),
    "gemma4-e4b": ModelEntry(
        id="gemma4-e4b",
        hf_repo="unsloth/gemma-4-E4B-it-GGUF",
        filename="gemma-4-E4B-it-Q4_K_M.gguf",
    ),
    "sakura-7b": ModelEntry(
        id="sakura-7b",
        hf_repo="SakuraLLM/Sakura-GalTransl-7B-v3.7",
    ),
}


def get_model_path(model_id: str) -> Path:
    """Get the local cache path for a model."""
    return MODELS_DIR / model_id


def is_model_downloaded(model_id: str) -> bool:
    """Check if a model is already downloaded."""
    model_path = get_model_path(model_id)
    return model_path.exists() and any(model_path.iterdir())


def ensure_models_dir():
    """Create the models directory if it doesn't exist."""
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
