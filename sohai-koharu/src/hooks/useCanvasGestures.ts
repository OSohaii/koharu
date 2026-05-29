import { useRef, useCallback } from 'react'
import { useGesture } from '@use-gesture/react'
import { useEditorStore } from '@/stores/editorStore'

/**
 * Canvas zoom/pan gestures using @use-gesture/react.
 * 
 * - Ctrl/Cmd + Scroll: Zoom in/out (towards cursor)
 * - Middle mouse drag OR Space+drag: Pan
 * - Pinch (trackpad): Zoom
 * - Double-click: Reset to 100%
 * 
 * Inspired by Koharu's Workspace.tsx gesture system.
 */
export function useCanvasGestures() {
  const { scale, setScale, panX, panY, setPan, resetView, canvasMode } = useEditorStore()
  const spacePressed = useRef(false)
  const isPanning = useRef(false)
  const lastPan = useRef({ x: panX, y: panY })

  // Keep lastPan in sync with store
  lastPan.current = { x: panX, y: panY }

  const bind = useGesture(
    {
      onWheel: ({ event, delta: [, dy], ctrlKey, metaKey }) => {
        event.preventDefault()

        if (ctrlKey || metaKey) {
          // Zoom towards cursor
          const zoomFactor = dy > 0 ? 0.92 : 1.08
          const newScale = Math.round(scale * zoomFactor)
          setScale(newScale)
        } else {
          // Pan with scroll wheel
          setPan(panX - (event as WheelEvent).deltaX, panY - dy)
        }
      },
      onPinch: ({ offset: [d], event }) => {
        event?.preventDefault()
        const newScale = Math.round(d * 100)
        setScale(newScale)
      },
      onDrag: ({ delta: [dx, dy], buttons, event, first, memo }) => {
        // Middle mouse (button 1) or space+left click = pan
        const isMiddleMouse = buttons === 4
        const isSpaceDrag = spacePressed.current && buttons === 1
        const isSelectModePan = canvasMode === 'select' && buttons === 1 && !spacePressed.current

        if (first) {
          isPanning.current = isMiddleMouse || isSpaceDrag
        }

        if (isPanning.current || isMiddleMouse || isSpaceDrag) {
          event.preventDefault()
          setPan(panX + dx, panY + dy)
          return 'panning'
        }

        return memo
      },
      onDoubleClick: () => {
        resetView()
      },
    },
    {
      wheel: { eventOptions: { passive: false } },
      pinch: {
        scaleBounds: { min: 0.1, max: 5 },
        from: () => [scale / 100, 0],
      },
      drag: {
        filterTaps: true,
      },
    },
  )

  // Space key tracking for space+drag panning
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.code === 'Space' && !e.repeat) {
      spacePressed.current = true
    }
  }, [])

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (e.code === 'Space') {
      spacePressed.current = false
      isPanning.current = false
    }
  }, [])

  return { bind, handleKeyDown, handleKeyUp, isPanning: isPanning.current }
}
