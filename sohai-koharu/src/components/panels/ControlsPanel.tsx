import { useAiStore } from '@/stores/aiStore'
import { useEditorStore } from '@/stores/editorStore'
import { useTextBlocksStore } from '@/stores/textBlocksStore'
import { usePipeline } from '@/hooks/usePipeline'

export function ControlsPanel() {
  const { 
    detectionModel, setDetectionModel,
    ocrModel, setOcrModel,
    inpaintModel, setInpaintModel,
    translationBackend, setTranslationBackend,
    localLlmModel, setLocalLlmModel,
    sourceLanguage, setSourceLanguage,
    targetLanguage, setTargetLanguage,
  } = useAiStore()

  const { showOriginal, showInpainted, showTextBlocks, showRendered, toggleLayer, pages, currentPageIndex } = useEditorStore()
  const { runPipeline, runPipelineAll, isRunning } = usePipeline()

  const currentPage = pages[currentPageIndex]
  const pipeline = useTextBlocksStore((s) => currentPage ? s.pipelineByPage[currentPage.id] : null)
  const blocks = useTextBlocksStore((s) => currentPage ? s.blocksByPage[currentPage.id] || [] : [])

  return (
    <div className="flex h-full flex-col bg-card overflow-y-auto">
      {/* Header */}
      <div className="flex items-center border-b px-3 py-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Controles
        </span>
      </div>

      <div className="flex-1 p-3 space-y-4">
        {/* Pipeline Execution */}
        <Section title="Pipeline">
          <div className="space-y-2">
            <button
              onClick={runPipeline}
              disabled={isRunning || !currentPage}
              className="w-full rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRunning ? '⏳ Processando...' : '▶ Executar Pipeline'}
            </button>
            <button
              onClick={runPipelineAll}
              disabled={isRunning || pages.length === 0}
              className="w-full rounded-md border px-3 py-1.5 text-[10px] font-medium hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRunning ? 'Processando...' : '▶▶ Traduzir Todas as Paginas'}
            </button>
          </div>

          {/* Progress */}
          {pipeline && pipeline.step !== 'idle' && (
            <PipelineProgress pipeline={pipeline} blockCount={blocks.length} />
          )}
        </Section>

        {/* Languages */}
        <Section title="Idiomas">
          <div className="grid grid-cols-2 gap-2">
            <SelectField label="Origem" value={sourceLanguage} onChange={setSourceLanguage}
              options={[
                { value: 'ja', label: 'Japones' },
                { value: 'ko', label: 'Coreano' },
                { value: 'zh', label: 'Chines' },
                { value: 'en', label: 'Ingles' },
              ]}
            />
            <SelectField label="Destino" value={targetLanguage} onChange={setTargetLanguage}
              options={[
                { value: 'pt-BR', label: 'Portugues' },
                { value: 'en', label: 'Ingles' },
                { value: 'es', label: 'Espanhol' },
              ]}
            />
          </div>
        </Section>

        {/* AI Pipeline Models */}
        <Section title="Modelos de IA">
          <SelectField label="Deteccao" value={detectionModel} onChange={(v) => setDetectionModel(v as any)}
            options={[
              { value: 'anime-text-yolo', label: 'Anime Text YOLO' },
              { value: 'comic-bubble-detector', label: 'Comic Bubble Detector' },
            ]}
          />
          <SelectField label="OCR" value={ocrModel} onChange={(v) => setOcrModel(v as any)}
            options={[
              { value: 'manga-ocr', label: 'Manga OCR' },
              { value: 'paddleocr', label: 'PaddleOCR VL' },
            ]}
          />
          <SelectField label="Inpaint" value={inpaintModel} onChange={(v) => setInpaintModel(v as any)}
            options={[
              { value: 'lama-manga', label: 'LaMa Manga' },
              { value: 'aot-inpainting', label: 'AOT Inpainting' },
            ]}
          />
        </Section>

        {/* Translation */}
        <Section title="Traducao">
          <SelectField label="Backend" value={translationBackend} onChange={(v) => setTranslationBackend(v as any)}
            options={[
              { value: 'local-llm', label: 'LLM Local' },
              { value: 'gemini', label: 'Gemini' },
              { value: 'openai', label: 'OpenAI' },
              { value: 'deepl', label: 'DeepL' },
              { value: 'deepseek', label: 'DeepSeek' },
            ]}
          />
          {translationBackend === 'local-llm' && (
            <SelectField label="Modelo" value={localLlmModel} onChange={(v) => setLocalLlmModel(v as any)}
              options={[
                { value: 'gemma4-e2b', label: 'Gemma 4 E2B' },
                { value: 'gemma4-e4b', label: 'Gemma 4 E4B' },
                { value: 'qwen3.5-4b', label: 'Qwen 3.5 4B' },
                { value: 'qwen3.5-9b', label: 'Qwen 3.5 9B' },
                { value: 'sakura-7b', label: 'Sakura 7B' },
              ]}
            />
          )}
          {translationBackend !== 'local-llm' && (
            <ApiKeyField backend={translationBackend} />
          )}
        </Section>

        {/* Block Stats */}
        {blocks.length > 0 && (
          <Section title="Blocos detectados">
            <div className="text-[10px] text-muted-foreground space-y-0.5">
              <p>Total: <span className="text-foreground font-medium">{blocks.length}</span></p>
              <p>Com OCR: <span className="text-foreground font-medium">{blocks.filter(b => b.originalText).length}</span></p>
              <p>Traduzidos: <span className="text-foreground font-medium">{blocks.filter(b => b.translatedText).length}</span></p>
            </div>
          </Section>
        )}

        {/* Layers */}
        <Section title="Camadas">
          <LayerToggle label="Original" checked={showOriginal} onChange={() => toggleLayer('original')} />
          <LayerToggle label="Inpainted" checked={showInpainted} onChange={() => toggleLayer('inpainted')} />
          <LayerToggle label="Text Blocks" checked={showTextBlocks} onChange={() => toggleLayer('textBlocks')} />
          <LayerToggle label="Rendered" checked={showRendered} onChange={() => toggleLayer('rendered')} />
        </Section>
      </div>
    </div>
  )
}

