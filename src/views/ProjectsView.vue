<!--
  @component ProjectsView
  @description 프로젝트 목록·검색·필터 화면.
  좌측 필터 사이드바 + 우측 프로젝트 카드 리스트.
-->
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { fetchProjects, type ProjectListParams } from '@/api/projects'
import { fetchTopics, fetchRoles, type TopicItem, type RoleItem } from '@/api/reference'
import type { ProjectCard as ProjectCardType } from '@/api/home'
import TechStackChip from '@/components/TechStackChip.vue'
import { type TechStackName } from '@/constants/techStacks'

/* ────── 상태 ────── */
const loading = ref(true)
const projects = ref<ProjectCardType[]>([])
const totalCount = ref(0)
const hasNext = ref(false)
const currentPage = ref(0)

// 필터
const keyword = ref('')
const selectedTopics = ref<string[]>([])
const selectedRoles = ref<string[]>([])
const selectedWorkType = ref<string | undefined>(undefined)
const sort = ref<'LATEST' | 'DEADLINE' | 'RECOMMENDED'>('LATEST')
const sortOpen = ref(false)

const sortOptions = [
  { value: 'LATEST' as const, label: '최신순' },
  { value: 'DEADLINE' as const, label: '마감순' },
  { value: 'RECOMMENDED' as const, label: '추천순' },
]

const sortLabel = computed(() => {
  return sortOptions.find((o) => o.value === sort.value)?.label ?? '최신순'
})

/** 필터가 적용된 상태인지 */
const hasServerFilters = computed(
  () => selectedTopics.value.length > 0 || selectedRoles.value.length > 0,
)

/** 진행 방식 프론트 필터링 + 정렬 */
const displayedProjects = computed(() => {
  let result = projects.value

  // 진행 방식 프론트 필터링
  if (selectedWorkType.value) {
    result = result.filter((p) => p.workType === selectedWorkType.value)
  }

  // 프론트 정렬 (필터 미적용 시)
  if (!hasServerFilters.value) {
    if (sort.value === 'DEADLINE') {
      result = [...result].sort(
        (a, b) =>
          new Date(a.recruitmentDeadline).getTime() - new Date(b.recruitmentDeadline).getTime(),
      )
    } else if (sort.value === 'LATEST') {
      result = [...result].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
    }
  }

  return result
})

