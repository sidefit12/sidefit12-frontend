<!--
  @view ApplicantManageView
  @description 프로젝트 지원자 관리 - 통계 + 필터 + 리스트
  @route /projects/:id/applicants
-->
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore'
import DefaultAvatar from '@/components/DefaultAvatar.vue'
import apiClient from '@/api/client'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const projectId = computed(() => Number(route.params.id))

/* ────── 상태 ────── */
const loading = ref(true)
interface ApplicantItem {
  applicationId: number
  projectId: number
  projectPositionId: number
  positionTitle?: string
  applicationMessage: string | null
  applicationStatus: string
  appliedAt: string
  applicant: {
    userId: number
    nickname: string
    techStacks?: string[]
  }
}

const applications = ref<ApplicantItem[]>([])
const statusCounts = ref<Record<string, number>>({})
const totalElements = ref(0)
const currentPage = ref(0)
const totalPages = ref(0)

// 필터
const statusFilter = ref<string | undefined>(undefined)
const statusSelectFilter = ref<string | undefined>(undefined)
const positionFilter = ref<string | undefined>(undefined)
const positions = ref<{ projectPositionId: number; positionTitle: string }[]>([])

// 드롭다운 상태
const positionDropdownOpen = ref(false)
const statusDropdownOpen = ref(false)

const statusOptions = [
  { value: 'PENDING', label: '대기' },
  { value: 'ACCEPTED', label: '승인' },
  { value: 'REJECTED', label: '거절' },
]

const positionFilterLabel = computed(() => {
  if (!positionFilter.value) return '역할 전체'
  return (
    positions.value.find((p) => String(p.projectPositionId) === positionFilter.value)
      ?.positionTitle ?? '역할 전체'
  )
})

const statusFilterLabel = computed(() => {
  if (!statusSelectFilter.value) return '상태 전체'
  return statusOptions.find((s) => s.value === statusSelectFilter.value)?.label ?? '상태 전체'
})

/* ────── 데이터 로드 ────── */
async function loadData(status?: string, positionId?: string, page = 0) {
  loading.value = true
  try {
    const params: Record<string, string | number> = { size: 20, page }
    if (status) params.status = status
    if (positionId) params.projectPositionId = positionId
    const { data } = await apiClient.get(`/api/v1/projects/${projectId.value}/applications`, {
      params,
    })
    applications.value = data.data.items
    statusCounts.value = data.data.statusCounts
    totalElements.value = data.meta.totalElements
    totalPages.value = data.meta.totalPages
    currentPage.value = data.meta.page

    // 포지션 목록 추출 (중복 제거)
    if (positions.value.length === 0 && data.data.items.length > 0) {
      const seen = new Set<number>()
      for (const app of data.data.items) {
        if (!seen.has(app.projectPositionId)) {
          seen.add(app.projectPositionId)
          positions.value.push({
            projectPositionId: app.projectPositionId,
            positionTitle: app.positionTitle ?? `포지션 #${app.projectPositionId}`,
          })
        }
      }
    }
  } catch {
    applications.value = []
  } finally {
    loading.value = false
  }
}

function setStatusFilter(status?: string) {
  statusFilter.value = status
  statusSelectFilter.value = status
  loadData(status, positionFilter.value, 0)
}

function goToPage(page: number) {
  loadData(statusFilter.value, positionFilter.value, page)
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
    PENDING: '대기',
    ACCEPTED: '승인',
    REJECTED: '거절',
    CANCELED: '취소',
  }
  return map[status] ?? status
}

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/* ────── 통계 카드 ────── */
const statCards = computed(() => [
  { label: '전체', value: totalElements.value, filter: undefined },
  { label: '대기', value: statusCounts.value['PENDING'] ?? 0, filter: 'PENDING' },
  { label: '승인', value: statusCounts.value['ACCEPTED'] ?? 0, filter: 'ACCEPTED' },
  { label: '거절', value: statusCounts.value['REJECTED'] ?? 0, filter: 'REJECTED' },
])
</script>

