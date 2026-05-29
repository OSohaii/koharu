/**
 * HTTP client for communicating with the Python AI sidecar.
 */

const SIDECAR_BASE = 'http://127.0.0.1:8765'

export interface HealthResponse {
  status: string
  version: string
  gpu_available: boolean
}

export interface DetectionBox {
  x: number
  y: number
  width: number
  height: number
  confidence: number
  label: string
}

export interface DetectionResult {
  boxes: DetectionBox[]
  model_used: string
  inference_time_ms: number
}

export interface OcrResult {
  results: { text: string; confidence: number; region: DetectionBox; language_detected: string }[]
  model_used: string
  inference_time_ms: number
}

export interface TranslationEntry {
  original: string
  translated: string
  confidence: number | null
}

export interface TranslationResult {
  translations: TranslationEntry[]
  backend_used: string
  model_used: string
  total_tokens: number
  inference_time_ms: number
}

export async function checkHealth(): Promise<HealthResponse> {
  const resp = await fetch(`${SIDECAR_BASE}/api/health`)
  if (!resp.ok) throw new Error(`Sidecar health check failed: ${resp.status}`)
  return resp.json()
}

export async function detectText(imageFile: File, model = 'anime-text-yolo'): Promise<DetectionResult> {
  const form = new FormData()
  form.append('file', imageFile)
  const resp = await fetch(`${SIDECAR_BASE}/api/detection/detect?model=${model}`, {
    method: 'POST',
    body: form,
  })
  if (!resp.ok) throw new Error(`Detection failed: ${resp.status}`)
  return resp.json()
}

export async function recognizeText(imageFile: File, model = 'manga-ocr'): Promise<OcrResult> {
  const form = new FormData()
  form.append('file', imageFile)
  const resp = await fetch(`${SIDECAR_BASE}/api/ocr/recognize?model=${model}`, {
    method: 'POST',
    body: form,
  })
  if (!resp.ok) throw new Error(`OCR failed: ${resp.status}`)
  return resp.json()
}

export async function translateBatch(
  texts: string[],
  sourceLang = 'ja',
  targetLang = 'pt-BR',
  backend = 'local-llm',
  model = 'qwen3.5-4b',
): Promise<TranslationResult> {
  const resp = await fetch(`${SIDECAR_BASE}/api/translate/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      texts,
      source_language: sourceLang,
      target_language: targetLang,
      backend,
      model,
    }),
  })
  if (!resp.ok) throw new Error(`Translation failed: ${resp.status}`)
  return resp.json()
}

export async function inpaintImage(imageFile: File, maskFile: File, model = 'lama-manga'): Promise<Blob> {
  const form = new FormData()
  form.append('image', imageFile)
  form.append('mask', maskFile)
  const resp = await fetch(`${SIDECAR_BASE}/api/inpaint/remove-text?model=${model}`, {
    method: 'POST',
    body: form,
  })
  if (!resp.ok) throw new Error(`Inpainting failed: ${resp.status}`)
  return resp.blob()
}
