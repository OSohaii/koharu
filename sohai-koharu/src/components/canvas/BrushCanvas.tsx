import { useRef, useEffect, useCallback } from 'react'
import { useEditorStore } from '@/stores/editorStore'

interface BrushCanvasProps {
  width: number
  height: number
}

/**
 * Canvas 2D overlay for brush/eraser tools (inpainting mask).
 * Only active when canvasMode is 'brush' or 'eraser'.
 * 
 * This is the ONE place we use <canvas> — for freehand drawing
 * that needs pixel-level precision.
 */
export function BrushCanvas({ width, height }: BrushCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawing = useRef(false)
  const { canvasMode } = useEditorStore()

  const isActive = canvasMode === 'brush' || canvasMode === 'eraser'

  const getCtx = useCallback(() => {
    return canvasRef.current?.getContext('2d') ?? null
  }, [])

  useEffect(() => {
    const ctx = getCtx()
    if (!ctx) return
    // Clear canvas when mode changes
    ctx.clearRect(0, 0, width, height)
  }, [canvasMode, width, height, getCtx])

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isActive) return
    isDrawing.current = true
    const ctx = getCtx()
    if (!ctx) return

    ctx.beginPath()
    ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY)

    if (canvasMode === 'brush') {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)'
      ctx.globalCompositeOperation = 'source-over'
    } else {
      ctx.globalCompositeOperation = 'destination-out'
    }
    ctx.lineWidth = 20
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDrawing.current || !isActive) return
    const ctx = getCtx()
    if (!ctx) return

    ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY)
    ctx.stroke()
  }

  const handlePointerUp = () => {
    isDrawing.current = false
  }

  if (!isActive) return null

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute inset-0 cursor-crosshair"
      style={{ opacity: 0.6 }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    />
  )
}
