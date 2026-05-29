import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels'
import { MenuBar } from '@/components/layout/MenuBar'
import { Navigator } from '@/components/panels/Navigator'
import { Workspace } from '@/components/canvas/Workspace'
import { ControlsPanel } from '@/components/panels/ControlsPanel'
import { StatusBar } from '@/components/layout/StatusBar'
import { DropZone } from '@/components/library/DropZone'
import { LibraryHeader } from '@/components/library/LibraryHeader'
import { LibraryGrid } from '@/components/library/LibraryGrid'
import { useEditorStore } from '@/stores/editorStore'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'

export function App() {
  const currentView = useEditorStore((s) => s.currentView)
  useKeyboardShortcuts()

  return (
    <DropZone>
      <div className="flex h-full flex-col">
        {/* Top Menu Bar */}
        <MenuBar />

        {/* Main Content */}
        {currentView === 'editor' ? <EditorView /> : <LibraryView />}

        {/* Status Bar */}
        <StatusBar />
      </div>
    </DropZone>
  )
}

function EditorView() {
  const { showNavigator, showControls } = useEditorStore()

  return (
    <PanelGroup direction="horizontal" id="sohai-koharu-shell-v1" className="flex-1">
      {/* Left: Navigator (thumbnails + pages) */}
      {showNavigator && (
        <>
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
        </>
      )}

      {/* Center: Canvas Workspace */}
      <Panel id="workspace" minSize={35}>
        <Workspace />
      </Panel>

      {/* Right: Controls Panel */}
      {showControls && (
        <>
          <PanelResizeHandle className="w-1 bg-border hover:bg-primary/50 transition-colors" />
          <Panel
            id="controls"
            defaultSize={24}
            minSize={18}
            maxSize={38}
            collapsible
          >
            <ControlsPanel />
          </Panel>
        </>
      )}
    </PanelGroup>
  )
}

function LibraryView() {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <LibraryHeader />
      <LibraryGrid />
    </div>
  )
}
