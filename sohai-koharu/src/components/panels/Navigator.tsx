import { useEditorStore } from '@/stores/editorStore'

export function Navigator() {
  const { pages, currentPageIndex, setCurrentPageIndex, setCurrentImageUrl } = useEditorStore()

  const handlePageSelect = (index: number) => {
    setCurrentPageIndex(index)

    // Load the image from the dropped files cache
    const files = (window as any).__droppedFiles as File[] | undefined
    if (files && files[index]) {
      const url = URL.createObjectURL(files[index])
      setCurrentImageUrl(url)
    }
  }

  return (
    <div className="flex h-full flex-col bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-3 py-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Paginas
        </span>
        <span className="text-[10px] text-muted-foreground">
          {pages.length > 0 ? `${currentPageIndex + 1}/${pages.length}` : '0'}
        </span>
      </div>

      {/* Page thumbnails list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {pages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <p className="text-xs">Nenhuma pagina</p>
            <p className="text-[10px] mt-1 opacity-60">Arraste imagens para importar</p>
          </div>
        ) : (
          pages.map((page, index) => (
            <button
              key={page.id}
              onClick={() => handlePageSelect(index)}
              className={`w-full rounded-md border p-1 text-left transition-all ${
                index === currentPageIndex
                  ? 'border-primary bg-primary/10 ring-1 ring-primary/30'
                  : 'border-transparent hover:bg-accent hover:border-accent'
              }`}
            >
              {/* Thumbnail */}
              <div className="aspect-[3/4] w-full rounded bg-muted overflow-hidden mb-1">
                {page.thumbnailUrl ? (
                  <img
                    src={page.thumbnailUrl}
                    alt={page.filename}
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <span className="text-lg text-muted-foreground">{index + 1}</span>
                  </div>
                )}
              </div>
              {/* Page info */}
              <div className="flex items-center justify-between px-0.5">
                <span className="text-[10px] truncate flex-1 text-muted-foreground">
                  {page.filename}
                </span>
                <StatusDot status={page.status} />
              </div>
            </button>
          ))
        )}
      </div>

      {/* Actions */}
      {pages.length > 0 && (
        <div className="border-t p-2 space-y-1">
          <button className="w-full rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
            ▶ Traduzir Todas
          </button>
          <div className="flex gap-1">
            <button
              onClick={() => handlePageSelect(Math.max(0, currentPageIndex - 1))}
              disabled={currentPageIndex === 0}
              className="flex-1 rounded border px-2 py-1 text-[10px] hover:bg-accent disabled:opacity-30 transition-colors"
            >
              ← Anterior
            </button>
            <button
              onClick={() => handlePageSelect(Math.min(pages.length - 1, currentPageIndex + 1))}
              disabled={currentPageIndex >= pages.length - 1}
              className="flex-1 rounded border px-2 py-1 text-[10px] hover:bg-accent disabled:opacity-30 transition-colors"
            >
              Proxima →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    idle: 'bg-gray-400',
    detecting: 'bg-yellow-500 animate-pulse',
    ocr: 'bg-blue-500 animate-pulse',
    translating: 'bg-purple-500 animate-pulse',
    inpainting: 'bg-orange-500 animate-pulse',
    done: 'bg-green-500',
    error: 'bg-red-500',
  }
  return <span className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${colors[status] || colors.idle}`} />
}