function PipelineProgress({ pipeline, blockCount }: { pipeline: any; blockCount: number }) {
  const stepLabels: Record<string, string> = {
    detecting: '🔍 Detectando...',
    ocr: '📖 Lendo texto...',
    translating: '🌐 Traduzindo...',
    done: '✅ Completo',
    error: '❌ Erro',
  }

  const progressPercent = (pipeline.completedSteps / pipeline.totalSteps) * 100

  return (
    <div className="rounded-md border p-2 space-y-1.5">
      {/* Step indicator */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium">
          {stepLabels[pipeline.step] || pipeline.step}
        </span>
        <span className="text-[9px] text-muted-foreground">
          {pipeline.completedSteps}/{pipeline.totalSteps}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            pipeline.step === 'error' ? 'bg-red-500' :
            pipeline.step === 'done' ? 'bg-green-500' :
            'bg-primary animate-pulse'
          }`}
          style={{ width: `${pipeline.step === 'done' ? 100 : progressPercent}%` }}
        />
      </div>

      {/* Message */}
      {pipeline.message && (
        <p className={`text-[9px] leading-tight ${pipeline.step === 'error' ? 'text-red-400' : 'text-muted-foreground'}`}>
          {pipeline.message}
        </p>
      )}

      {/* Block count when done */}
      {pipeline.step === 'done' && blockCount > 0 && (
        <p className="text-[9px] text-green-400">
          {blockCount} blocos traduzidos com sucesso
        </p>
      )}
    </div>
  )
}

function ApiKeyField({ backend }: { backend: string }) {
  const { apiKeys, setApiKey } = useAiStore()
  const key = apiKeys[backend] || ''

  return (
    <div className="space-y-1">
      <label className="text-[10px] text-muted-foreground">API Key ({backend})</label>
      <input
        type="password"
        value={key}
        onChange={(e) => setApiKey(backend, e.target.value)}
        placeholder="sk-..."
        className="w-full rounded-md border bg-background px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/50"
      />
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function SelectField({ label, value, onChange, options }: {
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] text-muted-foreground">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border bg-background px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-ring"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  )
}

function LayerToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input type="checkbox" checked={checked} onChange={onChange} className="rounded accent-primary" />
      <span className="text-xs">{label}</span>
    </label>
  )
}
