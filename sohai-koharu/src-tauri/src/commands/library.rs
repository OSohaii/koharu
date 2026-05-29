use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::database::with_db;

#[derive(Debug, Serialize, Deserialize)]
pub struct MangaInfo {
    pub id: String,
    pub title: String,
    pub author: Option<String>,
    pub cover_path: Option<String>,
    pub tags: Vec<String>,
    pub total_pages: i32,
    pub translated_pages: i32,
    pub file_path: String,
    pub last_opened: Option<i64>,
    pub created_at: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PageInfo {
    pub id: String,
    pub page_number: i32,
    pub filename: String,
    pub image_path: String,
    pub thumbnail_path: Option<String>,
    pub status: String,
}

/// Import a manga from a file path (zip, cbz, pdf, or folder).
#[tauri::command]
pub async fn import_manga(path: String, title: Option<String>) -> Result<MangaInfo, String> {
    let id = Uuid::new_v4().to_string();
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs() as i64;

    let manga_title = title.unwrap_or_else(|| {
        std::path::Path::new(&path)
            .file_stem()
            .unwrap_or_default()
            .to_string_lossy()
            .to_string()
    });

    // TODO: Extract archive, generate thumbnails, count pages
    let total_pages = 0;

    with_db(|conn| {
        conn.execute(
            "INSERT INTO mangas (id, title, file_path, total_pages, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5)",
            (&id, &manga_title, &path, &total_pages, &now),
        )?;
        Ok(())
    })?;

    Ok(MangaInfo {
        id,
        title: manga_title,
        author: None,
        cover_path: None,
        tags: vec![],
        total_pages,
        translated_pages: 0,
        file_path: path,
        last_opened: None,
        created_at: now,
    })
}

/// List all mangas in the library.
#[tauri::command]
pub async fn list_mangas() -> Result<Vec<MangaInfo>, String> {
    with_db(|conn| {
        let mut stmt = conn.prepare(
            "SELECT id, title, author, cover_path, tags, total_pages, 
                    translated_pages, file_path, last_opened, created_at
             FROM mangas ORDER BY last_opened DESC NULLS LAST, created_at DESC",
        )?;

        let mangas = stmt
            .query_map([], |row| {
                let tags_str: String = row.get(4)?;
                let tags: Vec<String> =
                    serde_json::from_str(&tags_str).unwrap_or_default();

                Ok(MangaInfo {
                    id: row.get(0)?,
                    title: row.get(1)?,
                    author: row.get(2)?,
                    cover_path: row.get(3)?,
                    tags,
                    total_pages: row.get(5)?,
                    translated_pages: row.get(6)?,
                    file_path: row.get(7)?,
                    last_opened: row.get(8)?,
                    created_at: row.get(9)?,
                })
            })?
            .collect::<Result<Vec<_>, _>>()?;

        Ok(mangas)
    })
}

/// Delete a manga from the library.
#[tauri::command]
pub async fn delete_manga(id: String) -> Result<(), String> {
    with_db(|conn| {
        conn.execute("DELETE FROM mangas WHERE id = ?1", [&id])?;
        Ok(())
    })
}

/// Get all pages for a manga.
#[tauri::command]
pub async fn get_manga_pages(manga_id: String) -> Result<Vec<PageInfo>, String> {
    with_db(|conn| {
        let mut stmt = conn.prepare(
            "SELECT id, page_number, filename, image_path, thumbnail_path, status
             FROM pages WHERE manga_id = ?1 ORDER BY page_number",
        )?;

        let pages = stmt
            .query_map([&manga_id], |row| {
                Ok(PageInfo {
                    id: row.get(0)?,
                    page_number: row.get(1)?,
                    filename: row.get(2)?,
                    image_path: row.get(3)?,
                    thumbnail_path: row.get(4)?,
                    status: row.get(5)?,
                })
            })?
            .collect::<Result<Vec<_>, _>>()?;

        Ok(pages)
    })
}
