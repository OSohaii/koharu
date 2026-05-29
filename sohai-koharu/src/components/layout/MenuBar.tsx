import { useEditorStore } from '@/stores/editorStore'

export function MenuBar() {
  const { currentView, setCurrentView, toggleNavigator, toggleControls, showNavigator, showControls } = useEditorStore()

  return (
    <div className="flex h-8 items-center border-b bg-card px-2 text-xs select-none"
         data-tauri-drag-region>
      {/* Logo */}
      <div className="flex items-center gap-2 mr-4">
        <span className="text-sm font-bold text-primary">SK</span>
        <span className="text-muted-foreground">SohaiKoharu</span>
      </div>

      {/* Menu Items */}
      <nav className="flex gap-1">
        <MenuButton label="Arquivo" />
        <MenuButton label="Editar" />
        <MenuButton
          label="Ver"
          items={[
            { label: currentView === 'editor' ? 'Biblioteca' : 'Editor', action: () => setCurrentView(currentView === 'editor' ? 'library' : 'editor') },
            { label: `${showNavigator ? 'Ocultar' : 'Mostrar'} Navegador`, action: toggleNavigator, shortcut: 'Ctrl+B' },
            { label: `${showControls ? 'Ocultar' : 'Mostrar'} Controles`, action: toggleControls, shortcut: 'Ctrl+J' },
          ]}
        />
        <MenuButton label="Pipeline" />
        <MenuButton label="Ajuda" />
      </nav>

      {/* Spacer for drag region */}
      <div className="flex-1" data-tauri-drag-region />

      {/* View toggle */}
      <div className="flex gap-1">
        <button
          onClick={() => setCurrentView('editor')}
          className={`px-2 py-0.5 rounded text-xs transition-colors ${
            currentView === 'editor' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
          }`}
        >
          Editor
        </button>
        <button
          onClick={() => setCurrentView('library')}
          className={`px-2 py-0.5 rounded text-xs transition-colors ${
            currentView === 'library' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
          }`}
        >
          Biblioteca
        </button>
      </div>
    </div>
  )
}

interface MenuItem {
  label: string
  action?: () => void
  shortcut?: string
}

function MenuButton({ label, items }: { label: string; items?: MenuItem[] }) {
  // TODO: Replace with Radix Menubar for full functionality
  return (
    <button className="px-2 py-0.5 rounded hover:bg-accent transition-colors">
      {label}
    </button>
  )
}
