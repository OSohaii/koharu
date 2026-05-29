import { useEditorStore } from '@/stores/editorStore'
import { useTextBlocksStore } from '@/stores/textBlocksStore'
import { usePipeline } from '@/hooks/usePipeline'

export function Navigator() {
  const { pages, currentPageIndex, setCurrentPageIndex, setCurrentImageUrl } = useEditorStore()
  const { runPipelineAll, isRunning } = usePipeline()

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
        <PipelineSummary />
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
            <PageThumbnail
              key={page.id}
              page={page}
              index={index}
              isActive={index === currentPageIndex}
              onSelect={() => handlePageSelect(index)}
            />
          ))
        )}
      </div>

      {/* Actions */}
      {pages.length > 0 && (
        <div className="border-t p-2 space-y-1">
          <button
            onClick={runPipelineAll}
            disabled={isRunning}
            className="w-full rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRunning ? '⏳ Processando...' : '▶ Traduzir Todas'}
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

function PipelineSummary() {
  const { pages } = useEditorStore()
  const pipelineByPage = useTextBlocksStore((s) => s.pipelineByPage)

  if (pages.length === 0) return <span className="text-[10px] text-muted-foreground">0</span>

  const doneCount = pages.filter((p) => pipelineByPage[p.id]?.step === 'done').length

  return (
    <span className="text-[10px] text-muted-foreground">
      {doneCount > 0 && <span className="text-green-400">{doneCount}✓</span>}
      {doneCount > 0 && ' / '}
      {pages.length}
    </span>
  )
}

interface PageThumbnailProps {
  page: { id: string; filename: string; thumbnailUrl?: string; status: string }
  index: number
  isActive: boolean
  onSelect: () => void
}

function PageThumbnail({ page, index, isActive, onSelect }: PageThumbnailProps) {
  const pipeline = useTextBlocksStore((s) => s.pipelineByPage[page.id])
  const blocks = useTextBlocksStore((s) => s.blocksByPage[page.id] || [])

  // Use pipeline step if available, otherwise fall back to page.status
  const effectiveStatus = pipeline?.step && pipeline.step !== 'idle'
    ? pipeline.step
    : page.status

  const translatedCount = blocks.filter((b) => b.translatedText).length

  return (
    <button
      onClick={onSelect}
      className={`w-full rounded-md border p-1 text-left transition-all ${
        isActive
          ? 'border-primary bg-primary/10 ring-1 ring-primary/30'
          : 'border-transparent hover:bg-accent hover:border-accent'
      }`}
    >
      {/* Thumbnail */}
      <div className="aspect-[3/4] w-full rounded bg-muted overflow-hidden mb-1 relative">
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

        {/* Block count badge */}
        {blocks.length > 0 && (
          <div className="absolute top-0.5 right-0.5 bg-black/70 text-white text-[8px] px-1 rounded">
            {translatedCount}/{blocks.length}
          </div>
        )}
      </div>

      {/* Page info */}
      <div className="flex items-center justify-between px-0.5">
        <span className="text-[10px] truncate flex-1 text-muted-foreground">
          {page.filename}
        </span>
        <StatusDot status={effectiveStatus} />
      </div>
    </button>
  )
}

function StatusDot({ status }: { status: string }) {
  const config: Record<string, { color: string; title: string }> = {
    idle: { color: 'bg-gray-400', title: 'Aguardando' },
    detecting: { color: 'bg-yellow-500 animate-pulse', title: 'Detectando...' },
    ocr: { color: 'bg-blue-500 animate-pulse', title: 'OCR...' },
    translating: { color: 'bg-purple-500 animate-pulse', title: 'Traduzindo...' },
    inpainting: { color: 'bg-orange-500 animate-pulse', title: 'Inpainting...' },
    done: { color: 'bg-green-500', title: 'Concluido' },
    error: { color: 'bg-red-500', title: 'Erro' },
  }

  const { color, title } = config[status] || config.idle

  return (
    <span
      className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${color}`}
      title={title}
    />
  )
}
