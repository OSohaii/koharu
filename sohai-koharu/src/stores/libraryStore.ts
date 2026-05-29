import { create } from 'zustand'

export interface MangaEntry {
  id: string
  title: string
  author?: string
  coverUrl?: string
  tags: string[]
  totalPages: number
  translatedPages: number
  lastOpened?: number
  createdAt: number
  filePath: string
}

export interface LibraryState {
  mangas: MangaEntry[]
  searchQuery: string
  sortBy: 'title' | 'lastOpened' | 'createdAt'
  filterTags: string[]

  setMangas: (mangas: MangaEntry[]) => void
  addManga: (manga: MangaEntry) => void
  removeManga: (id: string) => void
  setSearchQuery: (query: string) => void
  setSortBy: (sort: 'title' | 'lastOpened' | 'createdAt') => void
  setFilterTags: (tags: string[]) => void
}

export const useLibraryStore = create<LibraryState>((set) => ({
  mangas: [],
  searchQuery: '',
  sortBy: 'lastOpened',
  filterTags: [],

  setMangas: (mangas) => set({ mangas }),
  addManga: (manga) => set((s) => ({ mangas: [...s.mangas, manga] })),
  removeManga: (id) => set((s) => ({ mangas: s.mangas.filter((m) => m.id !== id) })),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSortBy: (sort) => set({ sortBy: sort }),
  setFilterTags: (tags) => set({ filterTags: tags }),
}))
