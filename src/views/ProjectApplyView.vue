<!--
  @component ProjectApplyView
  @description 프로젝트 지원 화면.
  좌측 프로젝트 요약 + 우측 지원 폼.
-->
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import { fetchProjectDetail, type ProjectDetailData } from '@/api/projectDetail'
import { createApplication } from '@/api/application'
import { useAuthStore } from '@/stores/useAuthStore'
import DefaultAvatar from '@/components/DefaultAvatar.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const projectId = computed(() => Number(route.params.id))

// 지원 완료 후 뒤로가기 방지 → 상세 페이지로 이동
onBeforeRouteLeave((_to, _from, next) => {
  if (applied.value) {
    next(`/projects/${projectId.value}`)
  } else {
    next()
  }
})
const loading = ref(true)
const submitting = ref(false)
const error = ref('')
const detail = ref<ProjectDetailData | null>(null)

// 폼 상태
const selectedPositionId = ref<number | null>(null)
const applicationMessage = ref('')
const formError = ref('')

// 성공 상태
const applied = ref(false)

onMounted(async () => {
  try {
    const res = await fetchProjectDetail(projectId.value)
    detail.value = res.data
    // 첫 번째 포지션 자동 선택
    if (res.data.project.positions.length > 0) {
      selectedPositionId.value = res.data.project.positions[0].projectPositionId
    }
  } catch {
    error.value = '프로젝트 정보를 불러오지 못했어요.'
  } finally {
    loading.value = false
  }
})

/** 진행 방식 한글 */
function workTypeLabel(workType: string): string {
  const map: Record<string, string> = { ONLINE: '온라인', OFFLINE: '오프라인', HYBRID: '병행' }
  return map[workType] ?? workType
}

/** 날짜 포맷 */
function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

/** 메시지 글자 수 */
const messageLength = computed(() => applicationMessage.value.length)

/** 제출 가능 여부 */
const canSubmit = computed(
  () =>
    selectedPositionId.value !== null && messageLength.value >= 20 && messageLength.value <= 1000,
)

