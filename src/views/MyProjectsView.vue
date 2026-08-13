<!--
  @view MyProjectsView
  @description 내 모집글 전체 목록
  @route /mypage/projects
-->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore'
import { fetchMyProjects, type ProjectCard } from '@/api/mypage'
import { deleteProject } from '@/api/projects'

const router = useRouter()
const authStore = useAuthStore()

const loading = ref(true)
const projects = ref<ProjectCard[]>([])
const activeFilter = ref<string | undefined>(undefined)
const totalElements = ref(0)

async function loadData(status?: string) {
  loading.value = true
  try {
    const res = await fetchMyProjects({ status, size: 20 })
    projects.value = res.data.items
    totalElements.value = res.meta.totalElements
  } finally {
    loading.value = false
  }
}

function setFilter(status?: string) {
  activeFilter.value = status
  loadData(status)
}

onMounted(() => {
  if (!authStore.isLoggedIn) {
    router.push('/login')
    return
  }
  loadData()
})

function recruitStatusLabel(status: string) {
  const map: Record<string, string> = { RECRUITING: '모집중', CLOSED: '종료', DRAFT: '임시저장' }
  return map[status] ?? status
}

function recruitStatusStyle(status: string) {
  switch (status) {
    case 'RECRUITING':
      return 'bg-primary-dark text-text'
    case 'CLOSED':
      return 'bg-white border border-border text-text'
    default:
      return 'bg-bg-muted text-text'
  }
}

async function handleDeleteDraft(projectId: number) {
  deleteTargetId.value = projectId
  deleteModalOpen.value = true
}

const deleteModalOpen = ref(false)
const deleteTargetId = ref<number | null>(null)
const deleting = ref(false)

async function confirmDelete() {
  if (!deleteTargetId.value) return
  deleting.value = true
  try {
    await deleteProject(deleteTargetId.value, '임시저장 모집글 삭제')
    projects.value = projects.value.filter((p) => p.projectId !== deleteTargetId.value)
    deleteModalOpen.value = false
  } catch {
    deleteModalOpen.value = false
  } finally {
    deleting.value = false
    deleteTargetId.value = null
  }
}

const filters = [
  { label: '전체', value: undefined },
  { label: '임시저장', value: 'DRAFT' },
  { label: '모집중', value: 'RECRUITING' },
  { label: '종료', value: 'CLOSED' },
]
</script>

<template>
  <div class="mx-auto max-w-[1344px] px-6 py-10">
    <h1 class="hero-animate text-[30px] font-bold text-text">내 모집글</h1>
    <p class="hero-animate hero-animate-delay-1 mt-2 text-sm text-text-secondary">
      작성한 모집글과 지원 현황을 관리합니다.
    </p>

    <!-- 상태 필터 -->
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
        {{ f.label }}
      </button>
    </div>

    <!-- 로딩 -->
    <div v-if="loading" class="mt-6 space-y-3">
      <div v-for="i in 3" :key="i" class="skeleton-pulse h-[100px] rounded-xl bg-bg-card" />
    </div>

    <!-- 빈 상태 -->
    <div v-else-if="projects.length === 0" class="mt-12 text-center text-sm text-text-secondary">
      작성한 모집글이 없습니다.
    </div>

    <!-- 리스트 -->
    <div v-else class="mt-6 flex flex-col gap-3">
      <div
        v-for="proj in projects"
        :key="proj.projectId"
        class="flex cursor-pointer items-center justify-between rounded-xl border border-border bg-white px-6 py-5 transition-all hover:shadow-sm"
        @click="router.push(`/projects/${proj.projectId}`)"
      >
        <div class="flex-1">
          <p class="text-sm font-bold text-text">{{ proj.title }}</p>
          <p class="mt-1 text-[13px] text-text-secondary">
            <span v-for="(pos, i) in proj.positions" :key="pos.projectPositionId">
              {{ pos.positionTitle }} {{ pos.acceptedCount }}/{{ pos.requiredCount }}
              <span v-if="i < proj.positions.length - 1"> · </span>
            </span>
          </p>
        </div>
        <div class="flex items-center gap-3">
          <span
            :class="[
              'rounded-full px-4 py-1.5 text-xs font-bold',
              recruitStatusStyle(proj.recruitmentStatus),
            ]"
          >
            {{ recruitStatusLabel(proj.recruitmentStatus) }}
          </span>
          <!-- DRAFT: 이어쓰기 / 삭제 -->
          <template v-if="proj.recruitmentStatus === 'DRAFT'">
            <button
              class="rounded-full bg-text px-4 py-2 text-xs font-bold text-white transition-colors hover:opacity-80"
              @click.stop="router.push({ path: '/write', query: { draftId: proj.projectId } })"
            >
              이어쓰기
            </button>
            <button
              class="rounded-full border border-border bg-white px-4 py-2 text-xs font-bold text-text transition-colors hover:bg-bg-muted"
              @click.stop="handleDeleteDraft(proj.projectId)"
            >
              삭제
            </button>
          </template>
          <!-- RECRUITING / CLOSED: 지원자 관리 / 수정 -->
          <template v-else>
            <button
              class="rounded-full bg-text px-4 py-2 text-xs font-bold text-white transition-colors hover:opacity-80"
              @click.stop="router.push(`/projects/${proj.projectId}/applicants`)"
            >
              지원자 관리
            </button>
            <button
              class="rounded-full border border-text bg-white px-4 py-2 text-xs font-bold text-text transition-colors hover:bg-bg-muted"
              @click.stop="router.push(`/projects/${proj.projectId}/edit`)"
            >
              수정
            </button>
          </template>
        </div>
      </div>
    </div>

    <!-- 새 모집글 작성 -->
    <div class="mt-8 flex justify-end">
      <button
        class="rounded-full bg-primary px-6 py-3 text-sm font-bold text-text transition-transform hover:scale-105"
        @click="router.push('/write')"
      >
        새 모집글 작성
      </button>
    </div>

    <!-- 삭제 확인 모달 -->
    <Teleport to="body">
      <transition name="fade">
        <div
          v-if="deleteModalOpen"
          class="fixed inset-0 z-[100] flex items-center justify-center bg-black/40"
        >
          <div class="w-full max-w-[480px] rounded-xl bg-white px-8 py-8">
            <div
              class="flex h-[58px] w-[58px] items-center justify-center rounded-full border border-border"
            >
              <span class="text-xl font-bold text-text">?</span>
            </div>
            <h2 class="mt-6 text-xl font-bold text-text">임시저장 모집글을 삭제할까요?</h2>
            <p class="mt-3 text-sm text-text-secondary">삭제한 모집글은 복구할 수 없습니다.</p>
            <div class="mt-8 flex gap-4">
              <button
                class="h-[46px] flex-1 rounded-full border border-border bg-white text-sm font-bold text-text transition-all hover:bg-bg-muted"
                @click="deleteModalOpen = false"
              >
                취소
              </button>
              <button
                class="h-[46px] flex-1 rounded-full bg-text text-sm font-bold text-white transition-transform hover:scale-105 disabled:opacity-40"
                :disabled="deleting"
                @click="confirmDelete"
              >
                {{ deleting ? '삭제 중...' : '삭제' }}
              </button>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>
  </div>
</template>
