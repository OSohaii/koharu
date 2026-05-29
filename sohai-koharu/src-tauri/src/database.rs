use rusqlite::{Connection, Result as SqlResult};
use std::path::Path;
use std::sync::Mutex;

/// Global database connection (wrapped for thread-safety)
pub static DB: once_cell::sync::Lazy<Mutex<Option<Connection>>> =
    once_cell::sync::Lazy::new(|| Mutex::new(None));

/// Initialize the SQLite database with required tables.
pub fn init_db(app_data_dir: &Path) -> Result<(), Box<dyn std::error::Error>> {
    let db_path = app_data_dir.join("sohai-koharu.db");
    let conn = Connection::open(&db_path)?;

    conn.execute_batch(
        "
        -- Manga library
        CREATE TABLE IF NOT EXISTS mangas (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            author TEXT,
            cover_path TEXT,
            tags TEXT DEFAULT '[]',
            total_pages INTEGER DEFAULT 0,
            translated_pages INTEGER DEFAULT 0,
            file_path TEXT NOT NULL,
            last_opened INTEGER,
            created_at INTEGER NOT NULL
        );

        -- Individual pages within a manga
        CREATE TABLE IF NOT EXISTS pages (
            id TEXT PRIMARY KEY,
            manga_id TEXT NOT NULL REFERENCES mangas(id) ON DELETE CASCADE,
            page_number INTEGER NOT NULL,
            filename TEXT NOT NULL,
            image_path TEXT NOT NULL,
            thumbnail_path TEXT,
            status TEXT DEFAULT 'idle',
            UNIQUE(manga_id, page_number)
        );

        -- Detected text blocks on a page
        CREATE TABLE IF NOT EXISTS text_blocks (
            id TEXT PRIMARY KEY,
            page_id TEXT NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
            x REAL NOT NULL,
            y REAL NOT NULL,
            width REAL NOT NULL,
            height REAL NOT NULL,
            label TEXT DEFAULT 'text',
            confidence REAL DEFAULT 0.0,
            original_text TEXT,
            translated_text TEXT,
            font_size REAL,
            font_family TEXT
        );

        -- Translation history / cache
        CREATE TABLE IF NOT EXISTS translation_cache (
            id TEXT PRIMARY KEY,
            original_text TEXT NOT NULL,
            translated_text TEXT NOT NULL,
            source_lang TEXT NOT NULL,
            target_lang TEXT NOT NULL,
            backend TEXT NOT NULL,
            model TEXT,
            created_at INTEGER NOT NULL,
            UNIQUE(original_text, source_lang, target_lang, backend)
        );

        -- Settings / preferences
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );

        -- Create indexes for common queries
        CREATE INDEX IF NOT EXISTS idx_pages_manga ON pages(manga_id);
        CREATE INDEX IF NOT EXISTS idx_text_blocks_page ON text_blocks(page_id);
        CREATE INDEX IF NOT EXISTS idx_cache_lookup ON translation_cache(original_text, source_lang, target_lang);
        ",
    )?;

    *DB.lock().unwrap() = Some(conn);
    tracing::info!("Database initialized at {:?}", db_path);
    Ok(())
}

/// Get a reference to the database connection.
pub fn with_db<F, R>(f: F) -> Result<R, String>
where
    F: FnOnce(&Connection) -> SqlResult<R>,
{
    let guard = DB.lock().map_err(|e| e.to_string())?;
    let conn = guard.as_ref().ok_or("Database not initialized")?;
    f(conn).map_err(|e| e.to_string())
}
