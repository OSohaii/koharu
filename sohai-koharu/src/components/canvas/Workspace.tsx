import { useEditorStore } from '@/stores/editorStore'
import { ToolRail } from './ToolRail'

/**
 * Primary canvas workspace using DOM-based layers + CSS transforms.
 * Inspired by Koharu's approach: div transforms + @use-gesture for zoom/pan.
 * Canvas 2D is reserved only for the brush/eraser overlay.
 */
export function Workspace() {
  const { pages, currentPageIndex, scale } = useEditorStore()
  const currentPage = pages[currentPageIndex]

  return (
    <div className="relative flex h-full w-full overflow-hidden bg-neutral-900">
      {/* Tool Rail (left side) */}
      <ToolRail />

      {/* Canvas Viewport */}
      <div className="flex-1 relative overflow-hidden">
        {currentPage ? (
          <CanvasViewport />
        ) : (
          <EmptyState />
        )}
      </div>

      {/* Zoom indicator */}
      <div className="absolute bottom-3 right-3 rounded bg-black/60 px-2 py-1 text-[10px] text-white">
        {scale}%
      </div>
    </div>
  )
}

function CanvasViewport() {
  const { scale } = useEditorStore()
  const scaleRatio = scale / 100

  return (
    <div className="flex h-full w-full items-center justify-center">
      <div
        style={{ transform: `scale(${scaleRatio})` }}
        className="relative transition-transform origin-center"
      >
        {/* Image Layer */}
        <div className="relative">
          <div className="w-[800px] h-[1200px] bg-muted rounded flex items-center justify-center">
            <span className="text-muted-foreground text-sm">Pagina carregada aqui</span>
          </div>

          {/* Text Block Overlay Layer (DOM-based, not canvas) */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Text blocks will be rendered as positioned divs */}
          </div>

          {/* Brush Canvas Overlay (only for inpaint brush tool) */}
          <canvas
            className="absolute inset-0 pointer-events-none opacity-50"
            style={{ display: 'none' }}
          />
        </div>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground gap-4">
      <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
        <span className="text-3xl">+</span>
      </div>
      <div>
        <p className="text-sm font-medium">Nenhuma pagina aberta</p>
        <p className="text-xs mt-1">Arraste imagens ou abra um manga da biblioteca</p>
      </div>
    </div>
  )
}
