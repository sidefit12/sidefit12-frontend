<!--
  @component ProjectDetailView
  @description 프로젝트 모집글 상세 화면.
  좌측 상세 정보 + 우측 모집 요약 사이드바.
-->
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchProjectDetail, type ProjectDetailData } from '@/api/projectDetail'
import { addBookmark, removeBookmark } from '@/api/bookmark'
import { useAuthStore } from '@/stores/useAuthStore'
import TechStackChip from '@/components/TechStackChip.vue'
import DefaultAvatar from '@/components/DefaultAvatar.vue'
import { type TechStackName } from '@/constants/techStacks'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const loading = ref(true)
const error = ref('')
const detail = ref<ProjectDetailData | null>(null)
const bookmarked = ref(false)
const bookmarkLoading = ref(false)

const isOwner = computed(
  () =>
    detail.value &&
    authStore.user &&
    (detail.value.ownerProfile as Record<string, unknown>).userId === authStore.user.userId,
)

const projectId = computed(() => Number(route.params.id))

onMounted(async () => {
  try {
    const res = await fetchProjectDetail(projectId.value)
    detail.value = res.data
    bookmarked.value = res.data.project.isBookmarked ?? false
  } catch {
    error.value = '프로젝트를 불러오지 못했어요.'
  } finally {
    loading.value = false
  }
})

/** 진행 방식 한글 변환 */
function workTypeLabel(workType: string): string {
  const map: Record<string, string> = {
    ONLINE: '온라인',
    OFFLINE: '오프라인',
    HYBRID: '오프라인 병행',
  }
  return map[workType] ?? workType
}

/** 날짜 포맷 */
function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

/** 공유 링크 복사 */
async function copyShareUrl() {
  if (detail.value?.shareUrl) {
    await navigator.clipboard.writeText(detail.value.shareUrl)
    showToast('공유 링크가 복사되었습니다')
  }
}

/** 토스트 */
const toastMessage = ref('')
const toastVisible = ref(false)

function showToast(msg: string) {
  toastMessage.value = msg
  toastVisible.value = true
  setTimeout(() => {
    toastVisible.value = false
  }, 2000)
}

