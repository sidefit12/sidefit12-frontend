<!--
  @view ProjectEditView
  @description 모집글 수정 화면 — 좌측 폼 + 우측 사이드바(모집 상태 관리)
  @route /projects/:id/edit
  @figma 240:443
-->
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore'
import TechStackChip from '@/components/TechStackChip.vue'
import DatePicker from '@/components/DatePicker.vue'
import { type TechStackName } from '@/constants/techStacks'
import { fetchOnboardingOptions } from '@/api/onboarding'
import { fetchProjectDetail } from '@/api/projectDetail'
import { patchProject, patchRecruitmentStatus, deleteProject } from '@/api/projects'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const projectId = computed(() => Number(route.params.id))

/* ────── 폼 상태 ────── */
const loading = ref(true)
const title = ref('')
const description = ref('')
const workType = ref<'ONLINE' | 'OFFLINE' | 'HYBRID'>('ONLINE')
const workTypeDropdownOpen = ref(false)
const workTypeOptions = [
  { value: 'ONLINE' as const, label: '온라인' },
  { value: 'OFFLINE' as const, label: '오프라인' },
  { value: 'HYBRID' as const, label: '병행' },
]
function selectWorkType(value: 'ONLINE' | 'OFFLINE' | 'HYBRID') {
  workType.value = value
  workTypeDropdownOpen.value = false
}
function workTypeLabel(wt: string): string {
  const map: Record<string, string> = { ONLINE: '온라인', OFFLINE: '오프라인', HYBRID: '병행' }
  return map[wt] ?? wt
}

const recruitmentDeadline = ref('')
const weeklyHours = ref<number | null>(null)
const expectedStartDate = ref('')
const expectedEndDate = ref('')

const allTopics = ref<{ topicId: number; topicName: string }[]>([])
const allTechStacks = ref<{ techStackId: number; techStackName: string }[]>([])
const allRoles = ref<{ roleId: number; roleName: string }[]>([])

const selectedTopicIds = ref<number[]>([])
const selectedTechStackIds = ref<number[]>([])

interface PositionItem {
  projectPositionId?: number
  roleId: number
  roleName: string
  positionTitle: string
  requiredCount: number
}
const positions = ref<PositionItem[]>([])

const submitting = ref(false)
const submitSuccess = ref(false)

/* ────── 사이드바 상태 ────── */
const recruitmentStatus = ref<'DRAFT' | 'RECRUITING' | 'CLOSED'>('RECRUITING')
const togglingStatus = ref(false)
const hasAcceptedMembers = ref(false)
const deleteModalOpen = ref(false)
const deleteReason = ref('')
const deleting = ref(false)

/* ────── 데이터 로드 ────── */
onMounted(async () => {
  if (!authStore.isLoggedIn) {
    router.push('/login')
    return
  }
  try {
    const optRes = await fetchOnboardingOptions()
    allTopics.value = optRes.data.topics
    allTechStacks.value = optRes.data.techStacks
    allRoles.value = optRes.data.roles

    const detailRes = await fetchProjectDetail(projectId.value)
    const d = detailRes.data
    title.value = d.project.title
    description.value = d.description
    workType.value = d.project.workType as 'ONLINE' | 'OFFLINE' | 'HYBRID'
    weeklyHours.value = d.weeklyHours ?? null
    expectedStartDate.value = d.expectedStartDate ? d.expectedStartDate.split('T')[0] : ''
    expectedEndDate.value = d.expectedEndDate ? d.expectedEndDate.split('T')[0] : ''
    if (d.project.recruitmentDeadline) {
      recruitmentDeadline.value = d.project.recruitmentDeadline.split('T')[0]
    }
    selectedTopicIds.value = d.project.topics.map((t: { topicId: number }) => t.topicId)
    selectedTechStackIds.value = d.project.techStacks.map(
      (ts: { techStackId: number }) => ts.techStackId,
    )
    hasAcceptedMembers.value = (d.memberSummary?.totalMembers ?? 0) > 1
    recruitmentStatus.value = d.project.recruitmentStatus as 'DRAFT' | 'RECRUITING' | 'CLOSED'
    positions.value = d.project.positions.map(
      (p: {
        projectPositionId: number
        positionTitle: string
        requiredCount: number
        role: { roleId: number; roleName: string }
      }) => ({
        projectPositionId: p.projectPositionId,
        roleId: p.role.roleId,
        roleName: p.role.roleName,
        positionTitle: p.positionTitle,
        requiredCount: p.requiredCount,
      }),
    )
  } catch {
    router.push(`/projects/${projectId.value}`)
  } finally {
    loading.value = false
  }
})

