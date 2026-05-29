"""
OCR module for reading text from detected regions.

Supported models:
- manga-ocr: Specialized for Japanese manga text
- paddleocr: Multi-language OCR (Japanese, Korean, Chinese, English)
"""

from fastapi import APIRouter, UploadFile, File, Query
from pydantic import BaseModel

router = APIRouter()


class OcrRegion(BaseModel):
    """A cropped region to OCR."""
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


@router.post("/recognize", response_model=OcrBatchResult)
async def recognize_text(
    file: UploadFile = File(...),
    regions: str = Query(default="[]", description="JSON array of regions to OCR"),
    model: str = Query(default="manga-ocr"),
):
    """
    Recognize text in specified regions of a manga page.
    
    If no regions are specified, OCRs the entire image.
    """
    import time
    start = time.perf_counter()

    image_bytes = await file.read()

    # TODO: Implement actual OCR inference
    elapsed = (time.perf_counter() - start) * 1000

    return OcrBatchResult(
        results=[],
        model_used=model,
        inference_time_ms=elapsed,
    )
