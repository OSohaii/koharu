import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels'
import { MenuBar } from '@/components/layout/MenuBar'
import { Navigator } from '@/components/panels/Navigator'
import { Workspace } from '@/components/canvas/Workspace'
import { ControlsPanel } from '@/components/panels/ControlsPanel'
import { StatusBar } from '@/components/layout/StatusBar'
import { useEditorStore } from '@/stores/editorStore'

export function App() {
  const currentView = useEditorStore((s) => s.currentView)

  return (
    <div className="flex h-full flex-col">
      {/* Top Menu Bar */}
      <MenuBar />

      {/* Main Content */}
      {currentView === 'editor' ? <EditorView /> : <LibraryView />}

      {/* Status Bar */}
      <StatusBar />
    </div>
  )
}

function EditorView() {
  return (
    <PanelGroup direction="horizontal" id="sohai-koharu-shell-v1" className="flex-1">
      {/* Left: Navigator (thumbnails + pages) */}
      <Panel
        id="navigator"
        defaultSize={16}
        minSize={12}
        maxSize={28}
        collapsible
      >
        <Navigator />
      </Panel>

      <PanelResizeHandle className="w-1 bg-border hover:bg-primary/50 transition-colors" />

      {/* Center: Canvas Workspace */}
      <Panel id="workspace" minSize={35}>
        <Workspace />
      </Panel>

      <PanelResizeHandle className="w-1 bg-border hover:bg-primary/50 transition-colors" />

      {/* Right: Controls Panel */}
      <Panel
        id="controls"
        defaultSize={24}
        minSize={18}
        maxSize={38}
        collapsible
      >
        <ControlsPanel />
      </Panel>
    </PanelGroup>
  )
}

function LibraryView() {
  return (
    <div className="flex-1 flex items-center justify-center text-muted-foreground">
      <div className="text-center space-y-4">
        <div className="text-6xl">📚</div>
        <h2 className="text-2xl font-bold">Biblioteca</h2>
        <p className="text-sm">Arraste e solte mangás aqui para importar</p>
        <p className="text-xs text-muted-foreground">
          Suporta .cbz, .zip, .pdf e pastas de imagens
        </p>
      </div>
    </div>
  )
}
