"""
Text region and speech bubble detection using YOLO models.

Supported models:
- anime-text-yolo: Detects text regions in manga/anime images
- comic-text-bubble-detector: Detects both text and speech bubbles

Models are downloaded from HuggingFace Hub on first use.
"""

import io
import time
from pathlib import Path

from fastapi import APIRouter, UploadFile, File, Query
from pydantic import BaseModel
from PIL import Image
import numpy as np

router = APIRouter()

# In-memory model cache
_loaded_models: dict = {}


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
    image_width: int
    image_height: int


def _get_model(model_id: str):
    """Load or get cached YOLO model."""
    if model_id in _loaded_models:
        return _loaded_models[model_id]

    try:
        from ultralytics import YOLO
        from huggingface_hub import hf_hub_download

        if model_id == "anime-text-yolo":
            # Download from HuggingFace
            model_path = hf_hub_download(
                repo_id="mayocream/anime-text-yolo",
                filename="model.pt",
                cache_dir=str(Path.home() / ".sohai-koharu" / "models"),
            )
            model = YOLO(model_path)
        elif model_id == "comic-bubble-detector":
            model_path = hf_hub_download(
                repo_id="ogkalu/comic-text-and-bubble-detector",
                filename="model.pt",
                cache_dir=str(Path.home() / ".sohai-koharu" / "models"),
            )
            model = YOLO(model_path)
        else:
            raise ValueError(f"Unknown detection model: {model_id}")

        _loaded_models[model_id] = model
        return model

    except ImportError as e:
        raise RuntimeError(
            f"Required package not installed: {e}. "
            "Run: pip install ultralytics huggingface-hub"
        )
    except Exception as e:
        raise RuntimeError(f"Failed to load model '{model_id}': {e}")


@router.post("/detect", response_model=DetectionResult)
async def detect_text_regions(
    file: UploadFile = File(...),
    model: str = Query(default="anime-text-yolo", description="Detection model to use"),
    confidence_threshold: float = Query(default=0.3, ge=0.1, le=1.0),
):
    """
    Detect text regions and speech bubbles in a manga page.
    
    Returns bounding boxes with confidence scores and labels.
    The bounding boxes use (x, y, width, height) format where
    (x, y) is the top-left corner.
    """
    start = time.perf_counter()

    # Read image
    image_bytes = await file.read()
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img_w, img_h = image.size

    try:
        yolo_model = _get_model(model)
    except RuntimeError as e:
        # Fallback: return empty result if model not available
        elapsed = (time.perf_counter() - start) * 1000
        return DetectionResult(
            boxes=[],
            model_used=f"{model} (unavailable: {e})",
            inference_time_ms=elapsed,
            image_width=img_w,
            image_height=img_h,
        )

    # Run inference
    results = yolo_model.predict(
        source=np.array(image),
        conf=confidence_threshold,
        verbose=False,
    )

    boxes: list[BoundingBox] = []
    if results and len(results) > 0:
        result = results[0]
        if result.boxes is not None:
            for box in result.boxes:
                # YOLO returns xyxy format
                x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                conf = float(box.conf[0].cpu().numpy())
                cls_id = int(box.cls[0].cpu().numpy())

                # Map class IDs to labels
                class_names = result.names if hasattr(result, 'names') else {}
                label = class_names.get(cls_id, "text")

                boxes.append(BoundingBox(
                    x=float(x1),
                    y=float(y1),
                    width=float(x2 - x1),
                    height=float(y2 - y1),
                    confidence=conf,
                    label=str(label),
                ))

    elapsed = (time.perf_counter() - start) * 1000

    return DetectionResult(
        boxes=boxes,
        model_used=model,
        inference_time_ms=elapsed,
        image_width=img_w,
        image_height=img_h,
    )


@router.get("/status")
async def detection_status():
    """Check which detection models are loaded."""
    return {
        "loaded_models": list(_loaded_models.keys()),
        "available_models": ["anime-text-yolo", "comic-bubble-detector"],
    }
