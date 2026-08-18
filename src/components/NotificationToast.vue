<!--
  @component NotificationToast
  @description 인앱 푸시 알림 토스트. 포그라운드에서 FCM 메시지 수신 시
  화면 우상단에 슬라이드인 되며 5초 후 자동 소멸.
-->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

export interface ToastPayload {
  title: string
  body: string
  notificationType: string
  referenceType: string
  referenceId: string
}

const props = defineProps<{
  payload: ToastPayload
}>()

const emit = defineEmits<{
  close: []
}>()

const router = useRouter()
const visible = ref(false)
const closing = ref(false)

function getIcon(): string {
  const type = props.payload.notificationType
  if (type.includes('ACCEPTED') || type.includes('JOINED')) return '✓'
  if (type.includes('REJECTED') || type.includes('LEFT')) return '!'
  if (type.includes('CLOSED')) return '×'
  return 'i'
}

function handleClick() {
  const { referenceType, referenceId } = props.payload
  if (referenceType === 'APPLICATION') {
    router.push('/mypage/applications')
  } else if (referenceType === 'PROJECT') {
    router.push(`/projects/${referenceId}`)
  }
  close()
}

function close() {
  closing.value = true
  setTimeout(() => emit('close'), 300)
}

onMounted(() => {
  // 등장 애니메이션
  requestAnimationFrame(() => {
    visible.value = true
  })
  // 5초 후 자동 닫기
  setTimeout(close, 5000)
})
</script>

<template>
  <div
    :class="[
      'fixed right-6 top-[90px] z-[200] w-[360px] cursor-pointer rounded-xl border border-border bg-white px-5 py-4 shadow-lg transition-all duration-300',
      visible && !closing ? 'translate-x-0 opacity-100' : 'translate-x-[120%] opacity-0',
    ]"
    @click="handleClick"
  >
    <div class="flex items-start gap-3">
      <!-- 아이콘 -->
      <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary">
        <span class="text-sm font-bold text-text">{{ getIcon() }}</span>
      </div>

      <!-- 내용 -->
      <div class="flex-1">
        <p class="text-sm font-bold text-text">{{ payload.title }}</p>
        <p class="mt-0.5 text-[12px] text-text-secondary">{{ payload.body }}</p>
      </div>

      <!-- 닫기 -->
      <button
        class="shrink-0 text-lg text-text-secondary transition-colors hover:text-text"
        @click.stop="close"
      >
        ×
      </button>
    </div>
  </div>
</template>
