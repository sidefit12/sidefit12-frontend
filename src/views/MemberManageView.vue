<!--
  @view MemberManageView
  @description 확정 팀원 관리 - 역할별 그룹 + 팀 구성 요약 + 내보내기
  @route /projects/:id/members
  @figma 259:215
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

interface MemberItem {
  projectMemberId: number
  userId: number
  nickname: string
  positionTitle: string
  introduction: string
  techStacks: string[]
  joinedAt: string
  profileImageUrl?: string | null
}

interface PositionGroup {
  positionTitle: string
  requiredCount: number
  activeCount: number
  members: MemberItem[]
}

const positionGroups = ref<PositionGroup[]>([])
const totalActive = ref(0)
const totalRequired = ref(0)

const removingId = ref<number | null>(null)
const removeConfirmOpen = ref(false)
const removeTargetId = ref<number | null>(null)
const removeTargetName = ref('')
const removeReason = ref('')
const removeSuccess = ref(false)

/* ────── 데이터 로드 ────── */
onMounted(async () => {
  if (!authStore.isLoggedIn) {
    router.push('/login')
    return
  }
  try {
    const { data } = await apiClient.get(`/api/v1/projects/${projectId.value}/members`, {
      params: { status: 'ACTIVE' },
    })

    // positionSummary 파싱
    const summaryMap: Record<
      string,
      { positionTitle: string; requiredCount: number; activeCount: number }
    > = {}

    if (data.data.positionSummary) {
      const summary = data.data.positionSummary
      for (const [key, val] of Object.entries(summary)) {
        const v = val as {
          positionTitle?: string
          requiredCount?: number
          activeCount?: number
        }
        summaryMap[key] = {
          positionTitle: v.positionTitle || key,
          requiredCount: v.requiredCount || 0,
          activeCount: v.activeCount || 0,
        }
      }
    }

    // 팀원 → 포지션별 그룹핑
    const membersByPosition: Record<string, MemberItem[]> = {}
    const items = (data.data.items || []).filter(
      (m: { memberType: string }) => m.memberType !== 'OWNER',
    )

    for (const m of items) {
      const posId = String(m.projectPositionId || 'unknown')
      if (!membersByPosition[posId]) membersByPosition[posId] = []
      membersByPosition[posId].push({
        projectMemberId: m.projectMemberId,
        userId: m.user?.userId ?? m.projectMemberId,
        nickname: m.user?.nickname ?? '팀원',
        positionTitle: summaryMap[posId]?.positionTitle ?? '',
        introduction: m.user?.introduction ?? '',
        techStacks: (m.user?.techStacks ?? [])
          .map((ts: { techStackName?: string }) => ts.techStackName || '')
          .filter(Boolean),
        joinedAt: m.joinedAt ?? m.createdAt ?? '',
        profileImageUrl: m.user?.profileImageUrl ?? null,
      })
    }

    // 그룹 조합
    const groups: PositionGroup[] = []
    let tActive = 0
    let tRequired = 0

    for (const [posId, info] of Object.entries(summaryMap)) {
      groups.push({
        positionTitle: info.positionTitle,
        requiredCount: info.requiredCount,
        activeCount: info.activeCount,
        members: membersByPosition[posId] || [],
      })
      tActive += info.activeCount
      tRequired += info.requiredCount
    }

    positionGroups.value = groups
    totalActive.value = tActive
    totalRequired.value = tRequired
  } catch {
    router.push(`/projects/${projectId.value}`)
  } finally {
    loading.value = false
  }
})

/* ────── 내보내기 (퇴출) ────── */
function confirmRemove(projectMemberId: number, nickname: string) {
  removeTargetId.value = projectMemberId
  removeTargetName.value = nickname
  removeReason.value = ''
  removeConfirmOpen.value = true
}

async function handleRemoveMember() {
  if (!removeTargetId.value) return
  removingId.value = removeTargetId.value
  try {
    await apiClient.patch(
      `/api/v1/projects/${projectId.value}/members/${removeTargetId.value}/remove`,
      { reason: removeReason.value.trim() },
    )
    // 리스트에서 제거
    for (const group of positionGroups.value) {
      group.members = group.members.filter((m) => m.projectMemberId !== removeTargetId.value)
      if (group.activeCount > 0) group.activeCount--
    }
    totalActive.value = Math.max(0, totalActive.value - 1)
    // 성공 피드백
    removeSuccess.value = true
    setTimeout(() => {
      removeSuccess.value = false
      removeConfirmOpen.value = false
    }, 1800)
  } catch {
    alert('팀원 퇴출에 실패했습니다.')
  } finally {
    removingId.value = null
  }
}

/* ────── 유틸 ────── */
const positionSummaryText = computed(() =>
  positionGroups.value
    .map((g) => `${g.positionTitle} ${g.activeCount}/${g.requiredCount}`)
    .join(' · '),
)
</script>

