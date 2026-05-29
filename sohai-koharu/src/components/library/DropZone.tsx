import { useState, useCallback, type DragEvent } from 'react'
import { useEditorStore } from '@/stores/editorStore'

/**
 * Drag & drop zone for importing manga files.
 * Accepts: .cbz, .zip, .pdf, image files, and folders.
 * 
 * In Tauri mode: delegates to Rust for extraction.
 * In browser dev mode: reads image files directly.
 */
export function DropZone({ children }: { children: React.ReactNode }) {
  const [isDragging, setIsDragging] = useState(false)
  const { setPages, setCurrentView, setCurrentImageUrl, setCurrentPageIndex } = useEditorStore()

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(async (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length === 0) return

    // Filter for image files
    const imageFiles = files.filter((f) =>
      f.type.startsWith('image/') ||
      /\.(png|jpg|jpeg|webp|gif|bmp|tiff)$/i.test(f.name)
    )

    // Check for archive files
    const archiveFiles = files.filter((f) =>
      /\.(zip|cbz|cbr|pdf)$/i.test(f.name)
    )

    if (archiveFiles.length > 0) {
      // In Tauri: call import_manga command
      // In browser dev: show unsupported message
      const isTauri = '__TAURI__' in window
      if (isTauri) {
        // TODO: Call tauri import_manga for each archive
        console.log('[DropZone] Archive import via Tauri:', archiveFiles.map(f => f.name))
      } else {
        console.warn('[DropZone] Archive import only available in Tauri desktop mode')
      }
    }

    if (imageFiles.length > 0) {
      // Sort by filename (natural sort for page ordering)
      imageFiles.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))

      // Create page entries from dropped images
      const pages = imageFiles.map((file, index) => ({
        id: `drop-${index}-${Date.now()}`,
        filename: file.name,
        thumbnailUrl: URL.createObjectURL(file),
        status: 'idle' as const,
      }))

      setPages(pages)
      setCurrentPageIndex(0)

      // Set first image as current
      const firstUrl = URL.createObjectURL(imageFiles[0])
      setCurrentImageUrl(firstUrl)

      // Switch to editor view
      setCurrentView('editor')

      // Store file references for later pipeline use
      ;(window as any).__droppedFiles = imageFiles
    }
  }, [setPages, setCurrentView, setCurrentImageUrl, setCurrentPageIndex])

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="relative h-full"
    >
      {children}

      {/* Drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-primary/10 backdrop-blur-sm border-2 border-dashed border-primary rounded-lg m-2">
          <div className="text-center space-y-2">
            <div className="text-4xl">📥</div>
            <p className="text-sm font-medium text-primary">Solte para importar</p>
            <p className="text-[10px] text-muted-foreground">
              Imagens, .cbz, .zip ou pastas
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
