import { useLibraryStore } from '@/stores/libraryStore'

export function LibraryHeader() {
  const { searchQuery, setSearchQuery, sortBy, setSortBy, mangas } = useLibraryStore()

  return (
    <div className="flex items-center gap-3 border-b px-4 py-2">
      {/* Search */}
      <div className="flex-1 relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar manga..."
          className="w-full rounded-md border bg-background px-3 py-1.5 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      {/* Sort */}
      <select
        value={sortBy}
        onChange={(e) => setSortBy(e.target.value as 'title' | 'lastOpened' | 'createdAt')}
        className="rounded-md border bg-background px-2 py-1.5 text-xs"
      >
        <option value="lastOpened">Recentes</option>
        <option value="title">A-Z</option>
        <option value="createdAt">Data de importacao</option>
      </select>

      {/* Count */}
      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
        {mangas.length} manga{mangas.length !== 1 ? 's' : ''}
      </span>
    </div>
  )
}
