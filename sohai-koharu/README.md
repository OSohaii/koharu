# SohaiKoharu - MangaLens 2.0

ML-powered manga translator with local AI pipeline. Inspired by [Koharu](https://github.com/mayocream/koharu).

## Architecture

```
SohaiKoharu/
├── src/                    # React frontend (Vite)
│   ├── components/
│   │   ├── canvas/         # Workspace, TextBlockLayer, ToolRail, BrushCanvas
│   │   ├── panels/         # Navigator, ControlsPanel
│   │   ├── library/        # LibraryGrid, LibraryHeader
│   │   ├── layout/         # MenuBar, StatusBar
│   │   └── ui/             # Button, etc.
│   ├── hooks/              # useKeyboardShortcuts, useCanvasGestures
│   ├── stores/             # Zustand (editorStore, aiStore, libraryStore)
│   └── lib/                # sidecar client, tauri IPC, utils
├── src-tauri/              # Rust backend (Tauri 2)
│   └── src/
│       ├── commands/       # library, pipeline, sidecar IPC
│       ├── database.rs     # SQLite schema & queries
│       └── sidecar.rs      # Python process management
├── sidecar/                # Python AI server (FastAPI)
│   ├── detection/          # YOLO text detection
│   ├── ocr/                # Manga-OCR / PaddleOCR
│   ├── inpaint/            # LaMa inpainting
│   ├── translate/          # Local LLM + external APIs
│   └── models/             # Model registry & download
└── index.html
```

## Stack

| Layer | Technology |
|-------|-----------|
| Desktop Shell | Tauri 2 (Rust) |
| Frontend | React 19 + Vite + Tailwind CSS |
| State Management | Zustand |
| Layout | react-resizable-panels |
| Canvas Gestures | @use-gesture/react |
| AI Backend | Python FastAPI (sidecar) |
| Detection | YOLO (ultralytics) |
| OCR | Manga-OCR / PaddleOCR |
| Inpainting | LaMa / AOT |
| Translation | llama-cpp-python / Gemini / OpenAI / DeepL |
| Database | SQLite (rusqlite) |

## Features (Planned)

- **Manga Library**: Import .cbz/.zip/.pdf, manage collections, track translation progress
- **Editor**: DOM-based canvas with zoom/pan, text block overlay, layer management
- **AI Pipeline**: Detection -> OCR -> Translation -> Inpainting (fully automated)
- **Local AI**: Run models offline (YOLO, Manga-OCR, LaMa, local LLMs via llama.cpp)
- **Cloud APIs**: Gemini, OpenAI, DeepL, DeepSeek as translation backends
- **Brush Tool**: Canvas 2D overlay for manual inpainting masks

## Development

### Prerequisites

- [Rust](https://www.rust-lang.org/tools/install) 1.75+
- [Node.js](https://nodejs.org/) 20+
- [Python](https://www.python.org/) 3.11+
- [Tauri CLI](https://v2.tauri.app/start/prerequisites/)

### Setup

```bash
# Install frontend dependencies
npm install

# Install Python sidecar dependencies
cd sidecar
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\Activate.ps1 on Windows
pip install -r requirements.txt
cd ..

# Run in development mode
npm run tauri dev
```

### Running the sidecar independently (for testing)

```bash
cd sidecar
uvicorn main:app --reload --port 8765
```

API docs at http://localhost:8765/docs

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| V | Select tool |
| M | Block tool |
| B | Brush tool |
| E | Eraser tool |
| Ctrl+B | Toggle Navigator |
| Ctrl+J | Toggle Controls |
| Ctrl+= | Zoom in |
| Ctrl+- | Zoom out |
| Ctrl+0 | Reset zoom |
| Ctrl+L | Open Library |

## License

GPL-3.0
