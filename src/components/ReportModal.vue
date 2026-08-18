<!--
  @component ReportModal
  @description 신고 모달. 프로젝트 또는 사용자를 사유 선택 + 상세 내용으로 신고한다.
-->
<script setup lang="ts">
import { ref } from 'vue'
import { reportProject, reportUser, type ReasonType } from '@/api/report'

const props = defineProps<{
  targetType: 'PROJECT' | 'USER'
  targetId: number
}>()

const emit = defineEmits<{
  close: []
}>()

const reasons: { value: ReasonType; label: string }[] = [
  { value: 'SPAM', label: '스팸·광고' },
  { value: 'MISLEADING_INFORMATION', label: '허위 정보' },
  { value: 'INAPPROPRIATE_CONTENT', label: '부적절한 내용' },
  { value: 'HARASSMENT', label: '괴롭힘' },
  { value: 'OTHER', label: '기타' },
]

const selectedReason = ref<ReasonType | null>(null)
const detail = ref('')
const submitting = ref(false)
const error = ref('')
const completed = ref(false)

async function handleSubmit() {
  error.value = ''
  if (!selectedReason.value) {
    error.value = '신고 사유를 선택해 주세요.'
    return
  }

  submitting.value = true
  try {
    const payload = {
      reasonType: selectedReason.value,
      detail: detail.value.trim() || null,
    }
    if (props.targetType === 'PROJECT') {
      await reportProject(props.targetId, payload)
    } else {
      await reportUser(props.targetId, payload)
    }
    completed.value = true
  } catch (e: unknown) {
    const err = e as { response?: { status?: number } }
    if (err.response?.status === 409) {
      error.value = '이미 신고한 대상입니다.'
    } else {
      error.value = '신고 접수에 실패했어요. 잠시 후 다시 시도해 주세요.'
    }
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-[100] flex items-center justify-center bg-black/40">
      <div class="report-modal w-full max-w-[520px] rounded-xl bg-white px-8 py-8">
        <!-- 완료 상태 -->
        <template v-if="completed">
          <div class="flex flex-col items-center py-6">
            <div
              class="report-icon flex h-[58px] w-[58px] items-center justify-center rounded-full bg-primary"
            >
              <span class="text-xl font-bold text-text">✓</span>
            </div>
            <h2 class="report-fade mt-6 text-xl font-bold text-text">신고가 접수되었어요</h2>
            <p class="report-fade delay-1 mt-2 text-sm text-text-secondary">
              운영팀이 확인 후 처리 결과를 알려드립니다.
            </p>
            <button
              class="report-fade delay-2 mt-8 h-[46px] w-full max-w-[220px] rounded-full bg-text text-sm font-bold text-white"
              @click="emit('close')"
            >
              확인
            </button>
          </div>
        </template>

        <!-- 신고 폼 -->
        <template v-else>
          <h2 class="text-xl font-bold text-text">신고하기</h2>
          <p class="mt-2 text-sm text-text-secondary">대상 정보는 자동으로 포함됩니다.</p>

          <!-- 사유 선택 -->
          <p class="mt-6 text-[13px] font-bold text-text">신고 사유 *</p>
          <div class="mt-3 flex flex-wrap gap-2">
            <button
              v-for="r in reasons"
              :key="r.value"
              :class="[
                'rounded-full border px-4 py-2 text-xs font-bold transition-all',
                selectedReason === r.value
                  ? 'border-text bg-text text-white'
                  : 'border-border bg-white text-text hover:bg-bg-muted',
              ]"
              @click="selectedReason = r.value"
            >
              {{ r.label }}
            </button>
          </div>

          <!-- 상세 내용 -->
          <p class="mt-6 text-[13px] font-bold text-text">상세 내용</p>
          <textarea
            v-model="detail"
            rows="4"
            maxlength="2000"
            class="mt-2 w-full resize-none rounded-lg border border-border bg-white px-4 py-3 text-[13px] text-text outline-none focus:border-text"
            placeholder="운영팀이 확인할 수 있도록 구체적으로 작성하세요."
          />

          <!-- 에러 -->
          <p v-if="error" class="mt-3 text-[13px] text-[#d43f21]">{{ error }}</p>

          <!-- 버튼 -->
          <div class="mt-6 flex gap-4">
            <button
              class="h-[46px] flex-1 rounded-full border border-border bg-white text-sm font-bold text-text transition-all hover:bg-bg-muted"
              @click="emit('close')"
            >
              취소
            </button>
            <button
              class="h-[46px] flex-1 rounded-full bg-text text-sm font-bold text-white transition-all hover:opacity-80 disabled:opacity-40"
              :disabled="submitting || !selectedReason"
              @click="handleSubmit"
            >
              {{ submitting ? '접수 중...' : '신고 접수' }}
            </button>
          </div>
        </template>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.report-modal {
  animation: modal-pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

.report-icon {
  animation: scale-pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s both;
}

.report-fade {
  opacity: 0;
  transform: translateY(8px);
  animation: fade-up 0.3s ease-out 0.25s forwards;
}

.report-fade.delay-1 {
  animation-delay: 0.35s;
}

.report-fade.delay-2 {
  animation-delay: 0.45s;
}

@keyframes modal-pop {
  0% {
    transform: scale(0.9);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes scale-pop {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes fade-up {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
