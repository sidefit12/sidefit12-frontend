<!--
  @component PdfViewer
  @description PDF를 canvas로 렌더링하는 뷰어. 다운로드/우클릭 방지.
  페이지 이동 지원. CORS 에러 시 에러 메시지 표시.
-->
<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import * as pdfjsLib from 'pdfjs-dist'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

interface Props {
  url: string
}

const props = defineProps<Props>()

const canvasRefs = ref<HTMLCanvasElement[]>([])
const totalPages = ref(0)
const loading = ref(true)
const error = ref(false)

let pdfDoc: pdfjsLib.PDFDocumentProxy | null = null

async function loadPdf() {
  loading.value = true
  error.value = false
  try {
    pdfDoc = await pdfjsLib.getDocument({ url: props.url, withCredentials: false }).promise
    totalPages.value = pdfDoc.numPages
    loading.value = false
    await nextTick()
    await renderAllPages()
  } catch {
    error.value = true
    loading.value = false
  }
}

async function renderAllPages() {
  if (!pdfDoc) return
  for (let i = 1; i <= totalPages.value; i++) {
    const canvas = canvasRefs.value[i - 1]
    if (!canvas) continue
    const page = await pdfDoc.getPage(i)
    const containerWidth = canvas.parentElement?.clientWidth || 800
    const unscaledViewport = page.getViewport({ scale: 1 })
    const fitScale = Math.max((containerWidth - 32) / unscaledViewport.width, 0.5)
    const viewport = page.getViewport({ scale: fitScale })

    const ctx = canvas.getContext('2d')
    if (!ctx) continue

    canvas.width = viewport.width
    canvas.height = viewport.height

    await page.render({ canvasContext: ctx, viewport }).promise
  }
}

onMounted(() => loadPdf())
watch(
  () => props.url,
  () => loadPdf(),
)
</script>

<template>
  <div class="flex h-full flex-col" @contextmenu.prevent>
    <!-- 로딩 -->
    <div v-if="loading" class="flex flex-1 items-center justify-center">
      <div class="skeleton-pulse h-8 w-[200px] rounded bg-bg-card" />
    </div>

    <!-- 에러 (CORS 등) -->
    <div
      v-else-if="error"
      class="flex flex-1 flex-col items-center justify-center gap-4 p-8 -mt-[80px]"
    >
      <div
        class="check-bounce flex size-[80px] items-center justify-center rounded-full bg-[#D43F21]"
      >
        <span class="text-2xl font-bold text-white">!</span>
      </div>
      <p class="text-sm font-bold text-text">파일을 불러올 수 없습니다</p>
      <p class="text-[13px] text-text-secondary">
        네트워크 상태를 확인하거나 잠시 후 다시 시도해 주세요.
      </p>
      <button
        class="mt-2 rounded-full bg-text px-6 py-2.5 text-sm font-bold text-white hover:opacity-80"
        @click="loadPdf"
      >
        다시 시도
      </button>
    </div>

    <!-- PDF 캔버스 (전체 페이지 스크롤) -->
    <template v-else>
      <div class="flex-1 overflow-auto bg-[#525659] p-4">
        <div class="flex flex-col items-center gap-4">
          <canvas
            v-for="page in totalPages"
            :key="page"
            :ref="
              (el) => {
                if (el) canvasRefs[page - 1] = el as HTMLCanvasElement
              }
            "
            class="shadow-lg"
          />
        </div>
      </div>

      <!-- 페이지 정보 -->
      <div class="flex items-center justify-center border-t border-border bg-white px-4 py-3">
        <span class="text-[13px] text-text">총 {{ totalPages }}페이지</span>
      </div>
    </template>
  </div>
</template>
