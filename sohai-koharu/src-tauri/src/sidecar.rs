use std::path::Path;
use std::process::{Child, Command};
use std::sync::Mutex;

/// Handle to the running Python sidecar process.
pub struct SidecarHandle {
    process: Mutex<Option<Child>>,
    port: u16,
}

impl SidecarHandle {
    pub fn port(&self) -> u16 {
        self.port
    }

    pub fn is_running(&self) -> bool {
        if let Ok(mut guard) = self.process.lock() {
            if let Some(ref mut child) = *guard {
                return child.try_wait().ok().flatten().is_none();
            }
        }
        false
    }

    pub fn stop(&self) {
        if let Ok(mut guard) = self.process.lock() {
            if let Some(ref mut child) = *guard {
                let _ = child.kill();
                let _ = child.wait();
            }
            *guard = None;
        }
    }

    pub fn restart(&self, app_data_dir: &Path) -> bool {
        self.stop();

        let sidecar_dir = find_sidecar_dir(app_data_dir);
        if let Some(child) = spawn_python_sidecar(&sidecar_dir, self.port) {
            *self.process.lock().unwrap() = Some(child);
            true
        } else {
            false
        }
    }
}

/// Start the Python AI sidecar process.
pub fn start_sidecar(app_data_dir: &Path) -> SidecarHandle {
    let port: u16 = 8765;
    let sidecar_dir = find_sidecar_dir(app_data_dir);

    let process = spawn_python_sidecar(&sidecar_dir, port);

    if process.is_some() {
        tracing::info!("Python sidecar started on port {}", port);
    } else {
        tracing::warn!("Failed to start Python sidecar - AI features will be unavailable");
    }

    SidecarHandle {
        process: Mutex::new(process),
        port,
    }
}

fn find_sidecar_dir(app_data_dir: &Path) -> std::path::PathBuf {
    // In dev mode, the sidecar is in the project root
    let dev_path = std::env::current_dir()
        .unwrap_or_default()
        .join("../sidecar");
    if dev_path.join("main.py").exists() {
        return dev_path;
    }

    // In production, bundled alongside the app
    let resource_path = app_data_dir.join("sidecar");
    if resource_path.join("main.py").exists() {
        return resource_path;
    }

    // Fallback to relative path
    std::path::PathBuf::from("sidecar")
}

fn spawn_python_sidecar(sidecar_dir: &Path, port: u16) -> Option<Child> {
    let main_py = sidecar_dir.join("main.py");
    if !main_py.exists() {
        tracing::error!("Sidecar main.py not found at {:?}", main_py);
        return None;
    }

    // Try python3 first, then python
    let python = if cfg!(target_os = "windows") {
        "python"
    } else {
        "python3"
    };

    Command::new(python)
        .arg(&main_py)
        .env("SIDECAR_PORT", port.to_string())
        .current_dir(sidecar_dir)
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .spawn()
        .ok()
}
