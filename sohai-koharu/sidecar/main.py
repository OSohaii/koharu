"""
SohaiKoharu AI Sidecar - FastAPI server for ML pipeline.

This server is spawned by the Tauri desktop app and provides:
- Text detection (YOLO-based)
- OCR (Manga-OCR / PaddleOCR)
- Inpainting (LaMa)
- Translation (local LLM via llama.cpp or external APIs)
- Model management (download, load, unload)
"""

import os
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from detection.router import router as detection_router
from ocr.router import router as ocr_router
from inpaint.router import router as inpaint_router
from translate.router import router as translate_router
from models.router import router as models_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup/shutdown lifecycle for model preloading."""
    print("[SohaiKoharu Sidecar] Starting AI pipeline...")
    # Models are loaded on-demand, not at startup
    yield
    print("[SohaiKoharu Sidecar] Shutting down...")


app = FastAPI(
    title="SohaiKoharu AI Sidecar",
    version="0.1.0",
    description="ML pipeline for manga translation",
    lifespan=lifespan,
)

# CORS for Tauri webview (localhost)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(detection_router, prefix="/api/detection", tags=["detection"])
app.include_router(ocr_router, prefix="/api/ocr", tags=["ocr"])
app.include_router(inpaint_router, prefix="/api/inpaint", tags=["inpaint"])
app.include_router(translate_router, prefix="/api/translate", tags=["translate"])
app.include_router(models_router, prefix="/api/models", tags=["models"])


@app.get("/api/health")
async def health():
    """Health check endpoint."""
    return {
        "status": "ok",
        "version": "0.1.0",
        "gpu_available": _check_gpu(),
    }


def _check_gpu() -> bool:
    """Check if CUDA/MPS GPU is available."""
    try:
        import torch
        return torch.cuda.is_available() or torch.backends.mps.is_available()
    except ImportError:
        return False


if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("SIDECAR_PORT", "8765"))
    uvicorn.run(app, host="127.0.0.1", port=port, log_level="info")
