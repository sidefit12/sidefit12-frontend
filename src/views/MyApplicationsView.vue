<!--
  @view MyApplicationsView
  @description 내 지원 현황 전체 목록
  @route /mypage/applications
-->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore'
import { fetchMyApplications, cancelApplication, type ApplicationResource } from '@/api/mypage'

const router = useRouter()
const authStore = useAuthStore()

const loading = ref(true)
const applications = ref<ApplicationResource[]>([])
const statusCounts = ref<Record<string, number>>({})
const activeFilter = ref<string | undefined>(undefined)
const totalElements = ref(0)
const currentPage = ref(0)
const totalPages = ref(0)
const pageSize = 4

async function loadData(status?: string, page = 0) {
  loading.value = true
  try {
    const res = await fetchMyApplications({ status, size: pageSize, page })
    applications.value = res.data.items
    statusCounts.value = res.data.statusCounts
    totalElements.value = res.meta.totalElements
    totalPages.value = res.meta.totalPages
    currentPage.value = res.meta.page
  } finally {
    loading.value = false
  }
}

function setFilter(status?: string) {
  activeFilter.value = status
  loadData(status, 0)
}

function goToPage(page: number) {
  loadData(activeFilter.value, page)
}

async function handleCancel(applicationId: number) {
  if (!confirm('지원을 취소하시겠습니까?')) return
  try {
    await cancelApplication(applicationId)
    loadData(activeFilter.value, currentPage.value)
  } catch {
    alert('지원 취소에 실패했습니다.')
  }
}

onMounted(() => {
  if (!authStore.isLoggedIn) {
    router.push('/login')
    return
  }
  loadData()
})

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

const filters = [
  { label: '전체', value: undefined },
  { label: '대기', value: 'PENDING' },
  { label: '승인', value: 'ACCEPTED' },
  { label: '거절', value: 'REJECTED' },
  { label: '취소', value: 'CANCELED' },
]
</script>

<template>
  <div class="mx-auto max-w-[1344px] px-6 py-10">
    <h1 class="hero-animate text-[30px] font-bold text-text">내 지원 현황</h1>
    <p class="hero-animate hero-animate-delay-1 mt-2 text-sm text-text-secondary">
      지원한 프로젝트와 처리 상태를 확인합니다.
    </p>

    <!-- 상태 필터 탭 -->
    <div class="mt-6 flex gap-2">
      <button
        v-for="f in filters"
        :key="f.label"
        :class="[
          'rounded-full px-4 py-2 text-xs font-bold transition-all',
          activeFilter === f.value
            ? 'bg-text text-white'
            : 'border border-border bg-white text-text hover:bg-bg-muted',
        ]"
        @click="setFilter(f.value)"
      >
        {{ f.label }} {{ f.value ? (statusCounts[f.value] ?? 0) : totalElements }}
      </button>
    </div>

    <!-- 로딩 -->
    <div v-if="loading" class="mt-6 space-y-3">
      <div v-for="i in 4" :key="i" class="skeleton-pulse h-[80px] rounded-xl bg-bg-card" />
    </div>

    <!-- 리스트 -->
    <div
      v-else-if="applications.length === 0"
      class="mt-12 text-center text-sm text-text-secondary"
    >
      지원한 프로젝트가 없습니다.
    </div>

    <div v-else class="mt-6 flex flex-col gap-3">
      <div
        v-for="app in applications"
        :key="app.applicationId"
        class="flex cursor-pointer items-center justify-between rounded-xl border border-border bg-white px-6 py-5 transition-all hover:shadow-sm active:scale-[0.99]"
        @click="router.push(`/projects/${app.projectId}`)"
      >
        <div class="flex-1">
          <p class="text-sm font-bold text-text">
            {{ app.projectTitle ?? `프로젝트 #${app.projectId}` }}
          </p>
          <p class="mt-1 text-[13px] text-text-secondary">지원 {{ formatDate(app.appliedAt) }}</p>
        </div>
        <div class="flex items-center gap-3">
          <span
            :class="[
              'rounded-full px-4 py-1.5 text-xs font-bold',
              statusStyle(app.applicationStatus),
            ]"
          >
            {{ statusLabel(app.applicationStatus) }}
          </span>
          <button
            v-if="app.applicationStatus === 'PENDING'"
            class="rounded-full bg-text px-5 py-2 text-xs font-bold text-white transition-colors hover:opacity-80"
            @click.stop="handleCancel(app.applicationId)"
          >
            지원 취소
          </button>
          <button
            v-else-if="app.applicationStatus === 'ACCEPTED'"
            class="rounded-full border border-text bg-white px-5 py-2 text-xs font-bold text-text transition-colors hover:bg-bg-muted"
            @click.stop="router.push(`/projects/${app.projectId}`)"
          >
            팀원 보기
          </button>
          <button
            v-else
            class="rounded-full border border-text bg-white px-5 py-2 text-xs font-bold text-text transition-colors hover:bg-bg-muted"
            @click.stop="router.push(`/projects/${app.projectId}`)"
          >
            상세 보기
          </button>
        </div>
      </div>
    </div>

    <!-- 페이지네이션 -->
    <div v-if="totalPages > 1" class="mt-8 flex items-center justify-center gap-2">
      <button
        v-for="page in totalPages"
        :key="page"
        :class="[
          'flex size-9 items-center justify-center rounded-full text-xs font-bold transition-all',
          currentPage === page - 1
            ? 'bg-text text-white'
            : 'border border-border bg-white text-text hover:bg-bg-muted',
        ]"
        @click="goToPage(page - 1)"
      >
        {{ page }}
      </button>
    </div>
  </div>
</template>
