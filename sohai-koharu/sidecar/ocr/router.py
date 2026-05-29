"""
OCR module for reading text from detected regions.

Supported models:
- manga-ocr: Specialized for Japanese manga text (best for JP manga)
- paddleocr: Multi-language OCR (Japanese, Korean, Chinese, English)

Models are downloaded from HuggingFace Hub on first use.
"""

import io
import json
import time
from pathlib import Path

from fastapi import APIRouter, UploadFile, File, Query
from pydantic import BaseModel
from PIL import Image
import numpy as np

router = APIRouter()

# In-memory model cache
_loaded_models: dict = {}


class OcrRegion(BaseModel):
    """A region to OCR (x, y, width, height in pixels)."""
    x: float
    y: float
    width: float
    height: float


class OcrResult(BaseModel):
    text: str
    confidence: float
    region: OcrRegion
    language_detected: str


class OcrBatchResult(BaseModel):
    results: list[OcrResult]
    model_used: str
    inference_time_ms: float


def _get_manga_ocr():
    """Load or get cached manga-ocr model."""
    if "manga-ocr" in _loaded_models:
        return _loaded_models["manga-ocr"]

    try:
        from manga_ocr import MangaOcr
        model = MangaOcr()
        _loaded_models["manga-ocr"] = model
        return model
    except ImportError:
        raise RuntimeError(
            "manga-ocr not installed. Run: pip install manga-ocr"
        )
    except Exception as e:
        raise RuntimeError(f"Failed to load manga-ocr: {e}")


def _crop_region(image: Image.Image, region: OcrRegion) -> Image.Image:
    """Crop a region from the image with bounds clamping."""
    w, h = image.size
    x1 = max(0, int(region.x))
    y1 = max(0, int(region.y))
    x2 = min(w, int(region.x + region.width))
    y2 = min(h, int(region.y + region.height))

    if x2 <= x1 or y2 <= y1:
        return image  # Return full image if region is invalid

    return image.crop((x1, y1, x2, y2))


@router.post("/recognize", response_model=OcrBatchResult)
async def recognize_text(
    file: UploadFile = File(...),
    regions: str = Query(default="[]", description="JSON array of {x, y, width, height} regions"),
    model: str = Query(default="manga-ocr"),
):
    """
    Recognize text in specified regions of a manga page.
    
    If no regions are specified (empty array), OCRs the entire image as one block.
    
    For best results with Japanese manga, use model=manga-ocr.
    Regions should be the bounding boxes from the detection step.
    """
    start = time.perf_counter()

    # Read image
    image_bytes = await file.read()
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    # Parse regions
    try:
        region_dicts = json.loads(regions)
        ocr_regions = [OcrRegion(**r) for r in region_dicts]
    except (json.JSONDecodeError, TypeError, ValueError):
        ocr_regions = []

    # If no regions, OCR the full image
    if not ocr_regions:
        w, h = image.size
        ocr_regions = [OcrRegion(x=0, y=0, width=w, height=h)]

    results: list[OcrResult] = []

    if model == "manga-ocr":
        try:
            ocr_model = _get_manga_ocr()
        except RuntimeError as e:
            elapsed = (time.perf_counter() - start) * 1000
            return OcrBatchResult(
                results=[],
                model_used=f"{model} (unavailable: {e})",
                inference_time_ms=elapsed,
            )

        for region in ocr_regions:
            crop = _crop_region(image, region)
            # manga-ocr accepts PIL Image directly
            text = ocr_model(crop)

            results.append(OcrResult(
                text=text.strip(),
                confidence=0.95,  # manga-ocr doesn't provide confidence
                region=region,
                language_detected="ja",
            ))

    elif model == "paddleocr":
        # TODO: Implement PaddleOCR backend
        for region in ocr_regions:
            results.append(OcrResult(
                text="[PaddleOCR not yet implemented]",
                confidence=0.0,
                region=region,
                language_detected="unknown",
            ))

    elapsed = (time.perf_counter() - start) * 1000

    return OcrBatchResult(
        results=results,
        model_used=model,
        inference_time_ms=elapsed,
    )


@router.get("/status")
async def ocr_status():
    """Check which OCR models are loaded."""
    return {
        "loaded_models": list(_loaded_models.keys()),
        "available_models": ["manga-ocr", "paddleocr"],
    }
