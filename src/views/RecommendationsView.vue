<!--
  @view RecommendationsView
  @description AI 맞춤 추천 - 역할·토픽·기술 스택 일치 점수와 추천 이유 제공
  @route /recommendations
  @figma 240:50
-->
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore'
import {
  fetchRecommendations,
  refreshRecommendations,
  type RecommendationItem,
} from '@/api/recommendations'

const router = useRouter()
const authStore = useAuthStore()

const loading = ref(true)
const refreshing = ref(false)
const items = ref<RecommendationItem[]>([])
const fallback = ref(false)
const fallbackReason = ref<string | null>(null)
const hasNext = ref(false)
const nextCursor = ref<string | null>(null)
const loadingMore = ref(false)

/* ────── 데이터 로드 ────── */
async function loadData(cursor?: string) {
  try {
    const res = await fetchRecommendations({ cursor, size: 20 })
    if (cursor) {
      items.value.push(...res.data.items)
    } else {
      items.value = res.data.items
    }
    fallback.value = res.data.fallback
    fallbackReason.value = res.data.fallbackReason
    hasNext.value = res.meta.hasNext
    nextCursor.value = res.meta.nextCursor
  } catch {
    // 로드 실패
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

onMounted(() => {
  if (!authStore.isLoggedIn) {
    router.push('/login')
    return
  }
  loadData()
})

/* ────── 새로고침 ────── */
async function handleRefresh() {
  refreshing.value = true
  try {
    await refreshRecommendations(false)
    // 새로고침 후 다시 로드
    loading.value = true
    await loadData()
  } catch {
    alert('추천 새로고침에 실패했습니다.')
  } finally {
    refreshing.value = false
  }
}

/* ────── 더 보기 ────── */
async function loadMore() {
  if (!hasNext.value || !nextCursor.value || loadingMore.value) return
  loadingMore.value = true
  await loadData(nextCursor.value)
}

/* ────── 유틸 ────── */
function scorePercent(score: number): number {
  return Math.round(score * 100)
}

const totalCount = computed(() => items.value.length)

/* ────── 추천 이유 토글 ────── */
const expandedReasons = ref<Set<number>>(new Set())

function toggleReasons(projectId: number) {
  if (expandedReasons.value.has(projectId)) {
    expandedReasons.value.delete(projectId)
  } else {
    expandedReasons.value.add(projectId)
  }
}
</script>

<template>
  <div class="mx-auto max-w-[1344px] px-6 py-10">
    <!-- 히어로 배너 -->
    <div class="rounded-xl bg-text px-8 py-7">
      <div class="flex items-start justify-between">
        <div>
          <span
            class="inline-block rounded-full bg-primary-dark px-3 py-1 text-[11px] font-bold text-text"
          >
            FIT SCORE
          </span>
          <h1 class="mt-4 text-[28px] font-bold leading-tight text-white">
            추천 점수보다 추천 근거를<br />먼저 확인하세요.
          </h1>
        </div>
        <div class="flex flex-col items-end gap-[50px]">
          <p class="text-sm text-white/70">역할 40% · 토픽 30% · 기술 스택 30%</p>
          <button
            class="rounded-full bg-white px-5 py-2.5 text-xs font-bold text-text transition-all hover:bg-bg-muted"
            @click="router.push('/profile/edit')"
          >
            프로필 수정
          </button>
        </div>
      </div>
    </div>

    <!-- 헤더 -->
    <div class="mt-8 flex items-center justify-between">
      <h2 class="text-xl font-bold text-text">맞춤 추천 {{ totalCount }}개</h2>
      <button
        class="flex items-center gap-2 text-sm font-bold text-text transition-colors hover:opacity-70"
        :disabled="refreshing"
        @click="handleRefresh"
      >
        <span
          v-if="refreshing"
          class="inline-block size-4 animate-spin rounded-full border-2 border-text border-t-transparent"
        />
        {{ refreshing ? '갱신 중...' : '새로고침' }}
      </button>
    </div>

    <!-- 로딩 -->
    <div v-if="loading" class="mt-6 space-y-4">
      <div v-for="i in 3" :key="i" class="skeleton-pulse h-[140px] rounded-xl bg-bg-card" />
    </div>

    <!-- 빈 상태 -->
    <div v-else-if="items.length === 0" class="mt-12 flex flex-col items-center text-center">
      <div class="flex size-[80px] items-center justify-center rounded-full bg-bg-card">
        <span class="text-2xl text-text-secondary">—</span>
      </div>
      <p class="mt-4 text-sm font-bold text-text">추천 결과가 없어요</p>
      <p class="mt-1 text-[13px] text-text-secondary">
        프로필에 토픽·기술·역할을 설정하면 맞춤 추천이 시작됩니다.
      </p>
      <button
        class="mt-6 rounded-full bg-text px-6 py-3 text-sm font-bold text-white transition-transform hover:scale-105"
        @click="router.push('/profile/edit')"
      >
        프로필 설정
      </button>
    </div>

    <!-- 추천 리스트 -->
    <div v-else class="mt-6 space-y-4">
      <div
        v-for="(item, index) in items"
        :key="item.recommendationResultId ?? item.project.projectId"
        class="relative cursor-pointer overflow-hidden rounded-xl border border-border bg-white px-6 py-5 transition-all hover:shadow-sm"
        :class="{ 'animate-fade-in-up': true }"
        :style="{ animationDelay: `${index * 80}ms` }"
        @click="router.push(`/projects/${item.project.projectId}`)"
      >
        <!-- 첫 번째 항목 볼트 사이드바 -->
        <div v-if="index === 0" class="absolute left-0 top-0 h-full w-[3px] bg-primary-dark" />

        <div class="flex items-start justify-between">
          <div class="flex items-start gap-4">
            <!-- 점수 뱃지 (원형, 검정 배경 + volt 테두리) -->
            <div
              class="flex size-[80px] shrink-0 items-center justify-center rounded-full border-4 border-primary-dark bg-text"
            >
              <span class="text-xl font-bold text-white">{{ scorePercent(item.finalScore) }}%</span>
            </div>

            <!-- 콘텐츠 -->
            <div>
              <p class="text-base font-bold text-text">{{ item.project.title }}</p>

              <!-- 추천 이유 태그 (클릭하면 이유 펼침) -->
              <div class="mt-3 flex flex-wrap gap-2">
                <span
                  v-if="index === 0"
                  class="rounded-full bg-primary-dark px-3 py-1 text-[11px] font-bold text-text"
                >
                  Best Match
                </span>
                <button
                  class="rounded-full border border-border bg-white px-3 py-1 text-[11px] font-bold text-text transition-all hover:bg-bg-muted"
                  @click.stop="toggleReasons(item.project.projectId)"
                >
                  추천 이유 {{ item.reasons.length }}개
                </button>
              </div>

              <!-- 추천 이유 상세 (토글) -->
              <transition
                enter-active-class="transition-all duration-300 ease-out"
                enter-from-class="max-h-0 opacity-0"
                enter-to-class="max-h-[200px] opacity-100"
                leave-active-class="transition-all duration-200 ease-in"
                leave-from-class="max-h-[200px] opacity-100"
                leave-to-class="max-h-0 opacity-0"
              >
                <div
                  v-if="expandedReasons.has(item.project.projectId)"
                  class="mt-3 overflow-hidden space-y-1"
                >
                  <p
                    v-for="reason in item.reasons"
                    :key="reason.reasonType"
                    class="text-[13px] text-text-secondary"
                  >
                    • {{ reason.reasonText }}
                  </p>
                </div>
              </transition>
            </div>
          </div>

          <!-- 상세 버튼 -->
          <button
            class="shrink-0 rounded-full border border-border bg-white px-4 py-2 text-xs font-bold text-text transition-all hover:bg-bg-muted"
            @click.stop="router.push(`/projects/${item.project.projectId}`)"
          >
            상세 보기
          </button>
        </div>
      </div>

      <!-- 더 보기 -->
      <div v-if="hasNext" class="flex justify-center pt-4">
        <button
          class="rounded-full border border-border bg-white px-6 py-3 text-sm font-bold text-text transition-all hover:bg-bg-muted"
          :disabled="loadingMore"
          @click="loadMore"
        >
          {{ loadingMore ? '불러오는 중...' : '더 보기' }}
        </button>
      </div>
    </div>
  </div>
</template>
