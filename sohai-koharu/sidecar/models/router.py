"""
Model management: download, load, unload, and list available models.

Models are downloaded from HuggingFace Hub on demand and cached locally.
"""

from fastapi import APIRouter, Query
from pydantic import BaseModel

router = APIRouter()


class ModelInfo(BaseModel):
    id: str
    name: str
    category: str  # "detection", "ocr", "inpaint", "translation"
    size_mb: float
    format: str  # "onnx", "gguf", "pytorch", "safetensors"
    downloaded: bool
    loaded: bool
    hf_repo: str | None = None


class DownloadProgress(BaseModel):
    model_id: str
    progress: float  # 0.0 to 1.0
    downloaded_mb: float
    total_mb: float
    status: str  # "downloading", "complete", "error"


@router.get("/list", response_model=list[ModelInfo])
async def list_models(
    category: str | None = Query(default=None, description="Filter by category"),
):
    """List all available models and their download/load status."""
    # Catalog of supported models
    catalog = [
        ModelInfo(
            id="anime-text-yolo",
            name="Anime Text YOLO",
            category="detection",
            size_mb=23.0,
            format="onnx",
            downloaded=False,
            loaded=False,
            hf_repo="mayocream/anime-text-yolo",
        ),
        ModelInfo(
            id="comic-bubble-detector",
            name="Comic Text & Bubble Detector",
            category="detection",
            size_mb=45.0,
            format="onnx",
            downloaded=False,
            loaded=False,
            hf_repo="ogkalu/comic-text-and-bubble-detector",
        ),
        ModelInfo(
            id="manga-ocr",
            name="Manga OCR",
            category="ocr",
            size_mb=450.0,
            format="pytorch",
            downloaded=False,
            loaded=False,
            hf_repo="mayocream/manga-ocr",
        ),
        ModelInfo(
            id="paddleocr-vl",
            name="PaddleOCR VL 1.5",
            category="ocr",
            size_mb=800.0,
            format="pytorch",
            downloaded=False,
            loaded=False,
            hf_repo="PaddlePaddle/PaddleOCR-VL-1.5",
        ),
        ModelInfo(
            id="lama-manga",
            name="LaMa Manga",
            category="inpaint",
            size_mb=200.0,
            format="onnx",
            downloaded=False,
            loaded=False,
            hf_repo="mayocream/lama-manga",
        ),
        ModelInfo(
            id="aot-inpainting",
            name="AOT Inpainting",
            category="inpaint",
            size_mb=85.0,
            format="onnx",
            downloaded=False,
            loaded=False,
            hf_repo="mayocream/aot-inpainting",
        ),
        ModelInfo(
            id="qwen3.5-4b",
            name="Qwen 3.5 4B",
            category="translation",
            size_mb=2800.0,
            format="gguf",
            downloaded=False,
            loaded=False,
            hf_repo="unsloth/Qwen3.5-4B-GGUF",
        ),
        ModelInfo(
            id="qwen3.5-9b",
            name="Qwen 3.5 9B",
            category="translation",
            size_mb=5600.0,
            format="gguf",
            downloaded=False,
            loaded=False,
            hf_repo="unsloth/Qwen3.5-9B-GGUF",
        ),
        ModelInfo(
            id="gemma4-e2b",
            name="Gemma 4 E2B",
            category="translation",
            size_mb=1500.0,
            format="gguf",
            downloaded=False,
            loaded=False,
            hf_repo="unsloth/gemma-4-E2B-it-GGUF",
        ),
        ModelInfo(
            id="sakura-7b",
            name="Sakura GalTransl 7B",
            category="translation",
            size_mb=4200.0,
            format="gguf",
            downloaded=False,
            loaded=False,
            hf_repo="SakuraLLM/Sakura-GalTransl-7B-v3.7",
        ),
    ]

    if category:
        catalog = [m for m in catalog if m.category == category]

    return catalog


@router.post("/download")
async def download_model(model_id: str = Query(...)):
    """
    Start downloading a model from HuggingFace Hub.
    
    Downloads are cached in the local models directory.
    """
    # TODO: Implement async download with progress tracking
    return {"status": "started", "model_id": model_id}


@router.post("/load")
async def load_model(model_id: str = Query(...)):
    """Load a downloaded model into memory for inference."""
    # TODO: Load model into GPU/CPU memory
    return {"status": "loaded", "model_id": model_id}


@router.post("/unload")
async def unload_model(model_id: str = Query(...)):
    """Unload a model from memory to free GPU/RAM."""
    # TODO: Unload model
    return {"status": "unloaded", "model_id": model_id}
