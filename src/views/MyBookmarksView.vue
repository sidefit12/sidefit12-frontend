<!--
  @view MyBookmarksView
  @description 관심 프로젝트 전체 목록 (카드 그리드)
  @route /mypage/bookmarks
-->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore'
import { fetchMyBookmarks, type ProjectCard } from '@/api/mypage'
import TechStackChip from '@/components/TechStackChip.vue'
import { type TechStackName } from '@/constants/techStacks'

const router = useRouter()
const authStore = useAuthStore()

const loading = ref(true)
const bookmarks = ref<ProjectCard[]>([])
const activeFilter = ref<string | undefined>(undefined)
const totalElements = ref(0)

async function loadData() {
  loading.value = true
  try {
    const res = await fetchMyBookmarks({ size: 20 })
    bookmarks.value = res.data.items
    totalElements.value = res.meta.totalElements
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

const filteredBookmarks = ref<ProjectCard[]>([])

function setFilter(status?: string) {
  activeFilter.value = status
  if (!status) {
    filteredBookmarks.value = bookmarks.value
  } else {
    filteredBookmarks.value = bookmarks.value.filter((b) => b.recruitmentStatus === status)
  }
}

// 최초 로드 후 필터 적용
onMounted(() => {
  const unwatch = ref<ReturnType<typeof setTimeout>>()
  unwatch.value = setInterval(() => {
    if (!loading.value) {
      filteredBookmarks.value = bookmarks.value
      clearInterval(unwatch.value)
    }
  }, 100)
})

function recruitStatusLabel(status: string) {
  const map: Record<string, string> = { RECRUITING: '모집중', CLOSED: '마감', DRAFT: '임시저장' }
  return map[status] ?? status
}

function workTypeLabel(workType: string): string {
  const map: Record<string, string> = { ONLINE: '온라인', OFFLINE: '오프라인', HYBRID: '병행' }
  return map[workType] ?? workType
}

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}월 ${d.getDate()}일 마감`
}

const filters = [
  { label: '전체', value: undefined },
  { label: '모집중', value: 'RECRUITING' },
  { label: '마감', value: 'CLOSED' },
]
</script>

<template>
  <div class="mx-auto max-w-[1344px] px-6 py-10">
    <h1 class="hero-animate text-[30px] font-bold text-text">관심 프로젝트</h1>
    <p class="hero-animate hero-animate-delay-1 mt-2 text-sm text-text-secondary">
      저장한 모집글 {{ totalElements }}개 · 최신 저장순
    </p>

    <!-- 필터 -->
    <div class="mt-6 flex items-center gap-2">
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
        {{ f.label }}
      </button>
    </div>

    <!-- 로딩 -->
    <div v-if="loading" class="mt-6 grid grid-cols-3 gap-4">
      <div v-for="i in 6" :key="i" class="skeleton-pulse h-[214px] rounded-xl bg-bg-card" />
    </div>

    <!-- 빈 상태 -->
    <div
      v-else-if="filteredBookmarks.length === 0"
      class="mt-12 text-center text-sm text-text-secondary"
    >
      저장한 프로젝트가 없습니다.
    </div>

    <!-- 카드 그리드 -->
    <div v-else class="mt-6 grid grid-cols-3 gap-4">
      <div
        v-for="(bm, idx) in filteredBookmarks"
        :key="bm.projectId"
        class="stagger-item cursor-pointer rounded-xl border border-border bg-white p-5 transition-all hover:shadow-md active:scale-[0.98]"
        :style="{ animationDelay: `${idx * 60}ms` }"
        @click="router.push(`/projects/${bm.projectId}`)"
      >
        <span class="text-[12px] font-bold text-text">
          {{ recruitStatusLabel(bm.recruitmentStatus) }}
        </span>
        <div class="mt-1.5 h-[3px] w-[58px] rounded-full bg-primary-dark" />
        <h4 class="mt-3 text-sm font-bold leading-snug text-text line-clamp-2">
          {{ bm.title }}
        </h4>
        <p class="mt-2 text-[13px] text-text-secondary">
          {{ workTypeLabel(bm.workType) }} · {{ formatDate(bm.recruitmentDeadline) }}
        </p>
        <div v-if="bm.techStacks.length" class="mt-3 flex flex-wrap gap-1.5">
          <TechStackChip
            v-for="ts in bm.techStacks.slice(0, 3)"
            :key="ts.techStackId"
            :name="ts.techStackName as TechStackName"
            theme="light"
          />
        </div>
        <p v-if="bm.positions.length" class="mt-3 text-[13px] font-bold text-text">
          <span v-for="(pos, i) in bm.positions" :key="pos.projectPositionId">
            {{ pos.role.roleName }} {{ pos.acceptedCount }}/{{ pos.requiredCount }}
            <span v-if="i < bm.positions.length - 1"> · </span>
          </span>
        </p>
      </div>
    </div>
  </div>
</template>
