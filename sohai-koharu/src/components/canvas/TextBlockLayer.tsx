import { useState, useCallback } from 'react'
import { useEditorStore } from '@/stores/editorStore'
import { useTextBlocksStore, type TextBlock } from '@/stores/textBlocksStore'

/**
 * DOM-based text block overlay rendered on top of the manga page.
 * Each block is a positioned div with editable translated text.
 * 
 * This approach (vs Canvas) allows:
 * - Editable text fields (double-click to edit)
 * - CSS styling for fonts
 * - DevTools inspection
 * - Accessibility
 * - Tooltip with original text on hover
 */
export function TextBlockLayer() {
  const { showTextBlocks, canvasMode, pages, currentPageIndex } = useEditorStore()
  const currentPage = pages[currentPageIndex]
  const blocks = useTextBlocksStore((s) => currentPage ? s.blocksByPage[currentPage.id] || [] : [])
  const { selectBlock, updateBlock, deselectAll } = useTextBlocksStore()

  if (!showTextBlocks || !currentPage || blocks.length === 0) return null

  return (
    <div
      className="absolute inset-0"
      onClick={(e) => {
        // Deselect when clicking on empty space
        if (e.target === e.currentTarget) {
          deselectAll(currentPage.id)
        }
      }}
    >
      {blocks.map((block, index) => (
        <TextBlockItem
          key={block.id}
          block={block}
          index={index}
          pageId={currentPage.id}
          canvasMode={canvasMode}
          onSelect={() => selectBlock(currentPage.id, block.id)}
          onUpdateText={(text) => updateBlock(currentPage.id, block.id, { translatedText: text })}
        />
      ))}
    </div>
  )
}

interface TextBlockItemProps {
  block: TextBlock
  index: number
  pageId: string
  canvasMode: string
  onSelect: () => void
  onUpdateText: (text: string) => void
}

function TextBlockItem({ block, index, pageId, canvasMode, onSelect, onUpdateText }: TextBlockItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(block.translatedText)
  const { updateBlock } = useTextBlocksStore()

  const handleDoubleClick = useCallback(() => {
    if (canvasMode === 'select') {
      setIsEditing(true)
      setEditValue(block.translatedText)
      updateBlock(pageId, block.id, { isEditing: true })
    }
  }, [canvasMode, block.translatedText, block.id, pageId, updateBlock])

  const handleBlur = useCallback(() => {
    setIsEditing(false)
    onUpdateText(editValue)
    updateBlock(pageId, block.id, { isEditing: false })
  }, [editValue, onUpdateText, pageId, block.id, updateBlock])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleBlur()
    }
    if (e.key === 'Escape') {
      setIsEditing(false)
      setEditValue(block.translatedText)
      updateBlock(pageId, block.id, { isEditing: false })
    }
  }, [handleBlur, block.translatedText, pageId, block.id, updateBlock])

  // Dynamic font size based on block height
  const fontSize = Math.max(8, Math.min(16, block.height / 4))

  return (
    <div
      onClick={(e) => {
        e.stopPropagation()
        if (canvasMode === 'select') onSelect()
      }}
      onDoubleClick={handleDoubleClick}
      title={block.originalText ? `Original: ${block.originalText}` : undefined}
      className={`absolute border transition-all pointer-events-auto ${
        block.isSelected
          ? 'border-primary bg-primary/15 shadow-md z-10'
          : block.translatedText
            ? 'border-green-400/60 hover:border-green-400 bg-black/70'
            : 'border-blue-400/50 hover:border-blue-400 bg-blue-400/5'
      } ${canvasMode === 'select' ? 'cursor-pointer' : 'cursor-default pointer-events-none'}`}
      style={{
        left: `${block.x}px`,
        top: `${block.y}px`,
        width: `${block.width}px`,
        height: `${block.height}px`,
      }}
    >
      {/* Editing mode */}
      {isEditing ? (
        <textarea
          autoFocus
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="absolute inset-0 w-full h-full bg-black/80 text-white p-1 resize-none outline-none border-2 border-primary rounded-sm"
          style={{ fontSize: `${fontSize}px`, lineHeight: 1.2 }}
        />
      ) : (
        <>
          {/* Translated text overlay */}
          {block.translatedText && (
            <div className="absolute inset-0 flex items-center justify-center p-1 text-center overflow-hidden">
              <span
                className="text-white font-bold leading-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]"
                style={{ fontSize: `${fontSize}px` }}
              >
                {block.translatedText}
              </span>
            </div>
          )}

          {/* Original text (shown if no translation yet) */}
          {!block.translatedText && block.originalText && (
            <div className="absolute inset-0 flex items-center justify-center p-1 text-center overflow-hidden">
              <span
                className="text-yellow-300/80 italic leading-tight"
                style={{ fontSize: `${Math.max(7, fontSize - 2)}px` }}
              >
                {block.originalText}
              </span>
            </div>
          )}
        </>
      )}

      {/* Block index badge */}
      <div className={`absolute -top-3 -left-0.5 text-[7px] px-1 rounded font-mono ${
        block.translatedText
          ? 'bg-green-600 text-white'
          : block.originalText
            ? 'bg-yellow-600 text-white'
            : 'bg-primary text-primary-foreground'
      }`}>
        {index + 1}
      </div>

      {/* Confidence badge */}
      {block.confidence > 0 && block.isSelected && (
        <div className="absolute -bottom-3 right-0 text-[7px] px-1 rounded bg-black/70 text-white">
          {Math.round(block.confidence * 100)}%
        </div>
      )}
    </div>
  )
}
