use tauri::Manager;

mod commands;
mod database;
mod sidecar;

pub fn run() {
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "sohai_koharu=info".into()),
        )
        .init();

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            // Initialize database
            let app_data_dir = app.path().app_data_dir().expect("failed to get app data dir");
            std::fs::create_dir_all(&app_data_dir).ok();
            database::init_db(&app_data_dir)?;

            // Start Python sidecar
            let sidecar_handle = sidecar::start_sidecar(&app_data_dir);
            app.manage(sidecar_handle);

            tracing::info!("SohaiKoharu initialized successfully");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::library::import_manga,
            commands::library::list_mangas,
            commands::library::delete_manga,
            commands::library::get_manga_pages,
            commands::pipeline::run_detection,
            commands::pipeline::run_ocr,
            commands::pipeline::run_translation,
            commands::pipeline::run_inpaint,
            commands::pipeline::run_full_pipeline,
            commands::sidecar::get_sidecar_status,
            commands::sidecar::restart_sidecar,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
