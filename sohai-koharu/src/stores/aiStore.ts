import { create } from 'zustand'

export type DetectionModel = 'anime-text-yolo' | 'comic-bubble-detector'
export type OcrModel = 'manga-ocr' | 'paddleocr'
export type InpaintModel = 'lama-manga' | 'aot-inpainting'
export type TranslationBackend = 'local-llm' | 'gemini' | 'openai' | 'deepl' | 'deepseek'
export type LocalLlmModel = 'gemma4-e2b' | 'gemma4-e4b' | 'qwen3.5-4b' | 'qwen3.5-9b' | 'sakura-7b'

export interface AiState {
  // Model selection
  detectionModel: DetectionModel
  ocrModel: OcrModel
  inpaintModel: InpaintModel
  translationBackend: TranslationBackend
  localLlmModel: LocalLlmModel

  // API keys (stored in-memory, persisted via Tauri keychain)
  apiKeys: Record<string, string>

  // Translation settings
  sourceLanguage: string
  targetLanguage: string
  contextWindow: number

  // Sidecar status
  sidecarStatus: 'starting' | 'ready' | 'error' | 'stopped'
  sidecarPort: number

  // Actions
  setDetectionModel: (model: DetectionModel) => void
  setOcrModel: (model: OcrModel) => void
  setInpaintModel: (model: InpaintModel) => void
  setTranslationBackend: (backend: TranslationBackend) => void
  setLocalLlmModel: (model: LocalLlmModel) => void
  setApiKey: (provider: string, key: string) => void
  setSourceLanguage: (lang: string) => void
  setTargetLanguage: (lang: string) => void
  setSidecarStatus: (status: AiState['sidecarStatus']) => void
  setSidecarPort: (port: number) => void
}

export const useAiStore = create<AiState>((set) => ({
  detectionModel: 'anime-text-yolo',
  ocrModel: 'manga-ocr',
  inpaintModel: 'lama-manga',
  translationBackend: 'local-llm',
  localLlmModel: 'qwen3.5-4b',
  apiKeys: {},
  sourceLanguage: 'ja',
  targetLanguage: 'pt-BR',
  contextWindow: 4,
  sidecarStatus: 'stopped',
  sidecarPort: 8765,

  setDetectionModel: (model) => set({ detectionModel: model }),
  setOcrModel: (model) => set({ ocrModel: model }),
  setInpaintModel: (model) => set({ inpaintModel: model }),
  setTranslationBackend: (backend) => set({ translationBackend: backend }),
  setLocalLlmModel: (model) => set({ localLlmModel: model }),
  setApiKey: (provider, key) => set((s) => ({ apiKeys: { ...s.apiKeys, [provider]: key } })),
  setSourceLanguage: (lang) => set({ sourceLanguage: lang }),
  setTargetLanguage: (lang) => set({ targetLanguage: lang }),
  setSidecarStatus: (status) => set({ sidecarStatus: status }),
  setSidecarPort: (port) => set({ sidecarPort: port }),
}))
