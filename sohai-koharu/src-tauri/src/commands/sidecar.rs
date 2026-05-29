use serde::Serialize;
use tauri::State;

use crate::sidecar::SidecarHandle;

#[derive(Debug, Serialize)]
pub struct SidecarStatus {
    pub running: bool,
    pub port: u16,
    pub health_url: String,
}

/// Get the current status of the Python AI sidecar.
#[tauri::command]
pub async fn get_sidecar_status(sidecar: State<'_, SidecarHandle>) -> Result<SidecarStatus, String> {
    Ok(SidecarStatus {
        running: sidecar.is_running(),
        port: sidecar.port(),
        health_url: format!("http://127.0.0.1:{}/api/health", sidecar.port()),
    })
}

/// Restart the Python AI sidecar.
#[tauri::command]
pub async fn restart_sidecar(
    sidecar: State<'_, SidecarHandle>,
    app: tauri::AppHandle,
) -> Result<SidecarStatus, String> {
    let app_data_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let success = sidecar.restart(&app_data_dir);

    if !success {
        return Err("Failed to restart sidecar".to_string());
    }

    // Wait a moment for the server to start
    tokio::time::sleep(tokio::time::Duration::from_secs(2)).await;

    Ok(SidecarStatus {
        running: sidecar.is_running(),
        port: sidecar.port(),
        health_url: format!("http://127.0.0.1:{}/api/health", sidecar.port()),
    })
}
