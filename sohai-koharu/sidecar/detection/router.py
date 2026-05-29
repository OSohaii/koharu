"""
Text region and speech bubble detection using YOLO models.

Supported models:
- anime-text-yolo: Detects text regions in manga/anime images
- comic-text-bubble-detector: Detects both text and speech bubbles
"""

from fastapi import APIRouter, UploadFile, File, Query
from pydantic import BaseModel

router = APIRouter()


class BoundingBox(BaseModel):
    x: float
    y: float
    width: float
    height: float
    confidence: float
    label: str  # "text", "bubble", "caption"


class DetectionResult(BaseModel):
    boxes: list[BoundingBox]
    model_used: str
    inference_time_ms: float


@router.post("/detect", response_model=DetectionResult)
async def detect_text_regions(
    file: UploadFile = File(...),
    model: str = Query(default="anime-text-yolo", description="Detection model to use"),
    confidence_threshold: float = Query(default=0.5, ge=0.1, le=1.0),
):
    """
    Detect text regions and speech bubbles in a manga page.
    
    Returns bounding boxes with confidence scores and labels.
    """
    # TODO: Load model on-demand, run inference
    import time
    start = time.perf_counter()

    image_bytes = await file.read()

    # Placeholder - will be replaced with actual YOLO inference
    elapsed = (time.perf_counter() - start) * 1000

    return DetectionResult(
        boxes=[],
        model_used=model,
        inference_time_ms=elapsed,
    )