/** 지원 제출 */
async function handleSubmit() {
  formError.value = ''
  if (!selectedPositionId.value) {
    formError.value = '지원할 역할을 선택해 주세요.'
    return
  }
  if (messageLength.value < 20) {
    formError.value = '지원 메시지를 20자 이상 입력해 주세요.'
    return
  }

  submitting.value = true
  try {
    await createApplication(projectId.value, {
      applicationMessage: applicationMessage.value,
      projectPositionId: selectedPositionId.value,
    })
    applied.value = true
    // 히스토리에서 지원 페이지 제거 (뒤로가기 시 상세로)
    window.history.replaceState({}, '', route.fullPath)
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } } }
    formError.value = err.response?.data?.message ?? '지원에 실패했어요. 다시 시도해 주세요.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-[1440px] px-12 pb-16 pt-8">
    <!-- 타이틀 (지원 완료 시 숨김) -->
    <template v-if="!applied">
      <h1 class="text-[30px] font-bold text-text">프로젝트 지원</h1>
      <p class="mt-2 text-sm text-text-secondary">
        지원 역할과 메시지를 작성해 프로젝트 리더에게 전달합니다.
      </p>
    </template>

    <!-- 로딩 -->
    <div v-if="loading" class="mt-8 flex gap-6">
      <div class="h-[500px] w-[520px] rounded-xl bg-border skeleton-pulse" />
      <div class="h-[500px] flex-1 rounded-xl bg-border skeleton-pulse" />
    </div>

    <!-- 에러 -->
    <div v-else-if="error" class="mt-8 text-center text-[#d43f21]">{{ error }}</div>

    <!-- 지원 완료 -->
    <div v-else-if="applied" class="flex min-h-[calc(100vh-200px)] items-center justify-center">
      <div
        class="flex w-[780px] flex-col items-center rounded-xl border border-border bg-white py-20"
      >
        <div
          class="check-bounce flex size-[80px] items-center justify-center rounded-full bg-primary-dark"
        >
          <span class="text-3xl text-text">✓</span>
        </div>
        <h2 class="hero-animate hero-animate-delay-1 mt-8 text-xl font-bold text-text">
          프로젝트에 지원했어요
        </h2>
        <p class="hero-animate hero-animate-delay-2 mt-3 text-sm text-text-secondary">
          모집자가 결과를 변경하면 알림과 내 지원 현황에 반영됩니다.
        </p>
        <button
          class="hero-animate hero-animate-delay-3 mt-8 flex h-[46px] items-center justify-center rounded-full bg-text px-8 text-sm font-bold text-white transition-transform hover:scale-105"
          @click="router.push('/activity')"
        >
          지원 내역 확인
        </button>
      </div>
    </div>

    <!-- 지원 폼 -->
    <template v-else-if="detail">
      <div class="mt-8 flex gap-6">
        <!-- 좌측: 프로젝트 요약 -->
        <div class="hero-animate w-[520px] shrink-0 rounded-xl bg-bg-card p-7">
          <p class="text-[13px] font-bold text-text">지원할 프로젝트</p>

          <h3 class="mt-4 text-lg font-bold leading-tight text-text">
            {{ detail.project.title }}
          </h3>

          <!-- 칩 -->
          <div class="mt-4 flex flex-wrap gap-2">
            <span
              v-for="topic in detail.project.topics"
              :key="topic.topicId"
              class="flex h-[34px] items-center rounded-full bg-white px-3 text-xs text-text"
            >
              {{ topic.topicName }}
            </span>
            <span class="flex h-[34px] items-center rounded-full bg-white px-3 text-xs text-text">
              {{ workTypeLabel(detail.project.workType) }}
            </span>
          </div>

          <!-- 마감일 -->
          <p class="mt-5 text-sm text-text-secondary">
            마감 {{ formatDate(detail.project.recruitmentDeadline) }}
          </p>

          <!-- 모집 역할 -->
          <div class="mt-6">
            <p class="text-[13px] font-bold text-text">모집 역할</p>
            <div class="mt-3 space-y-2">
              <p
                v-for="pos in detail.project.positions"
                :key="pos.projectPositionId"
                class="text-sm font-bold text-text"
              >
                {{ pos.positionTitle }} {{ pos.acceptedCount }} / {{ pos.requiredCount }}
              </p>
            </div>
          </div>

          <!-- 지원 가능 조건 -->
          <div class="mt-6">
            <p class="text-[13px] font-bold text-text">지원 가능 조건</p>
            <ul class="mt-3 space-y-1 text-[12px] text-text-secondary">
              <li>• 로그인 사용자</li>
              <li>• 본인이 작성한 글이 아님</li>
              <li>• 모집 중이고 정원이 남아 있음</li>
              <li>• 기존 활성 지원이 없음</li>
            </ul>
          </div>
        </div>

        <!-- 우측: 지원 폼 -->
        <div
          class="hero-animate hero-animate-delay-1 flex-1 rounded-xl border border-border bg-white p-7"
        >
          <h3 class="text-lg font-bold text-text">지원 정보</h3>

          <!-- 지원 역할 선택 -->
          <div class="mt-6">
            <label class="text-[13px] font-bold text-text-secondary">지원 역할 *</label>
            <div class="mt-3 flex flex-wrap gap-2">
              <button
                v-for="pos in detail.project.positions"
                :key="pos.projectPositionId"
                type="button"
                :class="[
                  'rounded-full border px-4 py-2 text-xs font-bold transition-all',
                  selectedPositionId === pos.projectPositionId
                    ? 'border-text bg-text text-white'
                    : 'border-border bg-white text-text hover:border-text',
                ]"
                @click="selectedPositionId = pos.projectPositionId"
              >
                {{ pos.positionTitle }}
              </button>
            </div>
          </div>

          <!-- 지원 메시지 -->
          <div class="mt-6">
            <label class="text-[13px] font-bold text-text-secondary">지원 메시지 *</label>
            <textarea
              v-model="applicationMessage"
              placeholder="프로젝트에 관심을 가진 이유와 관련 경험을 20~1000자로 작성하세요."
              class="mt-3 h-[220px] w-full resize-none rounded-xl border border-border px-5 py-4 text-sm text-text placeholder:text-[#8d8d8d] focus:border-text focus:outline-none"
            />
            <p
              class="mt-2 text-right text-[12px]"
              :class="messageLength > 1000 ? 'text-[#d43f21]' : 'text-text-secondary'"
            >
              {{ messageLength }} / 1000
            </p>
          </div>

          <!-- 프로필 공개 정보 -->
          <div class="mt-6">
            <p class="text-[13px] font-bold text-text-secondary">프로필 공개 정보</p>
            <div class="mt-3 flex items-center gap-4 rounded-xl bg-bg-card px-5 py-4">
              <DefaultAvatar :size="48" :image-url="authStore.user?.profileImageUrl" />
              <div>
                <p class="text-sm font-bold text-text">
                  {{ authStore.user?.nickname ?? '사용자' }} · 백엔드
                </p>
                <p class="text-xs text-text-secondary">Java · Spring Boot · PostgreSQL</p>
              </div>
            </div>
          </div>

          <!-- 에러 -->
          <p v-if="formError" class="mt-4 text-[13px] text-[#d43f21]">{{ formError }}</p>

          <!-- 지원 버튼 -->
          <div class="mt-8 flex justify-end">
            <button
              :disabled="!canSubmit || submitting"
              class="flex h-[46px] items-center justify-center rounded-full bg-text px-8 text-sm font-bold text-white transition-transform hover:scale-105 disabled:opacity-40"
              @click="handleSubmit"
            >
              {{ submitting ? '지원 중...' : '지원하기' }}
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