/* ────── 토픽 토글 ────── */
function toggleTopic(id: number) {
  const idx = selectedTopicIds.value.indexOf(id)
  if (idx >= 0) selectedTopicIds.value.splice(idx, 1)
  else if (selectedTopicIds.value.length < 10) selectedTopicIds.value.push(id)
}

/* ────── 기술 스택 토글 ────── */
function toggleTechStack(id: number) {
  const idx = selectedTechStackIds.value.indexOf(id)
  if (idx >= 0) selectedTechStackIds.value.splice(idx, 1)
  else if (selectedTechStackIds.value.length < 20) selectedTechStackIds.value.push(id)
}

/* ────── 포지션 추가/제거 ────── */
function addPosition(roleId: number, roleName: string) {
  if (positions.value.find((p) => p.roleId === roleId)) return
  positions.value.push({
    roleId,
    roleName,
    positionTitle: roleName,
    requiredCount: 1,
  })
}

function removePosition(roleId: number) {
  positions.value = positions.value.filter((p) => p.roleId !== roleId)
}

function incrementCount(pos: PositionItem) {
  if (pos.requiredCount < 20) pos.requiredCount++
}

function decrementCount(pos: PositionItem) {
  if (pos.requiredCount > 1) pos.requiredCount--
}

/* ────── 폼 제출 (저장) ────── */
async function handleSubmit() {
  submitting.value = true
  try {
    const deadlineDate = new Date(recruitmentDeadline.value)
    deadlineDate.setHours(23, 59, 59)

    await patchProject(projectId.value, {
      title: title.value,
      summary: description.value.slice(0, 500) || title.value,
      description: description.value,
      workType: workType.value,
      recruitmentDeadline: deadlineDate.toISOString(),
      weeklyHours: weeklyHours.value || undefined,
      expectedStartDate: expectedStartDate.value || undefined,
      expectedEndDate: expectedEndDate.value || undefined,
      topicIds: selectedTopicIds.value,
      techStacks: selectedTechStackIds.value.map((id) => ({
        techStackId: id,
        requirementType: 'PREFERRED' as const,
      })),
      positions: positions.value.map((p) => ({
        projectPositionId: p.projectPositionId,
        roleId: p.roleId,
        positionTitle: p.positionTitle,
        requiredCount: p.requiredCount,
      })),
    })
    submitSuccess.value = true
  } catch {
    alert('모집글 수정에 실패했습니다.')
  } finally {
    submitting.value = false
  }
}

/* ────── 모집 상태 전환 ────── */
async function handleToggleRecruitment() {
  togglingStatus.value = true
  try {
    const newStatus = recruitmentStatus.value === 'CLOSED' ? 'RECRUITING' : 'CLOSED'
    await patchRecruitmentStatus(projectId.value, newStatus)
    router.push(`/projects/${projectId.value}`)
  } catch {
    alert('모집 상태 변경에 실패했습니다.')
  } finally {
    togglingStatus.value = false
  }
}

/* ────── 모집글 삭제 ────── */
const deleteReasonValid = computed(() => deleteReason.value.trim().length >= 10)

async function handleDelete() {
  if (!deleteReasonValid.value) return
  deleting.value = true
  try {
    await deleteProject(projectId.value, deleteReason.value.trim())
    router.push('/mypage/projects')
  } catch {
    alert('모집글 삭제에 실패했습니다.')
  } finally {
    deleting.value = false
  }
}

/* ────── 유틸 ────── */
const totalRecruitCount = computed(() =>
  positions.value.reduce((sum, p) => sum + p.requiredCount, 0),
)
</script>

