import { useEffect } from 'react'
import { useEditorStore } from '@/stores/editorStore'

/**
 * Global keyboard shortcuts for the editor.
 * Inspired by Koharu's hotkey system.
 */
export function useKeyboardShortcuts() {
  const { setCanvasMode, toggleNavigator, toggleControls, setCurrentView, setScale, scale } =
    useEditorStore()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Skip if user is typing in an input
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        return
      }

      const ctrl = e.ctrlKey || e.metaKey
      const key = e.key.toLowerCase()

      // Canvas tools (single key, no modifiers)
      if (!ctrl && !e.altKey && !e.shiftKey) {
        switch (key) {
          case 'v': setCanvasMode('select'); return
          case 'm': setCanvasMode('block'); return
          case 'b': setCanvasMode('brush'); return
          case 'e': setCanvasMode('eraser'); return
        }
      }

      // Ctrl shortcuts
      if (ctrl) {
        switch (key) {
          case 'b':
            e.preventDefault()
            toggleNavigator()
            return
          case 'j':
            e.preventDefault()
            toggleControls()
            return
          case '=':
          case '+':
            e.preventDefault()
            setScale(scale + 10)
            return
          case '-':
            e.preventDefault()
            setScale(scale - 10)
            return
          case '0':
            e.preventDefault()
            setScale(100)
            return
          case 'l':
            e.preventDefault()
            setCurrentView('library')
            return
        }
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [setCanvasMode, toggleNavigator, toggleControls, setCurrentView, setScale, scale])
}