/* ────── 데이터 조회 ────── */
async function loadProjects(reset = true) {
  if (reset) {
    currentPage.value = 0
  }
  loading.value = true

  const params: ProjectListParams = {
    page: currentPage.value,
    size: 20,
    sort: sort.value,
    recruitmentStatus: 'RECRUITING',
  }

  if (keyword.value.trim().length >= 2) {
    params.keyword = keyword.value.trim()
  }
  if (selectedTopics.value.length) {
    params.topicIds = selectedTopics.value.join(',')
  }
  if (selectedRoles.value.length) {
    params.roleIds = selectedRoles.value.join(',')
  }

  try {
    const res = await fetchProjects(params)
    if (reset) {
      projects.value = res.data.items
    } else {
      projects.value.push(...res.data.items)
    }
    totalCount.value = res.meta.totalElements
    hasNext.value = res.meta.hasNext
  } catch {
    if (reset) {
      projects.value = []
      totalCount.value = 0
    }
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  loadProjects()
}

function handleSortChange(newSort: 'LATEST' | 'DEADLINE' | 'RECOMMENDED') {
  sort.value = newSort
  sortOpen.value = false
  // 필터 적용 상태면 API 재호출, 아니면 프론트 정렬
  if (hasServerFilters.value) {
    loadProjects()
  }
}

function clearFilters() {
  keyword.value = ''
  selectedTopics.value = []
  selectedRoles.value = []
  selectedWorkType.value = undefined
  sort.value = 'LATEST'
  loadProjects()
}

function toggleWorkType(type: string) {
  selectedWorkType.value = selectedWorkType.value === type ? undefined : type
}

function loadMore() {
  currentPage.value++
  loadProjects(false)
}

onMounted(() => {
  loadProjects()
  loadFilters()
})

/* ────── 기준정보 로드 ────── */
const topicFilters = ref<TopicItem[]>([])
const roleFilters = ref<RoleItem[]>([])

async function loadFilters() {
  try {
    const [topicsRes, rolesRes] = await Promise.all([fetchTopics(), fetchRoles()])
    topicFilters.value = topicsRes.data.items
    roleFilters.value = rolesRes.data.items
  } catch {
    // 실패해도 필터 없이 동작
  }
}

const workTypeFilters = [
  { value: 'ONLINE', label: '온라인' },
  { value: 'OFFLINE', label: '오프라인' },
  { value: 'HYBRID', label: '병행' },
]

/** 진행 방식 한글 변환 */
function workTypeLabel(workType: string): string {
  const map: Record<string, string> = {
    ONLINE: '온라인',
    OFFLINE: '오프라인',
    HYBRID: '온·오프라인',
  }
  return map[workType] ?? workType
}

/** 마감일 표시 */
function deadlineLabel(deadline: string): string {
  const d = new Date(deadline)
  return `${d.getMonth() + 1}월 ${d.getDate()}일 마감`
}

/** 포지션 요약 */
function positionSummary(project: ProjectCardType): string {
  return project.positions
    .map((p) => `${p.role.roleName} ${p.acceptedCount}/${p.requiredCount}`)
    .join(' · ')
}
</script>

<template>
  <div class="mx-auto max-w-[1440px] px-12 pb-16 pt-8">
    <!-- 헤더 -->
    <h1 class="text-[30px] font-bold text-text">프로젝트 찾기</h1>
    <p class="mt-2 text-sm text-text-secondary">
      모집 중인 {{ displayedProjects.length }}개의 프로젝트
    </p>

    <!-- 결과 없을 때: 모든 필터/검색바 숨기고 중앙에만 표시 -->
    <template v-if="!loading && displayedProjects.length === 0 && projects.length === 0">
      <div class="flex min-h-[calc(100vh-200px)] items-center justify-center">
        <div
          class="hero-animate flex w-[780px] flex-col items-center rounded-xl border border-border bg-white py-20"
        >
          <div
            class="check-bounce flex size-[80px] items-center justify-center rounded-full bg-[#d43f21]"
          >
            <span class="text-3xl text-white">—</span>
          </div>
          <h3 class="hero-animate hero-animate-delay-1 mt-8 text-xl font-bold text-text">
            조건에 맞는 프로젝트가 없어요
          </h3>
          <p class="hero-animate hero-animate-delay-2 mt-3 text-sm text-text-secondary">
            선택한 필터를 줄이거나 검색어를 바꿔 보세요.
          </p>
          <button
            class="hero-animate hero-animate-delay-3 mt-8 flex h-[46px] items-center justify-center rounded-full bg-text px-8 text-sm font-bold text-white transition-transform hover:scale-105"
            @click="clearFilters"
          >
            필터 초기화
          </button>
        </div>
      </div>
    </template>

    <!-- 결과 있을 때: 검색바 + 필터 + 리스트 -->
    <template v-else>
      <!-- 검색바 -->
      <div class="mt-5 flex h-14 items-center rounded-lg border border-border bg-white">
        <input
          v-model="keyword"
          type="text"
          placeholder="제목, 설명, 토픽, 기술 스택 검색"
          class="h-full flex-1 rounded-l-lg px-5 text-sm text-text placeholder:text-[#8d8d8d] focus:outline-none"
          @keydown.enter="handleSearch"
        />
        <button
          class="flex h-full w-[118px] items-center justify-center rounded-r-lg bg-text text-sm font-bold text-white"
          @click="handleSearch"
        >
          검색
        </button>
      </div>

      <!-- 필터 칩 + 정렬 -->
      <div class="mt-5 flex items-center justify-between">
        <div class="flex flex-wrap gap-2">
          <button
            v-for="wt in workTypeFilters"
            :key="wt.value"
            :class="[
              'rounded-full border px-4 py-2 text-xs font-bold transition-all',
              selectedWorkType === wt.value
                ? 'border-text bg-text text-white'
                : 'border-border bg-white text-text hover:border-text',
            ]"
            @click="toggleWorkType(wt.value)"
          >
            {{ wt.label }}
          </button>
        </div>
        <!-- 정렬 드롭다운 -->
        <div class="relative shrink-0">
          <button class="text-sm font-bold text-text" @click="sortOpen = !sortOpen">
            {{ sortLabel }} <span class="text-text-secondary">⌄</span>
          </button>
          <transition name="dropdown">
            <div
              v-if="sortOpen"
              class="absolute right-0 top-8 z-50 w-[120px] rounded-lg border border-border bg-white py-1 shadow-lg"
            >
              <button
                v-for="option in sortOptions"
                :key="option.value"
                class="flex w-full items-center px-4 py-2 text-sm hover:bg-bg-muted"
                :class="sort === option.value ? 'font-bold text-text' : 'text-text-secondary'"
                @click="handleSortChange(option.value)"
              >
                {{ option.label }}
              </button>
            </div>
          </transition>
          <div v-if="sortOpen" class="fixed inset-0 z-40" @click="sortOpen = false" />
        </div>
      </div>

      <!-- 메인 콘텐츠 -->
      <div class="mt-6">
        <!-- 결과 있거나 로딩 중: 사이드바 + 리스트 -->
        <div v-if="loading || displayedProjects.length" class="flex gap-6">
          <!-- 좌측 필터 사이드바 -->
          <aside class="hidden w-[250px] shrink-0 lg:block">
            <div class="rounded-xl border border-border bg-white p-5">
              <h3 class="text-base font-bold text-text">필터</h3>

              <!-- 관심 토픽 -->
              <div class="mt-5">
                <p class="text-[13px] font-bold text-text-secondary">관심 토픽</p>
                <div class="mt-3 space-y-2">
                  <label
                    v-for="topic in topicFilters"
                    :key="topic.topicId"
                    class="flex cursor-pointer items-center gap-2 text-sm text-text"
                  >
                    <input
                      v-model="selectedTopics"
                      type="checkbox"
                      :value="String(topic.topicId)"
                      class="size-4 accent-text"
                    />
                    {{ topic.topicName }}
                  </label>
                </div>
              </div>

              <!-- 희망 역할 -->
              <div class="mt-6">
                <p class="text-[13px] font-bold text-text-secondary">희망 역할</p>
                <div class="mt-3 space-y-2">
                  <label
                    v-for="role in roleFilters"
                    :key="role.roleId"
                    class="flex cursor-pointer items-center gap-2 text-sm text-text"
                  >
                    <input
                      v-model="selectedRoles"
                      type="checkbox"
                      :value="String(role.roleId)"
                      class="size-4 accent-text"
                    />
                    {{ role.roleName }}
                  </label>
                </div>
              </div>

              <!-- 필터 적용 -->
              <button
                class="mt-8 flex h-[46px] w-full items-center justify-center rounded-full border border-border text-sm font-bold text-text transition-transform hover:scale-105"
                @click="loadProjects()"
              >
                필터 적용
              </button>
            </div>
          </aside>

          <!-- 우측 프로젝트 리스트 -->
          <div class="flex-1">
            <!-- 로딩 스켈레톤 -->
            <div v-if="loading && projects.length === 0" class="space-y-5">
              <div v-for="i in 3" :key="i" class="h-[200px] rounded-xl bg-border skeleton-pulse" />
            </div>

            <!-- 프로젝트 카드 -->
            <div v-else-if="displayedProjects.length" class="space-y-5">
              <router-link
                v-for="project in displayedProjects"
                :key="project.projectId"
                :to="`/projects/${project.projectId}`"
                class="stagger-item block rounded-xl border border-border bg-white p-6 transition-all hover:border-text hover:shadow-sm"
              >
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-text">모집중</span>
                </div>
                <div class="mt-1 h-[3px] w-[58px] rounded-full bg-primary-dark" />
                <h3 class="mt-3 text-lg font-bold text-text">{{ project.title }}</h3>
                <p class="mt-2 text-[13px] text-text-secondary">
                  {{ workTypeLabel(project.workType) }} ·
                  {{ deadlineLabel(project.recruitmentDeadline) }}
                </p>
                <div class="mt-3 flex flex-wrap items-center gap-2">
                  <span
                    v-for="topic in project.topics"
                    :key="topic.topicId"
                    class="flex h-10 items-center rounded-full border border-border px-3 py-2.5 text-xs font-bold text-text"
                  >
                    {{ topic.topicName }}
                  </span>
                  <TechStackChip
                    v-for="tech in project.techStacks"
                    :key="tech.techStackId"
                    :name="tech.techStackName as TechStackName"
                    theme="light"
                  />
                </div>
                <p class="mt-3 text-[13px] font-bold text-text">
                  {{ positionSummary(project) }}
                </p>
              </router-link>

              <!-- 더 보기 -->
              <div v-if="hasNext" class="flex justify-center pt-4">
                <button
                  class="flex h-[46px] items-center justify-center rounded-full border border-border px-8 text-sm font-bold text-text transition-transform hover:scale-105"
                  :disabled="loading"
                  @click="loadMore"
                >
                  {{ loading ? '로딩 중...' : '더 보기' }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 빈 상태: 필터 없이 전체 폭 -->
        <div v-else class="flex flex-col items-center py-20">
          <div
            class="check-bounce flex size-[80px] items-center justify-center rounded-full bg-[#d43f21]"
          >
            <span class="text-3xl text-white">—</span>
          </div>
          <h3 class="hero-animate hero-animate-delay-1 mt-8 text-xl font-bold text-text">
            조건에 맞는 프로젝트가 없어요
          </h3>
          <p class="hero-animate hero-animate-delay-2 mt-3 text-sm text-text-secondary">
            선택한 필터를 줄이거나 검색어를 바꿔 보세요.
          </p>
          <button
            class="hero-animate hero-animate-delay-3 mt-8 flex h-[46px] items-center justify-center rounded-full bg-text px-8 text-sm font-bold text-white transition-transform hover:scale-105"
            @click="clearFilters"
          >
            필터 초기화
          </button>
        </div>
      </div>
    </template>
  </div>
</template>