<template>
  <div class="mx-auto max-w-[1344px] px-6 py-10">
    <h1 class="hero-animate text-[30px] font-bold text-text">지원자 관리</h1>
    <p class="hero-animate hero-animate-delay-1 mt-2 text-sm text-text-secondary">
      내가 작성한 모집글의 지원 현황을 관리합니다.
    </p>

    <!-- 통계 카드 -->
    <div class="mt-6 grid grid-cols-4 gap-4">
      <button
        v-for="card in statCards"
        :key="card.label"
        :class="[
          'rounded-xl px-5 py-4 text-left transition-all',
          statusFilter === card.filter
            ? 'bg-bg-card ring-1 ring-text'
            : 'bg-bg-card hover:ring-1 hover:ring-border',
        ]"
        @click="setStatusFilter(card.filter)"
      >
        <p class="text-[13px] text-text-secondary">{{ card.label }}</p>
        <p class="mt-1 text-[22px] font-bold text-text">{{ card.value }}</p>
      </button>
    </div>

    <!-- 필터 + 정렬 -->
    <div class="mt-6 flex items-center gap-3">
      <!-- 역할 필터 -->
      <div class="relative">
        <button
          class="flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1.5 text-xs font-bold text-text"
          @click="positionDropdownOpen = !positionDropdownOpen"
        >
          {{ positionFilterLabel }}
          <span class="text-[10px]">⌄</span>
        </button>
        <transition name="dropdown">
          <div
            v-if="positionDropdownOpen"
            class="absolute left-0 top-[36px] z-50 min-w-[140px] rounded-lg border border-border bg-white py-1 shadow-lg"
          >
            <button
              class="block w-full px-4 py-2 text-left text-xs text-text hover:bg-bg-muted"
              @click="
                positionFilter = undefined
                positionDropdownOpen = false
                loadData(statusFilter)
              "
            >
              역할 전체
            </button>
            <button
              v-for="pos in positions"
              :key="pos.projectPositionId"
              class="block w-full px-4 py-2 text-left text-xs text-text hover:bg-bg-muted"
              @click="
                positionFilter = String(pos.projectPositionId)
                positionDropdownOpen = false
                loadData(statusFilter, String(pos.projectPositionId))
              "
            >
              {{ pos.positionTitle }}
            </button>
          </div>
        </transition>
        <div
          v-if="positionDropdownOpen"
          class="fixed inset-0 z-40"
          @click="positionDropdownOpen = false"
        />
      </div>

      <!-- 상태 필터 -->
      <div class="relative">
        <button
          class="flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1.5 text-xs font-bold text-text"
          @click="statusDropdownOpen = !statusDropdownOpen"
        >
          {{ statusFilterLabel }}
          <span class="text-[10px]">⌄</span>
        </button>
        <transition name="dropdown">
          <div
            v-if="statusDropdownOpen"
            class="absolute left-0 top-[36px] z-50 min-w-[120px] rounded-lg border border-border bg-white py-1 shadow-lg"
          >
            <button
              class="block w-full px-4 py-2 text-left text-xs text-text hover:bg-bg-muted"
              @click="
                statusSelectFilter = undefined
                statusDropdownOpen = false
                setStatusFilter(undefined)
              "
            >
              상태 전체
            </button>
            <button
              v-for="s in statusOptions"
              :key="s.value"
              class="block w-full px-4 py-2 text-left text-xs text-text hover:bg-bg-muted"
              @click="
                statusSelectFilter = s.value
                statusDropdownOpen = false
                setStatusFilter(s.value)
              "
            >
              {{ s.label }}
            </button>
          </div>
        </transition>
        <div
          v-if="statusDropdownOpen"
          class="fixed inset-0 z-40"
          @click="statusDropdownOpen = false"
        />
      </div>
    </div>

    <!-- 안내 -->
    <p class="mt-4 text-[13px] text-text-secondary">
      검토에서 지원서 상세를 확인하고 승인·거절합니다.
    </p>

    <!-- 로딩 -->
    <div v-if="loading" class="mt-6 space-y-3">
      <div v-for="i in 4" :key="i" class="skeleton-pulse h-[100px] rounded-xl bg-bg-card" />
    </div>

    <!-- 빈 상태 -->
    <div
      v-else-if="applications.length === 0"
      class="mt-12 text-center text-sm text-text-secondary"
    >
      지원자가 없습니다.
    </div>

    <!-- 테이블 리스트 -->
    <div v-else class="mt-6">
      <!-- 헤더 -->
      <div
        class="flex items-center rounded-lg border border-border bg-white py-3 pl-6 pr-[91px] text-[13px] font-bold text-text"
      >
        <span class="w-[400px]">지원자</span>
        <span class="w-[208px]">지원 역할</span>
        <span class="w-[182px] pl-[16px]">상태</span>
        <span class="flex-1 pl-[50px]">지원 일시</span>
        <span class="w-[80px] text-center">관리</span>
      </div>

      <!-- 행 목록 -->
      <div class="mt-3 flex flex-col gap-4">
        <div
          v-for="(app, idx) in applications"
          :key="app.applicationId"
          class="stagger-item flex items-center rounded-lg border border-border bg-white py-4 pl-6 pr-[91px]"
          :style="{ animationDelay: `${idx * 60}ms` }"
        >
          <!-- 지원자 -->
          <div class="flex w-[400px] items-center gap-3">
            <DefaultAvatar :size="48" />
            <div>
              <p class="text-sm font-bold text-text">{{ app.applicant.nickname }}</p>
              <p
                v-if="app.applicant.techStacks?.length"
                class="mt-0.5 text-[13px] text-text-secondary"
              >
                {{ app.applicant.techStacks.slice(0, 3).join(' · ')
                }}<span v-if="app.applicant.techStacks.length > 3" class="ml-[5px]"
                  >+{{ app.applicant.techStacks.length - 3 }}</span
                >
              </p>
            </div>
          </div>

          <!-- 지원 역할 -->
          <span class="w-[208px] -ml-[8px] text-sm text-text">
            {{ app.positionTitle ?? `포지션 #${app.projectPositionId}` }}
          </span>

          <!-- 상태 -->
          <div class="w-[182px] pl-[10px]">
            <span
              :class="[
                'inline-block rounded-full px-4 py-1.5 text-center text-xs font-bold',
                statusStyle(app.applicationStatus),
              ]"
            >
              {{ statusLabel(app.applicationStatus) }}
            </span>
          </div>

          <!-- 지원 일시 -->
          <span class="flex-1 pl-[45px] text-[13px] text-text-secondary">
            {{ formatDate(app.appliedAt) }}
          </span>

          <!-- 검토 버튼 -->
          <div class="w-[80px] flex justify-center">
            <button
              v-if="app.applicationStatus === 'PENDING'"
              class="rounded-full bg-text px-6 py-2.5 text-sm font-bold text-white transition-colors hover:opacity-80"
              @click="router.push(`/projects/${projectId}/applicants/${app.applicationId}`)"
            >
              검토
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
  </div>
</template>
