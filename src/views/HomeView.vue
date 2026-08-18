<!--
  @component HomeView
  @description 홈 페이지. API에서 추천 프로젝트와 최신 모집글을 가져와 표시한다.
-->
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import {
  fetchHome,
  type HomeData,
  type RecommendationItem,
  type ProjectCard as ProjectCardType,
} from '@/api/home'
import ProjectCard from '@/components/ProjectCard.vue'

const homeData = ref<HomeData | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

onMounted(async () => {
  try {
    const res = await fetchHome(6)
    if (res.success) {
      homeData.value = res.data
    }
  } catch (e: unknown) {
    error.value = '홈 화면 정보를 불러오지 못했어요.'
    console.error(e)
  } finally {
    loading.value = false
  }
})

const recommendations = computed<RecommendationItem[]>(() => homeData.value?.recommendations ?? [])

const latestProjects = computed<ProjectCardType[]>(() => homeData.value?.latestProjects ?? [])

/** 추천 점수를 퍼센트로 변환 */
function scoreToPercent(score: number): number {
  return Math.round(score * 100)
}

/** 포지션 요약 텍스트 생성 */
function positionSummary(project: ProjectCardType): string {
  return project.positions
    .map((p) => `${p.role.roleName} ${p.acceptedCount}/${p.requiredCount}`)
    .join(' · ')
}

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
</script>

<template>
  <div class="mx-auto max-w-[1440px] px-12 pb-16">
    <!-- Hero Banner -->
    <section class="mt-7 rounded-none bg-text px-7 pb-8 pt-7 overflow-hidden">
      <span
        class="hero-animate inline-block rounded-full bg-primary-dark px-4 py-2 text-xs font-bold text-text"
      >
        PERSONALIZED DISCOVERY
      </span>

      <h1
        class="hero-animate hero-animate-delay-1 mt-5 text-[38px] font-bold leading-tight text-white"
      >
        나와 잘 맞는 프로젝트를<br />
        더 빠르게 발견하세요.
      </h1>

      <p class="hero-animate hero-animate-delay-2 mt-4 text-[15px] text-[#ccc]">
        관심 토픽·기술·희망 역할을 기준으로 추천 이유까지 확인하세요.
      </p>
    </section>

    <!-- 로딩 -->
    <div v-if="loading" class="mt-10 space-y-5">
      <div class="h-6 w-48 rounded bg-border skeleton-pulse" />
      <div class="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        <div v-for="i in 3" :key="i" class="h-[200px] rounded-xl bg-border skeleton-pulse" />
      </div>
    </div>

    <!-- 에러 -->
    <div v-else-if="error" class="mt-10 text-center text-[#d43f21]">
      {{ error }}
    </div>

    <!-- 콘텐츠 -->
    <template v-else>
      <!-- 추천 섹션 -->
      <section class="mt-10">
        <div class="mb-5 flex items-end justify-between">
          <h2 class="text-2xl font-bold text-text">회원님을 위한 추천</h2>
        </div>

        <div
          v-if="recommendations.length"
          class="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3"
        >
          <ProjectCard
            v-for="rec in recommendations.slice(0, 3)"
            :key="rec.project.projectId"
            class="stagger-item"
            :title="rec.project.title"
            :match-rate="scoreToPercent(rec.finalScore)"
            :condition="`${workTypeLabel(rec.project.workType)} · ${deadlineLabel(rec.project.recruitmentDeadline)}`"
            :topic="rec.project.topics[0]?.topicName ?? ''"
            :tech-stacks="rec.project.techStacks.map((t) => t.techStackName)"
            :roles="positionSummary(rec.project)"
            :reasons="rec.reasons"
          />
        </div>

        <p v-else class="text-sm text-text-secondary">
          아직 추천 프로젝트가 없어요. 프로필을 완성하면 맞춤 추천을 받을 수 있어요.
        </p>
      </section>

      <!-- 최신 모집글 -->
      <section class="mt-10">
        <h2 class="mb-5 text-[22px] font-bold text-text">최신 모집글</h2>

        <div v-if="latestProjects.length" class="space-y-4">
          <div
            v-for="project in latestProjects.slice(0, 5)"
            :key="project.projectId"
            class="stagger-item flex items-center justify-between rounded-xl border border-border p-5 transition-all hover:border-text hover:shadow-sm"
          >
            <div>
              <p class="text-base font-bold text-text">{{ project.title }}</p>
              <p class="mt-1 text-[13px] text-text-secondary">
                {{ workTypeLabel(project.workType) }} ·
                {{ deadlineLabel(project.recruitmentDeadline) }}
              </p>
            </div>
            <span class="rounded-full bg-primary-dark px-3 py-1 text-xs font-bold text-text">
              모집중
            </span>
          </div>
        </div>

        <div v-else class="rounded-xl bg-bg-card p-6">
          <h3 class="text-base font-bold text-text">새롭게 등록된 프로젝트</h3>
          <p class="mt-2 text-sm text-text-secondary">
            최신순으로 모집 중인 글만 제공하며, 전체 목록에서 조건을 더 세밀하게 좁힐 수 있어요.
          </p>

          <div class="mt-4 flex justify-end">
            <router-link
              to="/projects"
              class="flex h-[46px] items-center justify-center rounded-full bg-text px-6 text-sm font-bold text-white"
            >
              전체 모집글 보기
            </router-link>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>
