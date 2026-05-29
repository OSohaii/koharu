import { useCallback } from 'react'
import { useEditorStore } from '@/stores/editorStore'
import { useAiStore } from '@/stores/aiStore'
import { useTextBlocksStore, type TextBlock, type PipelineStep } from '@/stores/textBlocksStore'
import { detectText, recognizeText, translateBatch } from '@/lib/sidecar'

/**
 * Pipeline orchestrator: detect → OCR → translate.
 * 
 * Runs each step sequentially for the current page,
 * updating the text blocks store and pipeline progress at each stage.
 */
export function usePipeline() {
  const { pages, currentPageIndex } = useEditorStore()
  const { detectionModel, ocrModel, translationBackend, localLlmModel, sourceLanguage, targetLanguage } = useAiStore()
  const { setBlocksForPage, setPipelineState, setIsRunning, isRunning } = useTextBlocksStore()

  const currentPage = pages[currentPageIndex]

  const updateProgress = useCallback(
    (pageId: string, step: PipelineStep, completedSteps: number, message: string, error?: string) => {
      setPipelineState(pageId, {
        step,
        currentStepProgress: 0,
        totalSteps: 3,
        completedSteps,
        message,
        error,
      })
    },
    [setPipelineState],
  )

  /**
   * Run the full pipeline for the current page.
   */
  const runPipeline = useCallback(async () => {
    if (!currentPage || isRunning) return

    const pageId = currentPage.id
    setIsRunning(true)

    // Get the image file from cache
    const files = (window as any).__droppedFiles as File[] | undefined
    const imageFile = files?.[currentPageIndex]

    if (!imageFile) {
      updateProgress(pageId, 'error', 0, 'Nenhuma imagem encontrada para esta pagina', 'NO_IMAGE')
      setIsRunning(false)
      return
    }

    // Update page status in editor store
    const updatePageStatus = (status: string) => {
      const updatedPages = [...useEditorStore.getState().pages]
      updatedPages[currentPageIndex] = { ...updatedPages[currentPageIndex], status: status as any }
      useEditorStore.getState().setPages(updatedPages)
    }

    try {
      // ═══════════════ STEP 1: DETECTION ═══════════════
      updateProgress(pageId, 'detecting', 0, 'Detectando regioes de texto...')
      updatePageStatus('detecting')

      const detectionResult = await detectText(imageFile, detectionModel)

      if (detectionResult.boxes.length === 0) {
        updateProgress(pageId, 'done', 3, 'Nenhum texto detectado na pagina')
        updatePageStatus('done')
        setBlocksForPage(pageId, [])
        setIsRunning(false)
        return
      }

      // Create initial text blocks from detection
      const detectedBlocks: TextBlock[] = detectionResult.boxes.map((box, i) => ({
        id: `${pageId}-block-${i}`,
        pageId,
        x: box.x,
        y: box.y,
        width: box.width,
        height: box.height,
        confidence: box.confidence,
        label: box.label,
        originalText: '',
        ocrConfidence: 0,
        languageDetected: '',
        translatedText: '',
        translationBackend: '',
        isSelected: false,
        isEditing: false,
      }))

      setBlocksForPage(pageId, detectedBlocks)
      updateProgress(pageId, 'detecting', 1, `${detectedBlocks.length} regioes detectadas (${Math.round(detectionResult.inference_time_ms)}ms)`)

      // ═══════════════ STEP 2: OCR ═══════════════
      updateProgress(pageId, 'ocr', 1, 'Lendo texto (OCR)...')
      updatePageStatus('ocr')

      // Build regions JSON for OCR
      const regions = detectedBlocks.map((b) => ({
        x: b.x,
        y: b.y,
        width: b.width,
        height: b.height,
      }))

      const ocrResult = await recognizeText(imageFile, ocrModel)

      // Update blocks with OCR results
      const ocrBlocks = detectedBlocks.map((block, i) => {
        const ocrEntry = ocrResult.results[i]
        if (ocrEntry && ocrEntry.text.trim()) {
          return {
            ...block,
            originalText: ocrEntry.text,
            ocrConfidence: ocrEntry.confidence,
            languageDetected: ocrEntry.language_detected,
          }
        }
        return block
      })

      // Filter out blocks with no OCR text
      const blocksWithText = ocrBlocks.filter((b) => b.originalText.trim().length > 0)
      setBlocksForPage(pageId, blocksWithText)
      updateProgress(pageId, 'ocr', 2, `${blocksWithText.length} textos reconhecidos (${Math.round(ocrResult.inference_time_ms)}ms)`)

      if (blocksWithText.length === 0) {
        updateProgress(pageId, 'done', 3, 'Nenhum texto legivel encontrado')
        updatePageStatus('done')
        setIsRunning(false)
        return
      }

      // ═══════════════ STEP 3: TRANSLATION ═══════════════
      updateProgress(pageId, 'translating', 2, 'Traduzindo...')
      updatePageStatus('translating')

      const textsToTranslate = blocksWithText.map((b) => b.originalText)
      const model = translationBackend === 'local-llm' ? localLlmModel : translationBackend
      const apiKey = useAiStore.getState().apiKeys[translationBackend] || undefined

      const translationResult = await translateBatch(
        textsToTranslate,
        sourceLanguage,
        targetLanguage,
        translationBackend,
        model,
        apiKey,
      )

      // Update blocks with translations
      const translatedBlocks = blocksWithText.map((block, i) => {
        const translation = translationResult.translations[i]
        return {
          ...block,
          translatedText: translation?.translated || '',
          translationBackend: translationResult.backend_used,
        }
      })

      setBlocksForPage(pageId, translatedBlocks)

      // ═══════════════ DONE ═══════════════
      updateProgress(pageId, 'done', 3,
        `Pipeline completo! ${translatedBlocks.length} blocos traduzidos (${Math.round(translationResult.inference_time_ms)}ms)`,
      )
      updatePageStatus('done')

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido'
      updateProgress(pageId, 'error', 0, `Pipeline falhou: ${message}`, message)
      updatePageStatus('error')

      // Update page with error
      const updatedPages = [...useEditorStore.getState().pages]
      updatedPages[currentPageIndex] = {
        ...updatedPages[currentPageIndex],
        status: 'error',
        errorMessage: message,
      }
      useEditorStore.getState().setPages(updatedPages)
    } finally {
      setIsRunning(false)
    }
  }, [
    currentPage, currentPageIndex, isRunning, detectionModel, ocrModel,
    translationBackend, localLlmModel, sourceLanguage, targetLanguage,
    setBlocksForPage, setPipelineState, setIsRunning, updateProgress,
  ])

  /**
   * Run pipeline on ALL pages sequentially.
   */
  const runPipelineAll = useCallback(async () => {
    if (isRunning) return
    const { pages, setCurrentPageIndex } = useEditorStore.getState()

    for (let i = 0; i < pages.length; i++) {
      setCurrentPageIndex(i)

      // Load image for this page
      const files = (window as any).__droppedFiles as File[] | undefined
      if (files?.[i]) {
        const url = URL.createObjectURL(files[i])
        useEditorStore.getState().setCurrentImageUrl(url)
      }

      // Small delay to let state settle
      await new Promise((r) => setTimeout(r, 100))

      // Run pipeline for this page
      await runPipeline()
    }
  }, [isRunning, runPipeline])

  return {
    runPipeline,
    runPipelineAll,
    isRunning,
    currentPipeline: currentPage
      ? useTextBlocksStore.getState().getPipelineForPage(currentPage.id)
      : null,
  }
}
