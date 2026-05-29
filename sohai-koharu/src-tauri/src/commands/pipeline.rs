use serde::{Deserialize, Serialize};
use tauri::State;

use crate::sidecar::SidecarHandle;

#[derive(Debug, Serialize, Deserialize)]
pub struct DetectionBox {
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
    pub confidence: f64,
    pub label: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PipelineResult {
    pub status: String,
    pub message: String,
}

/// Run text detection on a page image via the Python sidecar.
#[tauri::command]
pub async fn run_detection(
    sidecar: State<'_, SidecarHandle>,
    image_path: String,
    model: Option<String>,
) -> Result<Vec<DetectionBox>, String> {
    let port = sidecar.port();
    let model = model.unwrap_or_else(|| "anime-text-yolo".to_string());

    // Call sidecar API
    let client = reqwest::Client::new();
    let form = reqwest::multipart::Form::new()
        .file("file", &image_path)
        .await
        .map_err(|e| format!("Failed to read image: {}", e))?;

    let resp = client
        .post(format!("http://127.0.0.1:{}/api/detection/detect?model={}", port, model))
        .multipart(form)
        .send()
        .await
        .map_err(|e| format!("Sidecar request failed: {}", e))?;

    if !resp.status().is_success() {
        return Err(format!("Detection failed with status {}", resp.status()));
    }

    #[derive(Deserialize)]
    struct ApiResponse {
        boxes: Vec<DetectionBox>,
    }

    let result: ApiResponse = resp
        .json()
        .await
        .map_err(|e| format!("Failed to parse response: {}", e))?;

    Ok(result.boxes)
}

/// Run OCR on detected regions.
#[tauri::command]
pub async fn run_ocr(
    sidecar: State<'_, SidecarHandle>,
    image_path: String,
    model: Option<String>,
) -> Result<PipelineResult, String> {
    let _port = sidecar.port();
    let _model = model.unwrap_or_else(|| "manga-ocr".to_string());

    // TODO: Implement OCR call to sidecar
    Ok(PipelineResult {
        status: "success".to_string(),
        message: "OCR completed".to_string(),
    })
}

/// Run translation on OCR results.
#[tauri::command]
pub async fn run_translation(
    sidecar: State<'_, SidecarHandle>,
    texts: Vec<String>,
    source_lang: String,
    target_lang: String,
    backend: Option<String>,
) -> Result<PipelineResult, String> {
    let _port = sidecar.port();
    let _backend = backend.unwrap_or_else(|| "local-llm".to_string());

    // TODO: Implement translation call to sidecar
    Ok(PipelineResult {
        status: "success".to_string(),
        message: format!("Translated {} texts", texts.len()),
    })
}

/// Run inpainting to remove source text.
#[tauri::command]
pub async fn run_inpaint(
    sidecar: State<'_, SidecarHandle>,
    image_path: String,
    model: Option<String>,
) -> Result<PipelineResult, String> {
    let _port = sidecar.port();
    let _model = model.unwrap_or_else(|| "lama-manga".to_string());

    // TODO: Implement inpaint call to sidecar
    Ok(PipelineResult {
        status: "success".to_string(),
        message: "Inpainting completed".to_string(),
    })
}

/// Run the full pipeline: detect -> OCR -> translate -> inpaint on a page.
#[tauri::command]
pub async fn run_full_pipeline(
    sidecar: State<'_, SidecarHandle>,
    image_path: String,
) -> Result<PipelineResult, String> {
    if !sidecar.is_running() {
        return Err("AI sidecar is not running. Please restart it.".to_string());
    }

    // TODO: Run all steps sequentially, updating page status in DB
    Ok(PipelineResult {
        status: "success".to_string(),
        message: "Full pipeline completed".to_string(),
    })
}
