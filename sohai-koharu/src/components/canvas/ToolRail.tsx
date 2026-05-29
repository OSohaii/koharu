import { useEditorStore, type CanvasMode } from '@/stores/editorStore'

const tools: { mode: CanvasMode; label: string; icon: string; shortcut: string }[] = [
  { mode: 'select', label: 'Selecionar', icon: 'V', shortcut: 'V' },
  { mode: 'block', label: 'Bloco de texto', icon: 'M', shortcut: 'M' },
  { mode: 'brush', label: 'Pincel', icon: 'B', shortcut: 'B' },
  { mode: 'eraser', label: 'Borracha', icon: 'E', shortcut: 'E' },
]

export function ToolRail() {
  const { canvasMode, setCanvasMode } = useEditorStore()

  return (
    <div className="flex w-9 flex-col items-center gap-1 border-r bg-card py-2">
      {tools.map((tool) => (
        <button
          key={tool.mode}
          onClick={() => setCanvasMode(tool.mode)}
          title={`${tool.label} (${tool.shortcut})`}
          className={`flex h-7 w-7 items-center justify-center rounded text-xs font-mono transition-colors ${
            canvasMode === tool.mode
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-accent hover:text-foreground'
          }`}
        >
          {tool.icon}
        </button>
      ))}
    </div>
  )
}
