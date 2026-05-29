import { useLibraryStore, type MangaEntry } from '@/stores/libraryStore'
import { useEditorStore } from '@/stores/editorStore'

export function LibraryGrid() {
  const { mangas, searchQuery, sortBy } = useLibraryStore()
  const { setCurrentView } = useEditorStore()

  const filtered = mangas
    .filter((m) =>
      m.title.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title)
        case 'lastOpened':
          return (b.lastOpened ?? 0) - (a.lastOpened ?? 0)
        case 'createdAt':
          return b.createdAt - a.createdAt
      }
    })

  if (filtered.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center space-y-4 text-muted-foreground">
          <div className="text-6xl">📚</div>
          <h2 className="text-xl font-semibold">Biblioteca vazia</h2>
          <p className="text-sm">Arraste e solte arquivos .cbz, .zip ou pastas para importar</p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4 p-4">
      {filtered.map((manga) => (
        <MangaCard
          key={manga.id}
          manga={manga}
          onOpen={() => {
            // TODO: Load manga pages into editor
            setCurrentView('editor')
          }}
        />
      ))}
    </div>
  )
}

function MangaCard({ manga, onOpen }: { manga: MangaEntry; onOpen: () => void }) {
  const progress = manga.totalPages > 0
    ? Math.round((manga.translatedPages / manga.totalPages) * 100)
    : 0

  return (
    <button
      onClick={onOpen}
      className="group flex flex-col rounded-lg border bg-card overflow-hidden hover:border-primary transition-colors text-left"
    >
      {/* Cover */}
      <div className="aspect-[3/4] bg-muted relative overflow-hidden">
        {manga.coverUrl ? (
          <img
            src={manga.coverUrl}
            alt={manga.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-3xl text-muted-foreground">
            📖
          </div>
        )}

        {/* Progress overlay */}
        {progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-2 space-y-0.5">
        <h3 className="text-xs font-medium truncate">{manga.title}</h3>
        <p className="text-[10px] text-muted-foreground">
          {manga.translatedPages}/{manga.totalPages} paginas
        </p>
      </div>
    </button>
  )
}
