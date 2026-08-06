<!--
  @view MyPageView
  @description 마이페이지 - 프로필 요약, 활동 통계, 탭별 최근 활동 미리보기
  @route /mypage
-->
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore'
import DefaultAvatar from '@/components/DefaultAvatar.vue'
import {
  fetchActivitySummary,
  fetchMyApplications,
  type ActivitySummary,
  type ApplicationResource,
} from '@/api/mypage'

const router = useRouter()
const authStore = useAuthStore()

/* ────── 상태 ────── */
const loading = ref(true)
const activeTab = ref<'applications'>('applications')

const summary = ref<ActivitySummary>({
  authoredProjectCount: 0,
  applicationCount: 0,
  pendingApplicationCount: 0,
  acceptedApplicationCount: 0,
  bookmarkedProjectCount: 0,
})

const applications = ref<ApplicationResource[]>([])

/* ────── 유저 정보 ────── */
const user = computed(() => authStore.user)

/* ────── 통계 카드 ────── */
const statCards = computed(() => [
  { label: '내 모집글', value: summary.value.authoredProjectCount },
  { label: '대기 지원', value: summary.value.pendingApplicationCount },
  { label: '승인 프로젝트', value: summary.value.acceptedApplicationCount },
  { label: '관심 목록', value: summary.value.bookmarkedProjectCount },
])

/* ────── 데이터 로드 ────── */
async function loadData() {
  loading.value = true
  try {
    const [summaryRes, appRes] = await Promise.allSettled([
      fetchActivitySummary(),
      fetchMyApplications({ size: 3 }),
    ])

    if (summaryRes.status === 'fulfilled') {
      summary.value = summaryRes.value
    }
    if (appRes.status === 'fulfilled') {
      applications.value = appRes.value.data.items
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (!authStore.isLoggedIn) {
    router.push('/login')
    return
  }
  loadData()
})

/* ────── 유틸 ────── */
function statusStyle(status: string) {
  switch (status) {
    case 'PENDING':
      return 'bg-primary-dark text-text'
    case 'ACCEPTED':
      return 'bg-text text-white'
    case 'REJECTED':
      return 'bg-white border border-border text-text'
    case 'CANCELED':
      return 'bg-white border border-border text-text-secondary'
    default:
      return 'bg-bg-muted text-text'
  }
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    PENDING: '대기 중',
    ACCEPTED: '승인',
    REJECTED: '거절',
    CANCELED: '취소',
  }
  return map[status] ?? status
}

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}
</script>

<template>
  <div class="mx-auto max-w-[1344px] px-6 py-10">
    <!-- 스켈레톤 로딩 -->
    <template v-if="loading">
      <div class="skeleton-pulse mb-8 h-[170px] rounded-xl bg-bg-card" />
      <div class="mb-8 grid grid-cols-4 gap-4">
        <div v-for="i in 4" :key="i" class="skeleton-pulse h-[110px] rounded-xl bg-bg-card" />
      </div>
      <div class="skeleton-pulse h-[330px] rounded-xl bg-bg-card" />
    </template>

    <!-- 메인 콘텐츠 -->
    <template v-else>
      <!-- 프로필 요약 카드 -->
      <div
        class="hero-animate mb-8 flex items-center justify-between rounded-xl border border-border bg-bg-card px-8 py-10"
      >
        <div class="flex items-center gap-6">
          <DefaultAvatar :size="94" :image-url="user?.profileImageUrl" />
          <div>
            <h1 class="text-[26px] font-bold text-text">
              {{ user?.nickname ?? '사용자' }}
            </h1>
            <p class="mt-1 text-sm text-text-secondary">
              {{ user?.onboardingCompleted ? '프로필 완성됨' : '온보딩 미완료' }}
            </p>
          </div>
        </div>
        <button
          class="rounded-full bg-text px-6 py-3 text-sm font-bold text-white transition-transform hover:scale-105"
          @click="router.push('/profile/edit')"
        >
          프로필 수정
        </button>
      </div>

      <!-- 통계 카드 4개 -->
      <div class="mb-8 grid grid-cols-4 gap-4">
        <div
          v-for="(card, idx) in statCards"
          :key="card.label"
          class="stagger-item rounded-xl bg-bg-card px-6 py-6"
          :style="{ animationDelay: `${idx * 80}ms` }"
        >
          <p class="text-[13px] text-text-secondary">{{ card.label }}</p>
          <p class="mt-2 text-[26px] font-bold text-text">{{ card.value }}</p>
        </div>
      </div>

      <!-- 내 활동 -->
      <section>
        <h2 class="mb-4 text-[22px] font-bold text-text">내 활동</h2>

        <!-- 탭 -->
        <div class="mb-5 flex gap-2">
          <button
            :class="[
              'rounded-full px-5 py-2 text-xs font-bold transition-all',
              activeTab === 'applications'
                ? 'bg-text text-white'
                : 'border border-border bg-white text-text hover:bg-bg-muted',
            ]"
            @click="activeTab = 'applications'"
          >
            지원한 프로젝트
          </button>
          <button
            class="rounded-full border border-border bg-white px-5 py-2 text-xs font-bold text-text transition-all hover:bg-bg-muted"
            @click="router.push('/mypage/projects')"
          >
            내 모집글
          </button>
          <button
            class="rounded-full border border-border bg-white px-5 py-2 text-xs font-bold text-text transition-all hover:bg-bg-muted"
            @click="router.push('/mypage/bookmarks')"
          >
            관심 목록
          </button>
        </div>

        <!-- 지원한 프로젝트 탭 -->
        <div
          v-if="activeTab === 'applications'"
          class="rounded-xl border border-border bg-white p-6"
        >
          <div class="flex items-center justify-between">
            <h3 class="text-base font-bold text-text">최근 지원</h3>
            <button
              class="rounded-full border border-border bg-white px-4 py-2 text-xs font-bold text-text transition-all hover:bg-bg-muted active:scale-95"
              @click="router.push('/mypage/applications')"
            >
              모두 보기
            </button>
          </div>

          <div
            v-if="applications.length === 0"
            class="py-12 text-center text-sm text-text-secondary"
          >
            지원한 프로젝트가 없습니다.
          </div>

          <div v-else class="mt-4 flex flex-col">
            <div
              v-for="app in applications"
              :key="app.applicationId"
              class="flex cursor-pointer items-center rounded-lg bg-bg-card px-5 py-4 transition-all hover:bg-bg-muted active:scale-[0.99]"
              @click="router.push(`/projects/${app.projectId}`)"
            >
              <p class="flex-1 text-sm font-bold text-text">
                {{ app.projectTitle ?? `프로젝트 #${app.projectId}` }}
              </p>
              <span
                :class="[
                  'w-[90px] rounded-full py-1.5 text-center text-xs font-bold',
                  statusStyle(app.applicationStatus),
                ]"
              >
                {{ statusLabel(app.applicationStatus) }}
              </span>
              <span class="w-[100px] text-right text-[13px] text-text-secondary">
                {{ formatDate(app.appliedAt) }}
              </span>
            </div>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>
