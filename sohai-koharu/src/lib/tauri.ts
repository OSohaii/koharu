/**
 * Tauri IPC bridge - typed wrappers around invoke commands.
 * Falls back to no-op in browser (for dev without Tauri).
 */

// Check if running inside Tauri
const isTauri = typeof window !== 'undefined' && '__TAURI__' in window

async function invoke<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  if (!isTauri) {
    console.warn(`[tauri] Not in Tauri context, skipping: ${command}`)
    return undefined as unknown as T
  }
  const { invoke: tauriInvoke } = await import('@tauri-apps/api/core')
  return tauriInvoke<T>(command, args)
}

// Library commands
export interface MangaInfo {
  id: string
  title: string
  author: string | null
  cover_path: string | null
  tags: string[]
  total_pages: number
  translated_pages: number
  file_path: string
  last_opened: number | null
  created_at: number
}

export interface PageInfo {
  id: string
  page_number: number
  filename: string
  image_path: string
  thumbnail_path: string | null
  status: string
}

export async function importManga(path: string, title?: string): Promise<MangaInfo> {
  return invoke<MangaInfo>('import_manga', { path, title })
}

export async function listMangas(): Promise<MangaInfo[]> {
  return invoke<MangaInfo[]>('list_mangas')
}

export async function deleteManga(id: string): Promise<void> {
  return invoke<void>('delete_manga', { id })
}

export async function getMangaPages(mangaId: string): Promise<PageInfo[]> {
  return invoke<PageInfo[]>('get_manga_pages', { mangaId })
}

// Sidecar commands
export interface SidecarStatus {
  running: boolean
  port: number
  health_url: string
}

export async function getSidecarStatus(): Promise<SidecarStatus> {
  return invoke<SidecarStatus>('get_sidecar_status')
}

export async function restartSidecar(): Promise<SidecarStatus> {
  return invoke<SidecarStatus>('restart_sidecar')
}

// Pipeline commands
export async function runFullPipeline(imagePath: string) {
  return invoke('run_full_pipeline', { imagePath })
}