/** 북마크 토글 */
async function toggleBookmark() {
  if (bookmarkLoading.value) return
  bookmarkLoading.value = true
  try {
    if (bookmarked.value) {
      await removeBookmark(projectId.value)
      bookmarked.value = false
      showToast('관심 목록에서 제거했습니다')
    } else {
      await addBookmark(projectId.value)
      bookmarked.value = true
      showToast('관심 목록에 저장했습니다')
    }
  } catch {
    // 실패 시 무시
  } finally {
    bookmarkLoading.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-[1440px] px-12 pb-16 pt-8">
    <!-- 토스트 -->
    <transition name="dropdown">
      <div
        v-if="toastVisible"
        class="fixed left-1/2 top-[100px] z-[200] -translate-x-1/2 rounded-full bg-text px-6 py-3 text-sm font-bold text-white shadow-lg"
      >
        {{ toastMessage }}
      </div>
    </transition>
    <!-- 로딩: 스켈레톤 -->
    <div v-if="loading" class="flex gap-8">
      <div class="flex-1 min-w-0">
        <div class="h-8 w-20 rounded-full bg-border skeleton-pulse" />
        <div class="mt-4 h-10 w-[400px] rounded bg-border skeleton-pulse" />
        <div class="mt-2 h-10 w-[300px] rounded bg-border skeleton-pulse" />
        <div class="mt-3 h-4 w-[200px] rounded bg-border skeleton-pulse" />
        <div class="mt-4 flex gap-2">
          <div class="h-[34px] w-[80px] rounded-full bg-border skeleton-pulse" />
          <div class="h-[34px] w-[100px] rounded-full bg-border skeleton-pulse" />
          <div class="h-[34px] w-[100px] rounded-full bg-border skeleton-pulse" />
        </div>
        <div class="mt-8 rounded-xl border border-border p-8">
          <div class="h-5 w-[120px] rounded bg-border skeleton-pulse" />
          <div class="mt-4 h-4 w-full rounded bg-border skeleton-pulse" />
          <div class="mt-2 h-4 w-3/4 rounded bg-border skeleton-pulse" />
          <div class="mt-10 h-5 w-[100px] rounded bg-border skeleton-pulse" />
          <div class="mt-4 h-4 w-[300px] rounded bg-border skeleton-pulse" />
          <div class="mt-10 h-5 w-[100px] rounded bg-border skeleton-pulse" />
          <div class="mt-4 h-[72px] w-full rounded-xl bg-border skeleton-pulse" />
          <div class="mt-3 h-[72px] w-full rounded-xl bg-border skeleton-pulse" />
        </div>
      </div>
      <div class="hidden w-[430px] shrink-0 lg:block">
        <div class="rounded-xl bg-bg-card p-7">
          <div class="h-5 w-[100px] rounded bg-border skeleton-pulse" />
          <div class="mt-5 h-4 w-[60px] rounded bg-border skeleton-pulse" />
          <div class="mt-2 h-6 w-[140px] rounded bg-border skeleton-pulse" />
          <div class="mt-6 h-4 w-[100px] rounded bg-border skeleton-pulse" />
          <div class="mt-3 flex items-center gap-4">
            <div class="size-12 rounded-full bg-border skeleton-pulse" />
            <div>
              <div class="h-4 w-[80px] rounded bg-border skeleton-pulse" />
              <div class="mt-1 h-3 w-[100px] rounded bg-border skeleton-pulse" />
            </div>
          </div>
          <div class="mt-7 h-[46px] w-full rounded-full bg-border skeleton-pulse" />
          <div class="mt-3 h-[46px] w-full rounded-full bg-border skeleton-pulse" />
        </div>
      </div>
    </div>

    <!-- 에러 -->
    <div v-else-if="error" class="py-20 text-center text-[#d43f21]">{{ error }}</div>

    <!-- 상세 콘텐츠 -->
    <template v-else-if="detail">
      <!-- 2컬럼: 사이드바가 뱃지 높이부터 시작 -->
      <div class="flex gap-8">
        <!-- 좌측 -->
        <div class="flex-1 min-w-0">
          <div class="hero-animate">
            <!-- 모집 뱃지 -->
            <span
              :class="[
                'inline-block rounded-full px-4 py-2 text-xs font-bold',
                detail.project.recruitmentStatus === 'RECRUITING'
                  ? 'bg-primary-dark text-text'
                  : 'bg-text text-white',
              ]"
            >
              {{ detail.project.recruitmentStatus === 'RECRUITING' ? '모집중' : '마감' }}
            </span>

            <!-- 제목 -->
            <h1 class="mt-4 text-[28px] font-bold leading-tight text-text">
              {{ detail.project.title }}
            </h1>

            <!-- 등록/마감일 -->
            <p class="mt-3 text-sm text-text-secondary">
              등록 {{ formatDate(detail.project.createdAt) }} · 마감
              {{ formatDate(detail.project.recruitmentDeadline) }}
            </p>

            <!-- 토픽 + 기술 칩 + 진행방식 (좌측 영역에만) -->
            <div class="mt-4 flex flex-wrap items-center gap-2">
              <span
                v-for="topic in detail.project.topics"
                :key="topic.topicId"
                class="flex h-[34px] items-center rounded-full border border-border px-3 text-xs font-bold text-text"
              >
                {{ topic.topicName }}
              </span>
              <TechStackChip
                v-for="tech in detail.project.techStacks"
                :key="tech.techStackId"
                :name="tech.techStackName as TechStackName"
                theme="light"
              />
              <span
                class="flex h-[34px] items-center rounded-full border border-border px-3 text-xs font-bold text-text"
              >
                {{ workTypeLabel(detail.project.workType) }}
              </span>
            </div>
          </div>

          <!-- 본문 카드 -->
          <div
            class="hero-animate hero-animate-delay-1 mt-8 rounded-xl border border-border bg-white p-8"
          >
            <!-- 프로젝트 소개 -->
            <h2 class="text-base font-bold text-text">프로젝트 소개</h2>
            <p class="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-text-secondary">
              {{ detail.description }}
            </p>

            <!-- 진행 조건 -->
            <h2 class="mt-10 text-base font-bold text-text">진행 조건</h2>
            <p class="mt-3 text-sm text-text-secondary">
              {{ workTypeLabel(detail.project.workType) }}
              <template v-if="detail.expectedStartDate && detail.expectedEndDate">
                · {{ formatDate(detail.expectedStartDate) }} ~
                {{ formatDate(detail.expectedEndDate) }}
              </template>
              <template v-if="detail.weeklyHours"> · 주 {{ detail.weeklyHours }}시간 </template>
            </p>

            <!-- 모집 역할 -->
            <h2 class="mt-10 text-base font-bold text-text">모집 역할</h2>
            <div class="mt-4 space-y-3">
              <div
                v-for="position in detail.project.positions"
                :key="position.projectPositionId"
                class="grid grid-cols-[160px_1fr_60px] items-center rounded-xl bg-bg-card px-6 py-5"
              >
                <p class="text-sm font-bold text-text">{{ position.positionTitle }}</p>
                <p class="text-xs text-text-secondary">
                  {{ position.role.roleName }} · {{ position.requiredCount }}명 모집
                </p>
                <span class="text-right text-sm font-bold text-text">
                  {{ position.acceptedCount }} / {{ position.requiredCount }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 우측: 모집 요약 사이드바 (뱃지 높이부터) -->
        <aside class="hero-animate hero-animate-delay-2 hidden w-[430px] shrink-0 lg:block">
          <div class="sticky top-[100px] rounded-xl bg-bg-card p-7">
            <div class="flex items-center justify-between">
              <h3 class="text-base font-bold text-text">모집 요약</h3>
              <p
                class="cursor-pointer text-sm font-bold text-text transition-all duration-200 hover:opacity-70 active:scale-95"
                @click="copyShareUrl"
              >
                공유 링크 복사
              </p>
            </div>

            <!-- 마감일 -->
            <div class="mt-5">
              <p class="text-[13px] text-text-secondary">마감일</p>
              <p class="mt-1 text-lg font-bold text-text">
                {{ formatDate(detail.project.recruitmentDeadline) }}
              </p>
            </div>

            <!-- 프로젝트 리더 -->
            <div class="mt-6">
              <p class="text-[13px] text-text-secondary">프로젝트 리더</p>
              <div class="mt-4 flex items-center gap-4">
                <DefaultAvatar :size="48" />
                <div>
                  <p class="text-sm font-bold text-text">{{ detail.ownerProfile.nickname }}</p>
                  <p class="mt-0.5 text-xs text-text-secondary">백엔드 개발자</p>
                </div>
              </div>
            </div>

            <!-- 액션 버튼 -->
            <div class="mt-7 space-y-3">
              <!-- 본인 프로젝트 -->
              <template v-if="isOwner">
                <router-link
                  :to="`/projects/${projectId}/applicants`"
                  class="flex h-[46px] w-full items-center justify-center rounded-full bg-text text-sm font-bold text-white transition-transform hover:scale-105"
                >
                  지원자 관리
                </router-link>
                <router-link
                  :to="`/projects/${projectId}/members`"
                  class="flex h-[46px] w-full items-center justify-center rounded-full border border-text bg-white text-sm font-bold text-text transition-transform hover:scale-105 active:scale-95"
                >
                  팀원 관리
                </router-link>
                <button
                  class="flex h-[46px] w-full items-center justify-center rounded-full border border-border bg-white text-sm font-bold text-text transition-transform hover:scale-105 active:scale-95"
                  @click="router.push(`/projects/${projectId}/edit`)"
                >
                  모집글 수정
                </button>
              </template>

              <!-- 타인 프로젝트 -->
              <template v-else>
                <!-- 신규 지원 가능 (myApplication 없거나 CANCELED) -->
                <router-link
                  v-if="
                    !detail.myApplication || detail.myApplication.applicationStatus === 'CANCELED'
                  "
                  :to="`/projects/${projectId}/apply`"
                  class="flex h-[46px] w-full items-center justify-center rounded-full bg-text text-sm font-bold text-white transition-transform hover:scale-105"
                >
                  프로젝트 지원
                </router-link>
                <!-- PENDING: 지원 검토 중 -->
                <div
                  v-else-if="detail.myApplication.applicationStatus === 'PENDING'"
                  class="flex h-[46px] w-full items-center justify-center rounded-full bg-primary-dark text-sm font-bold text-text"
                >
                  지원 검토 중입니다
                </div>
                <!-- ACCEPTED: 참여 중 -->
                <div
                  v-else-if="detail.myApplication.applicationStatus === 'ACCEPTED'"
                  class="flex h-[46px] w-full items-center justify-center rounded-full bg-bg-muted text-sm font-bold text-text-secondary"
                >
                  이미 참여한 프로젝트입니다
                </div>
                <!-- REJECTED: 거절됨 -->
                <div
                  v-else-if="detail.myApplication.applicationStatus === 'REJECTED'"
                  class="flex h-[46px] w-full items-center justify-center rounded-full bg-bg-muted text-sm font-bold text-text-secondary"
                >
                  지원이 거절되었습니다
                </div>
                <button
                  class="flex h-[46px] w-full items-center justify-center rounded-full border border-text bg-white text-sm font-bold text-text transition-transform hover:scale-105 active:scale-95"
                  :disabled="bookmarkLoading"
                  @click="toggleBookmark"
                >
                  {{ bookmarked ? '관심 목록에서 제거' : '관심 목록에 저장' }}
                </button>
              </template>
            </div>

            <!-- 게시글 신고 -->
            <button
              v-if="!isOwner"
              class="mt-4 flex h-[46px] w-full items-center justify-center rounded-full border border-border bg-white text-sm font-bold text-text transition-all duration-200 hover:scale-105 hover:border-text active:scale-95"
            >
              게시글 신고
            </button>

            <!-- 지원 전 확인 -->
            <div v-if="!isOwner" class="mt-6 border-t border-border pt-5">
              <p class="text-[13px] font-bold text-text">지원 전 확인</p>
              <ul class="mt-3 space-y-1.5 text-[12px] leading-relaxed text-text-secondary">
                <li>• 원하는 역할을 선택합니다.</li>
                <li>• 지원 메시지는 20~1000자입니다.</li>
                <li>• 마감·종료된 글에는 지원할 수 없습니다.</li>
              </ul>
            </div>
          </div>
        </aside>
      </div>
    </template>
  </div>
</template>
