import { useEffect, useRef } from 'react'
import { useEditorStore } from '@/stores/editorStore'
import { useCanvasGestures } from '@/hooks/useCanvasGestures'
import { ToolRail } from './ToolRail'
import { BrushCanvas } from './BrushCanvas'
import { TextBlockLayer } from './TextBlockLayer'

/**
 * Primary canvas workspace using DOM-based layers + CSS transforms.
 * Inspired by Koharu's approach: div transforms + @use-gesture for zoom/pan.
 * 
 * Layers (bottom to top):
 * 1. Original manga page image
 * 2. Inpainted image overlay
 * 3. Text block DOM overlay (positioned divs)
 * 4. Brush canvas (only for brush/eraser mode)
 */
export function Workspace() {
  const { pages, currentPageIndex, scale, currentImageUrl } = useEditorStore()
  const currentPage = pages[currentPageIndex]

  return (
    <div className="relative flex h-full w-full overflow-hidden bg-neutral-900">
      {/* Tool Rail (left side) */}
      <ToolRail />

      {/* Canvas Viewport */}
      <div className="flex-1 relative overflow-hidden">
        {currentPage || currentImageUrl ? (
          <CanvasViewport />
        ) : (
          <EmptyState />
        )}
      </div>

      {/* Zoom indicator */}
      <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded bg-black/60 px-2 py-1 text-[10px] text-white select-none">
        <button
          onClick={() => useEditorStore.getState().setScale(scale - 10)}
          className="hover:text-primary px-0.5"
        >
          −
        </button>
        <span className="min-w-[3ch] text-center">{scale}%</span>
        <button
          onClick={() => useEditorStore.getState().setScale(scale + 10)}
          className="hover:text-primary px-0.5"
        >
          +
        </button>
        <button
          onClick={() => useEditorStore.getState().resetView()}
          className="ml-1 hover:text-primary text-[9px]"
          title="Reset view (double-click)"
        >
          ⟲
        </button>
      </div>
    </div>
  )
}

function CanvasViewport() {
  const { scale, panX, panY, currentImageUrl, canvasMode } = useEditorStore()
  const { bind, handleKeyDown, handleKeyUp } = useCanvasGestures()
  const viewportRef = useRef<HTMLDivElement>(null)
  const scaleRatio = scale / 100

  // Register space key listeners for space+drag panning
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [handleKeyDown, handleKeyUp])

  // Cursor based on mode
  const getCursor = () => {
    switch (canvasMode) {
      case 'select': return 'default'
      case 'block': return 'crosshair'
      case 'brush': return 'none'
      case 'eraser': return 'none'
      default: return 'default'
    }
  }

  return (
    <div
      ref={viewportRef}
      {...bind()}
      className="flex h-full w-full items-center justify-center touch-none"
      style={{ cursor: getCursor() }}
    >
      <div
        style={{
          transform: `translate(${panX}px, ${panY}px) scale(${scaleRatio})`,
          transformOrigin: 'center center',
          willChange: 'transform',
        }}
        className="relative"
      >
        {/* Image Layer */}
        <div className="relative">
          {currentImageUrl ? (
            <img
              src={currentImageUrl}
              alt="Manga page"
              className="max-w-none select-none pointer-events-none"
              draggable={false}
            />
          ) : (
            <div className="w-[800px] h-[1200px] bg-muted/20 rounded border border-dashed border-muted-foreground/20 flex items-center justify-center">
              <span className="text-muted-foreground/50 text-sm">Pagina</span>
            </div>
          )}

          {/* Text Block Overlay Layer (DOM-based) */}
          <TextBlockLayer />

          {/* Brush Canvas Overlay (only active in brush/eraser mode) */}
          <BrushCanvas width={800} height={1200} />
        </div>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground gap-4">
      <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
        <span className="text-3xl opacity-50">📄</span>
      </div>
      <div>
        <p className="text-sm font-medium">Nenhuma pagina aberta</p>
        <p className="text-xs mt-1 text-muted-foreground/70">
          Arraste imagens aqui ou abra um manga da biblioteca
        </p>
      </div>
      <div className="text-[10px] text-muted-foreground/50 mt-2 space-y-0.5">
        <p>Ctrl+Scroll = Zoom | Middle-drag = Pan</p>
        <p>Double-click = Reset | Ctrl+0 = 100%</p>
      </div>
    </div>
  )
}
