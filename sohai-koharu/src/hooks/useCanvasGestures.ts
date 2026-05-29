import { useCallback } from 'react'
import { useEditorStore } from '@/stores/editorStore'

/**
 * Canvas zoom/pan gestures using @use-gesture/react.
 * DOM-based approach inspired by Koharu's Workspace.tsx.
 * 
 * Usage: attach bind() to the viewport container div.
 */
export function useCanvasGestures() {
  const { scale, setScale } = useEditorStore()

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        const delta = e.deltaY > 0 ? -10 : 10
        setScale(scale + delta)
      }
    },
    [scale, setScale],
  )

  return { handleWheel }
}