<template>
  <div class="mx-auto max-w-[1344px] px-6 py-10">
    <!-- 퇴출 확인 모달 -->
    <transition name="fade-in-up">
      <div
        v-if="removeConfirmOpen"
        class="fixed inset-0 z-[100] flex items-center justify-center bg-black/40"
      >
        <div class="w-[780px] rounded-2xl bg-white px-12 py-12 shadow-2xl">
          <!-- 성공 상태 -->
          <template v-if="removeSuccess">
            <div class="flex flex-col items-center py-8">
              <div
                class="check-bounce flex size-[80px] items-center justify-center rounded-full bg-primary-dark"
              >
                <span class="text-3xl text-text">✓</span>
              </div>
              <p class="mt-6 text-xl font-bold text-text">퇴출 처리 완료</p>
              <p class="mt-2 text-sm text-text-secondary">
                {{ removeTargetName }}님이 프로젝트에서 퇴출되었습니다.
              </p>
            </div>
          </template>

          <!-- 입력 상태 -->
          <template v-else>
            <div
              class="flex size-[58px] items-center justify-center rounded-full border-2 border-text"
            >
              <span class="text-xl font-bold text-text">!</span>
            </div>
            <h2 class="mt-6 text-2xl font-bold text-text">팀원을 퇴출할까요?</h2>
            <p class="mt-3 text-sm text-text-secondary">
              퇴출 사유는 해당 팀원에게 전달되며, 처리 후 프로젝트 접근 권한이 해제됩니다.
            </p>
            <textarea
              v-model="removeReason"
              rows="4"
              maxlength="500"
              class="mt-6 w-full resize-none rounded-lg border border-border bg-white px-4 py-3 text-[13px] text-text outline-none focus:border-text"
              placeholder="퇴출 사유를 입력해 주세요 (10자 이상)"
            />
            <p class="mt-1 text-right text-xs text-text-secondary">
              {{ removeReason.trim().length }}/500
            </p>
            <div class="mt-10 flex gap-4">
              <button
                class="h-[46px] flex-1 rounded-full border border-border bg-white text-sm font-bold text-text transition-all hover:bg-bg-muted"
                @click="removeConfirmOpen = false"
              >
                취소
              </button>
              <button
                class="flex h-[46px] flex-1 items-center justify-center rounded-full bg-text text-sm font-bold text-white transition-transform hover:scale-105 disabled:opacity-40"
                :disabled="removeReason.trim().length < 10 || removingId !== null"
                @click="handleRemoveMember"
              >
                <span
                  v-if="removingId"
                  class="inline-block size-4 animate-spin rounded-full border-2 border-white border-t-transparent"
                />
                <span v-else>퇴출</span>
              </button>
            </div>
          </template>
        </div>
      </div>
    </transition>

    <!-- 헤더 -->
    <h1 class="hero-animate text-[30px] font-bold text-text">확정 팀원</h1>
    <p class="hero-animate hero-animate-delay-1 mt-2 text-sm text-text-secondary">
      승인된 팀 구성과 공동 협업의 채널을 관리합니다.
    </p>

    <!-- 로딩 -->
    <div v-if="loading" class="mt-8 space-y-4">
      <div class="skeleton-pulse h-[72px] rounded-xl bg-bg-card" />
      <div v-for="i in 3" :key="i" class="skeleton-pulse h-[80px] rounded-xl bg-bg-card" />
    </div>

    <template v-else>
      <!-- 팀 구성 요약 바 -->
      <div class="mt-8 rounded-xl bg-bg-card px-6 py-5">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-2xl font-bold text-text">
              팀 구성 {{ totalActive }} / {{ totalRequired }}명
            </p>
            <p class="mt-1 text-[13px] text-text-secondary">
              {{ positionSummaryText }}
            </p>
          </div>
          <div class="flex items-center gap-3">
            <div class="text-right">
              <p class="text-xs font-bold text-[#D43F21]">협업 채널 미등록</p>
              <p class="mt-0.5 text-[11px] text-text-secondary">
                Discord · 카카오 오픈채팅 · Slack · Notion 링크
              </p>
            </div>
            <button
              class="rounded-full border border-border bg-white px-4 py-2 text-xs font-bold text-text transition-all hover:bg-bg-muted"
            >
              채널 등록
            </button>
            <span class="rounded-full bg-primary-dark px-4 py-2 text-xs font-bold text-text">
              모집중
            </span>
          </div>
        </div>
      </div>

      <!-- 역할별 그룹 -->
      <div class="mt-8 space-y-8">
        <div v-for="group in positionGroups" :key="group.positionTitle">
          <!-- 역할 구분자 -->
          <p class="text-sm font-bold text-text">{{ group.positionTitle }}</p>

          <!-- 팀원 카드 목록 -->
          <div v-if="group.members.length" class="mt-3 flex flex-col gap-3">
            <div
              v-for="member in group.members"
              :key="member.userId"
              class="flex items-center justify-between rounded-xl border border-border bg-white px-6 py-5"
            >
              <div class="flex items-center gap-4">
                <DefaultAvatar :size="48" :image-url="member.profileImageUrl" />
                <div>
                  <p class="text-sm font-bold text-text">{{ member.nickname }}</p>
                  <p v-if="member.techStacks.length" class="mt-0.5 text-[13px] text-text-secondary">
                    {{ member.techStacks.slice(0, 4).join(' · ') }}
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <button
                  class="rounded-full bg-text px-4 py-2 text-xs font-bold text-white transition-all hover:opacity-80"
                  @click="confirmRemove(member.projectMemberId, member.nickname)"
                >
                  퇴출
                </button>
              </div>
            </div>
          </div>

          <!-- 빈 역할 (모두 구해졌으면 표시 안 함) -->
          <div
            v-else-if="group.activeCount < group.requiredCount"
            class="mt-3 flex items-center justify-between rounded-xl border border-border bg-bg-card px-6 py-5"
          >
            <p class="text-[13px] text-text-secondary">
              아직 확정된 팀원이 없습니다. 지원자 관리에서 승인할 수 있어요.
            </p>
            <button
              class="rounded-full bg-text px-4 py-2 text-xs font-bold text-white transition-all hover:opacity-80"
              @click="router.push(`/projects/${projectId}/applicants`)"
            >
              지원자 관리
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
