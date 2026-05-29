import { useEditorStore } from '@/stores/editorStore'
import { useAiStore } from '@/stores/aiStore'

export function StatusBar() {
  const { scale, pages, currentPageIndex, canvasMode } = useEditorStore()
  const { sidecarStatus, translationBackend } = useAiStore()

  const statusColor = {
    starting: 'bg-yellow-500',
    ready: 'bg-green-500',
    error: 'bg-red-500',
    stopped: 'bg-gray-500',
  }[sidecarStatus]

  return (
    <div className="flex h-6 items-center justify-between border-t bg-card px-3 text-[10px] text-muted-foreground select-none">
      {/* Left */}
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1">
          <span className={`inline-block w-1.5 h-1.5 rounded-full ${statusColor}`} />
          AI: {sidecarStatus}
        </span>
        <span>Backend: {translationBackend}</span>
        <span className="uppercase">{canvasMode}</span>
      </div>

      {/* Center */}
      <div className="flex items-center gap-3">
        {pages.length > 0 && (
          <span>
            Pag {currentPageIndex + 1} / {pages.length}
          </span>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        <span>Zoom: {scale}%</span>
        <span>v0.1.0-alpha</span>
      </div>
    </div>
  )
}
