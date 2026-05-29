import { create } from 'zustand'

export type ViewMode = 'editor' | 'library'
export type CanvasMode = 'select' | 'block' | 'brush' | 'eraser'

export interface PageEntry {
  id: string
  filename: string
  thumbnailUrl?: string
  status: 'idle' | 'detecting' | 'ocr' | 'translating' | 'inpainting' | 'done' | 'error'
  errorMessage?: string
}

export interface EditorState {
  // View
  currentView: ViewMode
  setCurrentView: (view: ViewMode) => void

  // Canvas
  canvasMode: CanvasMode
  setCanvasMode: (mode: CanvasMode) => void
  scale: number
  setScale: (scale: number) => void
  panX: number
  panY: number
  setPan: (x: number, y: number) => void
  resetView: () => void

  // Pages
  pages: PageEntry[]
  currentPageIndex: number
  currentImageUrl: string | null
  setPages: (pages: PageEntry[]) => void
  setCurrentPageIndex: (index: number) => void
  setCurrentImageUrl: (url: string | null) => void

  // Panel visibility
  showNavigator: boolean
  showControls: boolean
  toggleNavigator: () => void
  toggleControls: () => void

  // Layers visibility
  showOriginal: boolean
  showInpainted: boolean
  showTextBlocks: boolean
  showRendered: boolean
  toggleLayer: (layer: 'original' | 'inpainted' | 'textBlocks' | 'rendered') => void
}

export const useEditorStore = create<EditorState>((set) => ({
  // View
  currentView: 'editor',
  setCurrentView: (view) => set({ currentView: view }),

  // Canvas
  canvasMode: 'select',
  setCanvasMode: (mode) => set({ canvasMode: mode }),
  scale: 100,
  setScale: (scale) => set({ scale: Math.max(10, Math.min(500, scale)) }),
  panX: 0,
  panY: 0,
  setPan: (x, y) => set({ panX: x, panY: y }),
  resetView: () => set({ scale: 100, panX: 0, panY: 0 }),

  // Pages
  pages: [],
  currentPageIndex: 0,
  currentImageUrl: null,
  setPages: (pages) => set({ pages }),
  setCurrentPageIndex: (index) => set({ currentPageIndex: index }),
  setCurrentImageUrl: (url) => set({ currentImageUrl: url }),

  // Panel visibility
  showNavigator: true,
  showControls: true,
  toggleNavigator: () => set((s) => ({ showNavigator: !s.showNavigator })),
  toggleControls: () => set((s) => ({ showControls: !s.showControls })),

  // Layers
  showOriginal: true,
  showInpainted: true,
  showTextBlocks: true,
  showRendered: true,
  toggleLayer: (layer) =>
    set((s) => {
      switch (layer) {
        case 'original': return { showOriginal: !s.showOriginal }
        case 'inpainted': return { showInpainted: !s.showInpainted }
        case 'textBlocks': return { showTextBlocks: !s.showTextBlocks }
        case 'rendered': return { showRendered: !s.showRendered }
      }
    }),
}))
