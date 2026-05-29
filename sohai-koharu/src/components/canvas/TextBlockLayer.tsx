import { useEditorStore } from '@/stores/editorStore'

interface TextBlock {
  id: string
  x: number
  y: number
  width: number
  height: number
  originalText?: string
  translatedText?: string
  isSelected?: boolean
}

interface TextBlockLayerProps {
  blocks: TextBlock[]
  onSelectBlock?: (id: string) => void
}

/**
 * DOM-based text block overlay rendered on top of the manga page.
 * Each block is a positioned div with editable translated text.
 * 
 * This approach (vs Canvas) allows:
 * - Editable text fields
 * - CSS styling for fonts
 * - DevTools inspection
 * - Accessibility
 */
export function TextBlockLayer({ blocks, onSelectBlock }: TextBlockLayerProps) {
  const { showTextBlocks, canvasMode } = useEditorStore()

  if (!showTextBlocks) return null

  return (
    <div className="absolute inset-0 pointer-events-none">
      {blocks.map((block) => (
        <div
          key={block.id}
          onClick={() => {
            if (canvasMode === 'select') onSelectBlock?.(block.id)
          }}
          className={`absolute border transition-all cursor-pointer pointer-events-auto ${
            block.isSelected
              ? 'border-primary bg-primary/10 shadow-sm'
              : 'border-blue-400/50 hover:border-blue-400 bg-blue-400/5'
          }`}
          style={{
            left: `${block.x}px`,
            top: `${block.y}px`,
            width: `${block.width}px`,
            height: `${block.height}px`,
          }}
        >
          {/* Translated text overlay */}
          {block.translatedText && (
            <div className="absolute inset-0 flex items-center justify-center p-1 text-center">
              <span className="text-[10px] text-white font-bold drop-shadow-md leading-tight">
                {block.translatedText}
              </span>
            </div>
          )}

          {/* Block index badge */}
          <div className="absolute -top-3 -left-1 bg-primary text-primary-foreground text-[8px] px-1 rounded">
            {block.id.slice(0, 4)}
          </div>
        </div>
      ))}
    </div>
  )
}
