import { create } from 'zustand'

export interface TextBlock {
  id: string
  pageId: string
  // Bounding box (pixels, relative to original image)
  x: number
  y: number
  width: number
  height: number
  // Detection
  confidence: number
  label: string // "text", "bubble", "caption"
  // OCR result
  originalText: string
  ocrConfidence: number
  languageDetected: string
  // Translation
  translatedText: string
  translationBackend: string
  // UI state
  isSelected: boolean
  isEditing: boolean
}

export type PipelineStep = 'idle' | 'detecting' | 'ocr' | 'translating' | 'done' | 'error'

export interface PipelineProgress {
  step: PipelineStep
  currentStepProgress: number // 0-100
  totalSteps: number
  completedSteps: number
  message: string
  error?: string
}

export interface TextBlocksState {
  // Blocks indexed by pageId
  blocksByPage: Record<string, TextBlock[]>

  // Pipeline state per page
  pipelineByPage: Record<string, PipelineProgress>

  // Global pipeline running state
  isRunning: boolean

  // Actions
  setBlocksForPage: (pageId: string, blocks: TextBlock[]) => void
  addBlock: (pageId: string, block: TextBlock) => void
  updateBlock: (pageId: string, blockId: string, patch: Partial<TextBlock>) => void
  removeBlock: (pageId: string, blockId: string) => void
  clearPage: (pageId: string) => void
  selectBlock: (pageId: string, blockId: string) => void
  deselectAll: (pageId: string) => void

  // Pipeline
  setPipelineState: (pageId: string, progress: PipelineProgress) => void
  setIsRunning: (running: boolean) => void
  resetPipeline: (pageId: string) => void

  // Getters
  getBlocksForPage: (pageId: string) => TextBlock[]
  getPipelineForPage: (pageId: string) => PipelineProgress
}

const DEFAULT_PIPELINE: PipelineProgress = {
  step: 'idle',
  currentStepProgress: 0,
  totalSteps: 3,
  completedSteps: 0,
  message: '',
}

export const useTextBlocksStore = create<TextBlocksState>((set, get) => ({
  blocksByPage: {},
  pipelineByPage: {},
  isRunning: false,

  setBlocksForPage: (pageId, blocks) =>
    set((s) => ({
      blocksByPage: { ...s.blocksByPage, [pageId]: blocks },
    })),

  addBlock: (pageId, block) =>
    set((s) => ({
      blocksByPage: {
        ...s.blocksByPage,
        [pageId]: [...(s.blocksByPage[pageId] || []), block],
      },
    })),

  updateBlock: (pageId, blockId, patch) =>
    set((s) => ({
      blocksByPage: {
        ...s.blocksByPage,
        [pageId]: (s.blocksByPage[pageId] || []).map((b) =>
          b.id === blockId ? { ...b, ...patch } : b,
        ),
      },
    })),

  removeBlock: (pageId, blockId) =>
    set((s) => ({
      blocksByPage: {
        ...s.blocksByPage,
        [pageId]: (s.blocksByPage[pageId] || []).filter((b) => b.id !== blockId),
      },
    })),

  clearPage: (pageId) =>
    set((s) => ({
      blocksByPage: { ...s.blocksByPage, [pageId]: [] },
      pipelineByPage: { ...s.pipelineByPage, [pageId]: DEFAULT_PIPELINE },
    })),

  selectBlock: (pageId, blockId) =>
    set((s) => ({
      blocksByPage: {
        ...s.blocksByPage,
        [pageId]: (s.blocksByPage[pageId] || []).map((b) => ({
          ...b,
          isSelected: b.id === blockId,
        })),
      },
    })),

  deselectAll: (pageId) =>
    set((s) => ({
      blocksByPage: {
        ...s.blocksByPage,
        [pageId]: (s.blocksByPage[pageId] || []).map((b) => ({
          ...b,
          isSelected: false,
          isEditing: false,
        })),
      },
    })),

  setPipelineState: (pageId, progress) =>
    set((s) => ({
      pipelineByPage: { ...s.pipelineByPage, [pageId]: progress },
    })),

  setIsRunning: (running) => set({ isRunning: running }),

  resetPipeline: (pageId) =>
    set((s) => ({
      pipelineByPage: { ...s.pipelineByPage, [pageId]: DEFAULT_PIPELINE },
    })),

  getBlocksForPage: (pageId) => get().blocksByPage[pageId] || [],
  getPipelineForPage: (pageId) => get().pipelineByPage[pageId] || DEFAULT_PIPELINE,
}))
