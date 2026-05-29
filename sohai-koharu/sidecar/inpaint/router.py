"""
Inpainting module for removing source text from manga pages.

Supported models:
- lama-manga: LaMa model fine-tuned for manga/comic pages
- aot-inpainting: Aggregated Contextual Transformations inpainting
"""

import io
from fastapi import APIRouter, UploadFile, File, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

router = APIRouter()


class InpaintResult(BaseModel):
    model_used: str
    inference_time_ms: float
    output_width: int
    output_height: int


@router.post("/remove-text")
async def inpaint_text_regions(
    image: UploadFile = File(..., description="Source manga page"),
    mask: UploadFile = File(..., description="Binary mask of text regions to remove"),
    model: str = Query(default="lama-manga"),
):
    """
    Remove text from a manga page using the provided mask.
    
    The mask should be a binary image where white (255) indicates
    regions to inpaint (remove text from).
    
    Returns the inpainted image as PNG.
    """
    import time
    start = time.perf_counter()

    image_bytes = await image.read()
    mask_bytes = await mask.read()

    # TODO: Implement actual inpainting inference
    # For now, return the original image
    elapsed = (time.perf_counter() - start) * 1000

    return StreamingResponse(
        io.BytesIO(image_bytes),
        media_type="image/png",
        headers={
            "X-Model-Used": model,
            "X-Inference-Time-Ms": str(elapsed),
        },
    )


@router.post("/auto-mask")
async def generate_text_mask(
    image: UploadFile = File(..., description="Source manga page"),
    regions: str = Query(default="[]", description="JSON array of bounding boxes"),
):
    """
    Generate a binary mask from detected text regions.
    
    Uses the bounding boxes from detection to create a clean mask
    suitable for inpainting.
    """
    image_bytes = await image.read()

    # TODO: Generate mask from bounding boxes with slight expansion
    # For now return a placeholder
    return StreamingResponse(
        io.BytesIO(image_bytes),
        media_type="image/png",
    )