<template>
  <div class="mx-auto max-w-[1440px] px-12 pb-16 pt-8">
    <!-- 삭제 사유 모달 -->
    <transition name="fade-in-up">
      <div
        v-if="deleteModalOpen"
        class="fixed inset-0 z-[100] flex items-center justify-center bg-black/40"
      >
        <div class="w-[780px] rounded-2xl bg-white px-12 py-12 shadow-2xl">
          <div
            class="flex size-[58px] items-center justify-center rounded-full border-2 border-text"
          >
            <span class="text-xl font-bold text-text">!</span>
          </div>
          <h2 class="mt-6 text-2xl font-bold text-text">모집글을 삭제할까요?</h2>
          <p class="mt-3 text-sm text-text-secondary">
            삭제한 모집글은 복구할 수 없습니다. 삭제 사유를 10자 이상 입력해 주세요.
          </p>
          <textarea
            v-model="deleteReason"
            rows="4"
            maxlength="500"
            class="mt-6 w-full resize-none rounded-lg border border-border bg-white px-4 py-3 text-[13px] text-text outline-none focus:border-text"
            placeholder="삭제 사유를 입력해 주세요 (10자 이상)"
          />
          <p class="mt-1 text-right text-xs text-text-secondary">
            {{ deleteReason.trim().length }}/500
          </p>
          <div class="mt-10 flex gap-4">
            <button
              class="h-[46px] flex-1 rounded-full border border-border bg-white text-sm font-bold text-text transition-all hover:bg-bg-muted"
              @click="deleteModalOpen = false"
            >
              취소
            </button>
            <button
              class="h-[46px] flex-1 rounded-full bg-text text-sm font-bold text-white transition-transform hover:scale-105 disabled:opacity-40"
              :disabled="!deleteReasonValid || deleting"
              @click="handleDelete"
            >
              {{ deleting ? '삭제 중...' : '삭제' }}
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- 성공 화면 -->
    <div v-if="submitSuccess" class="flex flex-col items-center py-24">
      <div
        class="w-[780px] rounded-xl border border-border bg-white py-16 flex flex-col items-center"
      >
        <div
          class="check-bounce flex size-[104px] items-center justify-center rounded-full bg-primary-dark"
        >
          <span class="text-4xl text-text">✓</span>
        </div>
        <h2 class="mt-8 text-2xl font-bold text-text">모집글을 수정했어요</h2>
        <p class="mt-3 text-sm text-text-secondary">변경 사항이 즉시 반영됩니다.</p>
        <button
          class="mt-10 h-[46px] w-[220px] rounded-full bg-text text-sm font-bold text-white transition-transform hover:scale-105"
          @click="router.push(`/projects/${projectId}`)"
        >
          모집글 확인
        </button>
      </div>
    </div>

    <!-- 로딩 -->
    <template v-else-if="loading">
      <div class="skeleton-pulse mb-4 h-9 w-[200px] rounded bg-bg-card" />
      <div class="skeleton-pulse h-[600px] rounded-xl bg-bg-card" />
    </template>

    <!-- 수정 폼 -->
    <template v-else>
      <h1 class="hero-animate text-[30px] font-bold text-text">모집글 수정</h1>
      <p class="hero-animate hero-animate-delay-1 mt-2 text-sm text-text-secondary">
        프로젝트 정보와 모집 조건을 수정합니다.
      </p>

      <div class="mt-8 flex gap-6">
        <!-- ════════ 좌측: 폼 ════════ -->
        <div class="flex-1 rounded-xl border border-border bg-white p-8">
          <!-- 프로젝트 제목 -->
          <div>
            <label class="text-[13px] font-bold text-text"
              >프로젝트 제목 <span class="text-[#D43F21]">*</span></label
            >
            <input
              v-model="title"
              type="text"
              maxlength="100"
              class="mt-2 h-[48px] w-full rounded-lg border border-border bg-white px-4 text-[13px] text-text outline-none focus:border-text"
              placeholder="5~100자"
            />
          </div>

          <!-- 프로젝트 설명 -->
          <div class="mt-6">
            <label class="text-[13px] font-bold text-text"
              >프로젝트 설명 <span class="text-[#D43F21]">*</span></label
            >
            <textarea
              v-model="description"
              maxlength="5000"
              rows="8"
              class="mt-2 w-full resize-none rounded-lg border border-border bg-white px-4 py-3 text-[13px] text-text outline-none focus:border-text"
              placeholder="프로젝트 목적, 주요 기능, 협업 방식 등을 20~5000자로 작성하세요."
            />
          </div>

          <!-- 진행 방식 / 주당 시간 / 마감일 -->
          <div class="mt-6 grid grid-cols-3 gap-4">
            <!-- 진행 방식 (커스텀 드롭다운) -->
            <div>
              <label class="text-[13px] font-bold text-text"
                >진행 방식 <span class="text-[#D43F21]">*</span></label
              >
              <div class="relative mt-2">
                <button
                  class="flex h-[48px] w-full items-center justify-between rounded-lg border border-border bg-white px-4 text-[13px] text-text"
                  @click="workTypeDropdownOpen = !workTypeDropdownOpen"
                >
                  {{ workTypeLabel(workType) }}
                  <span class="text-[10px]">⌄</span>
                </button>
                <transition name="dropdown">
                  <div
                    v-if="workTypeDropdownOpen"
                    class="absolute left-0 top-[52px] z-50 w-full rounded-lg border border-border bg-white py-1 shadow-lg"
                  >
                    <button
                      v-for="opt in workTypeOptions"
                      :key="opt.value"
                      class="block w-full px-4 py-2.5 text-left text-[13px] text-text hover:bg-bg-muted"
                      @click="selectWorkType(opt.value)"
                    >
                      {{ opt.label }}
                    </button>
                  </div>
                </transition>
                <div
                  v-if="workTypeDropdownOpen"
                  class="fixed inset-0 z-40"
                  @click="workTypeDropdownOpen = false"
                />
              </div>
            </div>

            <!-- 주당 참여시간 -->
            <div>
              <label class="text-[13px] font-bold text-text">주당 참여시간</label>
              <div class="relative mt-2">
                <input
                  v-model.number="weeklyHours"
                  type="number"
                  min="1"
                  max="168"
                  step="1"
                  class="h-[48px] w-full rounded-lg border border-border bg-white px-4 pr-12 text-[13px] text-text outline-none focus:border-text"
                  placeholder="예: 10"
                  @keydown="$event.key === '.' && $event.preventDefault()"
                />
                <span
                  class="absolute right-4 top-1/2 -translate-y-1/2 text-[13px] text-text-secondary"
                  >시간</span
                >
              </div>
            </div>

            <!-- 모집 마감일 (커스텀 DatePicker) -->
            <div>
              <label class="text-[13px] font-bold text-text"
                >모집 마감일 <span class="text-[#D43F21]">*</span></label
              >
              <div class="mt-2">
                <DatePicker
                  v-model="recruitmentDeadline"
                  placeholder="날짜 선택"
                  :min-date="new Date().toISOString().split('T')[0]"
                />
              </div>
            </div>
          </div>

          <!-- 프로젝트 기간 -->
          <div class="mt-6 grid grid-cols-2 gap-4">
            <div>
              <label class="text-[13px] font-bold text-text">프로젝트 시작일</label>
              <div class="mt-2">
                <DatePicker
                  v-model="expectedStartDate"
                  placeholder="시작일 선택"
                  :min-date="new Date().toISOString().split('T')[0]"
                />
              </div>
            </div>
            <div>
              <label class="text-[13px] font-bold text-text">프로젝트 종료일</label>
              <div class="mt-2">
                <DatePicker
                  v-model="expectedEndDate"
                  placeholder="종료일 선택"
                  :min-date="expectedStartDate || new Date().toISOString().split('T')[0]"
                />
              </div>
            </div>
          </div>

          <!-- 관심 토픽 (pill 토글) -->
          <div class="mt-6">
            <p class="text-[13px] font-bold text-text">
              관심 토픽 <span class="text-[#D43F21]">*</span>
            </p>
            <div class="mt-3 flex flex-wrap gap-2">
              <button
                v-for="topic in allTopics"
                :key="topic.topicId"
                :class="[
                  'rounded-full px-4 py-2 text-xs font-bold transition-all active:scale-90',
                  selectedTopicIds.includes(topic.topicId)
                    ? 'bg-text text-white'
                    : 'border border-border bg-white text-text hover:bg-bg-muted',
                ]"
                @click="toggleTopic(topic.topicId)"
              >
                {{ topic.topicName }}
                <span v-if="selectedTopicIds.includes(topic.topicId)"> ×</span>
              </button>
            </div>
          </div>

          <!-- 기술 스택 (TechStackChip 토글) -->
          <div class="mt-6">
            <p class="text-[13px] font-bold text-text">기술 스택</p>
            <div class="mt-3 flex flex-wrap gap-2">
              <button
                v-for="ts in allTechStacks"
                :key="ts.techStackId"
                :class="[
                  'transition-all active:scale-90',
                  selectedTechStackIds.includes(ts.techStackId)
                    ? 'opacity-100'
                    : 'opacity-70 hover:opacity-100',
                ]"
                @click="toggleTechStack(ts.techStackId)"
              >
                <TechStackChip
                  :name="ts.techStackName as TechStackName"
                  :theme="selectedTechStackIds.includes(ts.techStackId) ? 'dark' : 'light'"
                />
              </button>
            </div>
          </div>

          <!-- 모집 역할과 인원 -->
          <div class="mt-6">
            <p class="text-[13px] font-bold text-text">
              모집 역할과 인원 <span class="text-[#D43F21]">*</span>
            </p>

            <!-- 역할 추가 버튼 -->
            <div class="mt-3 flex flex-wrap gap-2">
              <button
                v-for="role in allRoles"
                :key="role.roleId"
                :class="[
                  'rounded-full px-4 py-2 text-xs font-bold transition-all active:scale-90',
                  positions.find((p) => p.roleId === role.roleId)
                    ? 'bg-text text-white'
                    : 'border border-border bg-white text-text hover:bg-bg-muted',
                ]"
                @click="
                  positions.find((p) => p.roleId === role.roleId)
                    ? removePosition(role.roleId)
                    : addPosition(role.roleId, role.roleName)
                "
              >
                {{ role.roleName }}
                <span v-if="positions.find((p) => p.roleId === role.roleId)"> ×</span>
              </button>
            </div>

            <!-- 추가된 포지션 (+/- 카운터) -->
            <div class="mt-4 flex flex-col gap-3">
              <div
                v-for="pos in positions"
                :key="pos.roleId"
                class="rounded-lg border border-border bg-white px-5 py-4"
              >
                <div class="flex items-center justify-between">
                  <p class="text-sm font-bold text-text">{{ pos.positionTitle }}</p>
                  <div class="flex items-center gap-2">
                    <button
                      class="flex size-9 items-center justify-center rounded-full border border-border bg-white text-sm font-bold text-text transition-transform active:scale-75"
                      @click="decrementCount(pos)"
                    >
                      −
                    </button>
                    <span class="w-6 text-center text-sm font-bold text-text">{{
                      pos.requiredCount
                    }}</span>
                    <button
                      class="flex size-9 items-center justify-center rounded-full bg-text text-sm font-bold text-white transition-transform active:scale-75"
                      @click="incrementCount(pos)"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <p v-if="positions.length" class="mt-3 text-xs text-text-secondary">
              총 {{ totalRecruitCount }}명 모집
            </p>
          </div>

          <!-- 취소 / 저장 버튼 -->
          <div class="mt-10 flex justify-end gap-3">
            <button
              class="h-[46px] w-[150px] rounded-full border border-border bg-white text-sm font-bold text-text transition-all hover:bg-bg-muted"
              @click="router.push(`/projects/${projectId}`)"
            >
              취소
            </button>
            <button
              class="h-[46px] w-[162px] rounded-full bg-text text-sm font-bold text-white transition-transform hover:scale-105 disabled:opacity-40"
              :disabled="submitting"
              @click="handleSubmit"
            >
              {{ submitting ? '저장 중...' : '저장' }}
            </button>
          </div>
        </div>

        <!-- ════════ 우측: 사이드바 ════════ -->
        <aside class="hidden w-[380px] shrink-0 lg:block">
          <div class="sticky top-[100px] space-y-5">
            <!-- 모집 상태 관리 -->
            <div class="rounded-xl bg-bg-card p-7">
              <h4 class="text-sm font-bold text-text">모집 상태 관리</h4>
              <p class="mt-3 text-[13px] text-text-secondary">
                모집 종료 시 신규 지원이 불가하며, 삭제 시 복구할 수 없습니다.
              </p>
              <button
                class="mt-5 h-[44px] w-full rounded-full bg-text text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-40"
                :disabled="togglingStatus"
                @click="handleToggleRecruitment"
              >
                {{
                  togglingStatus
                    ? '처리 중...'
                    : recruitmentStatus === 'CLOSED'
                      ? '모집 재개'
                      : '모집 종료'
                }}
              </button>
              <button
                class="mt-3 h-[44px] w-full rounded-full border border-text bg-white text-sm font-bold text-text transition-all hover:bg-bg-muted disabled:opacity-40"
                :disabled="hasAcceptedMembers"
                @click="deleteModalOpen = true"
              >
                모집글 삭제
              </button>
              <p v-if="hasAcceptedMembers" class="mt-2 text-xs text-text-secondary">
                승인된 팀원이 있으면 삭제 대신 모집 종료만 가능합니다.
              </p>
            </div>

            <!-- 수정 안내 -->
            <div class="rounded-xl bg-bg-card p-7">
              <h4 class="text-sm font-bold text-text">수정 안내</h4>
              <ul class="mt-3 space-y-2 text-[13px] text-text-secondary">
                <li>• 제목과 설명은 즉시 반영됩니다.</li>
                <li>• 역할 변경 시 기존 지원은 유지됩니다.</li>
                <li>• 마감일을 앞당기면 즉시 마감 처리될 수 있습니다.</li>
                <li>• 기술 스택 변경은 추천 결과에 영향을 줍니다.</li>
                <li>
                  • 모집을 종료하면 프로젝트 목록에서 "모집 마감"으로 표시됩니다. 이 작업은 되돌릴
                  수 있습니다.
                </li>
              </ul>
            </div>
          </div>
        </aside>
      </div>
    </template>
  </div>
</template>
