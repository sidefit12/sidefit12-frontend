<!--
  @view ProjectWriteView
  @description 모집글 작성 3단계 - 기본 정보 → 모집 역할 → 검토/공개
  @route /write
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
import { patchProject, patchRecruitmentStatus } from '@/api/projects'
import apiClient from '@/api/client'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

/* ────── DRAFT 모드 ────── */
const draftId = ref<number | null>(null)
const draftLoading = ref(!!route.query.draftId)
const saving = ref(false)
const saveSuccess = ref(false)

/* ────── 단계 ────── */
const step = ref(1)

/* ────── Step 1: 기본 정보 ────── */
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
const recruitmentDeadline = ref('')
const weeklyHours = ref<number | null>(null)
const expectedStartDate = ref('')
const expectedEndDate = ref('')

/* ────── Step 2: 모집 역할 ────── */
const allTopics = ref<{ topicId: number; topicName: string }[]>([])
const allTechStacks = ref<{ techStackId: number; techStackName: string }[]>([])
const allRoles = ref<{ roleId: number; roleName: string }[]>([])

const selectedTopicIds = ref<number[]>([])
const selectedTechStackIds = ref<number[]>([])

interface PositionItem {
  roleId: number
  roleName: string
  positionTitle: string
  requiredCount: number
}
const positions = ref<PositionItem[]>([])

/* ────── Step 3: 검토 ────── */
const submitting = ref(false)
const submitSuccess = ref(false)
const createdProjectId = ref<number | null>(null)
const confirmPublishOpen = ref(false)

/* ────── 옵션 로드 ────── */
onMounted(async () => {
  if (!authStore.isLoggedIn) {
    router.push('/login')
    return
  }
  try {
    const res = await fetchOnboardingOptions()
    allTopics.value = res.data.topics.map((t: { topicId: number; topicName: string }) => ({
      topicId: t.topicId,
      topicName: t.topicName,
    }))
    allTechStacks.value = res.data.techStacks.map(
      (ts: { techStackId: number; techStackName: string }) => ({
        techStackId: ts.techStackId,
        techStackName: ts.techStackName,
      }),
    )
    allRoles.value = res.data.roles.map((r: { roleId: number; roleName: string }) => ({
      roleId: r.roleId,
      roleName: r.roleName,
    }))

    // DRAFT 이어쓰기: query에 draftId가 있으면 기존 데이터 로드
    const queryDraftId = Number(route.query.draftId)
    if (queryDraftId) {
      draftLoading.value = true
      draftId.value = queryDraftId
      try {
        const detailRes = await fetchProjectDetail(queryDraftId)
        const d = detailRes.data
        title.value = d.project.title || ''
        description.value = d.description || ''
        workType.value = (d.project.workType as 'ONLINE' | 'OFFLINE' | 'HYBRID') || 'ONLINE'
        if (d.project.recruitmentDeadline) {
          recruitmentDeadline.value = d.project.recruitmentDeadline.split('T')[0]
        }
        selectedTopicIds.value = d.project.topics.map((t: { topicId: number }) => t.topicId)
        selectedTechStackIds.value = d.project.techStacks.map(
          (ts: { techStackId: number }) => ts.techStackId,
        )
        positions.value = d.project.positions.map(
          (p: {
            projectPositionId: number
            positionTitle: string
            requiredCount: number
            role: { roleId: number; roleName: string }
          }) => ({
            roleId: p.role.roleId,
            roleName: p.role.roleName,
            positionTitle: p.positionTitle,
            requiredCount: p.requiredCount,
          }),
        )
      } finally {
        draftLoading.value = false
      }
    }
  } catch {
    // 옵션 로드 실패
  }
})

/* ────── Step 1 유효성 ────── */
const step1Valid = computed(
  () =>
    title.value.length >= 5 && description.value.length >= 20 && recruitmentDeadline.value !== '',
)

/* ────── Step 2 유효성 ────── */
const step2Valid = computed(() => selectedTopicIds.value.length >= 1 && positions.value.length >= 1)

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

/* ────── 토픽/기술스택 토글 ────── */
function toggleTopic(id: number) {
  const idx = selectedTopicIds.value.indexOf(id)
  if (idx >= 0) selectedTopicIds.value.splice(idx, 1)
  else if (selectedTopicIds.value.length < 10) selectedTopicIds.value.push(id)
}

function toggleTechStack(id: number) {
  const idx = selectedTechStackIds.value.indexOf(id)
  if (idx >= 0) selectedTechStackIds.value.splice(idx, 1)
  else if (selectedTechStackIds.value.length < 20) selectedTechStackIds.value.push(id)
}

/* ────── 임시저장 ────── */
async function handleSaveDraft() {
  saving.value = true
  try {
    const deadlineDate = recruitmentDeadline.value ? new Date(recruitmentDeadline.value) : undefined
    if (deadlineDate) deadlineDate.setHours(23, 59, 59)

    const payload = {
      title: title.value || '제목 없음',
      summary: description.value.slice(0, 500) || title.value || '임시저장',
      description: description.value,
      workType: workType.value,
      recruitmentDeadline: deadlineDate ? deadlineDate.toISOString() : undefined,
      expectedStartDate: expectedStartDate.value || undefined,
      expectedEndDate: expectedEndDate.value || undefined,
      weeklyHours: weeklyHours.value || undefined,
      topicIds: selectedTopicIds.value,
      techStacks: selectedTechStackIds.value.map((id) => ({
        techStackId: id,
        requirementType: 'PREFERRED' as const,
      })),
      positions: positions.value.map((p) => ({
        roleId: p.roleId,
        positionTitle: p.positionTitle,
        requiredCount: p.requiredCount,
      })),
    }

    if (draftId.value) {
      // 기존 DRAFT 업데이트
      await patchProject(draftId.value, payload)
    } else {
      // 새 DRAFT 생성
      const { data } = await apiClient.post('/api/v1/projects', payload)
      draftId.value = data.data.project.projectId
    }
    saveSuccess.value = true
    setTimeout(() => {
      saveSuccess.value = false
    }, 2500)
  } catch {
    alert('임시저장에 실패했습니다.')
  } finally {
    saving.value = false
  }
}

/* ────── 제출 ────── */
function requestPublish() {
  confirmPublishOpen.value = true
}

async function handleSubmit() {
  confirmPublishOpen.value = false
  submitting.value = true
  try {
    const deadlineDate = new Date(recruitmentDeadline.value)
    deadlineDate.setHours(23, 59, 59)

    const payload = {
      title: title.value,
      summary: description.value.slice(0, 500) || title.value,
      description: description.value,
      workType: workType.value,
      recruitmentDeadline: deadlineDate.toISOString(),
      expectedStartDate: expectedStartDate.value || undefined,
      expectedEndDate: expectedEndDate.value || undefined,
      weeklyHours: weeklyHours.value || undefined,
      topicIds: selectedTopicIds.value,
      techStacks: selectedTechStackIds.value.map((id) => ({
        techStackId: id,
        requirementType: 'PREFERRED' as const,
      })),
      positions: positions.value.map((p) => ({
        roleId: p.roleId,
        positionTitle: p.positionTitle,
        requiredCount: p.requiredCount,
      })),
    }

    if (draftId.value) {
      // 기존 DRAFT 업데이트 후 공개
      await patchProject(draftId.value, payload)
      await patchRecruitmentStatus(draftId.value, 'RECRUITING')
      createdProjectId.value = draftId.value
    } else {
      // 새로 생성 후 공개
      const { data } = await apiClient.post('/api/v1/projects', payload)
      createdProjectId.value = data.data.project.projectId
      await patchRecruitmentStatus(createdProjectId.value!, 'RECRUITING')
    }

    submitSuccess.value = true
  } catch {
    alert('모집글 등록에 실패했습니다.')
  } finally {
    submitting.value = false
  }
}

/* ────── 유틸 ────── */
function workTypeLabel(wt: string): string {
  const map: Record<string, string> = { ONLINE: '온라인', OFFLINE: '오프라인', HYBRID: '병행' }
  return map[wt] ?? wt
}

const totalRecruitCount = computed(() =>
  positions.value.reduce((sum, p) => sum + p.requiredCount, 0),
)
</script>

<template>
  <div class="mx-auto max-w-[1440px] px-12 pb-16 pt-8">
    <!-- 공개 확인 모달 -->
    <transition name="fade-in-up">
      <div
        v-if="confirmPublishOpen"
        class="fixed inset-0 z-[100] flex items-center justify-center bg-black/40"
      >
        <div class="w-[780px] rounded-2xl bg-white px-12 py-12 shadow-2xl">
          <div
            class="flex size-[58px] items-center justify-center rounded-full border-2 border-text"
          >
            <span class="text-xl font-bold text-text">?</span>
          </div>
          <h2 class="mt-6 text-2xl font-bold text-text">모집글을 공개할까요?</h2>
          <p class="mt-3 text-sm text-text-secondary">
            공개 후 프로젝트 목록과 추천 결과에 노출됩니다. 역할과 모집 조건을 마지막으로 확인해
            주세요.
          </p>
          <div class="mt-10 flex gap-4">
            <button
              class="h-[46px] flex-1 rounded-full border border-border bg-white text-sm font-bold text-text transition-all hover:bg-bg-muted"
              @click="confirmPublishOpen = false"
            >
              계속 수정
            </button>
            <button
              class="h-[46px] flex-1 rounded-full bg-text text-sm font-bold text-white transition-all hover:opacity-80"
              :disabled="submitting"
              @click="handleSubmit"
            >
              {{ submitting ? '등록 중...' : '공개하기' }}
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- 임시저장 성공 오버레이 -->
    <transition name="fade-in-up">
      <div
        v-if="saveSuccess"
        class="fixed inset-0 z-[100] flex items-center justify-center bg-black/40"
      >
        <div class="flex w-[780px] flex-col items-center rounded-2xl bg-white py-16 shadow-2xl">
          <div
            class="check-bounce flex size-[104px] items-center justify-center rounded-full bg-primary-dark"
          >
            <span class="text-4xl text-text">✓</span>
          </div>
          <h2 class="mt-8 text-2xl font-bold text-text">임시저장 완료</h2>
          <p class="mt-3 text-sm text-text-secondary">
            작성 중인 내용이 저장되었습니다. 계속해서 작성하실 수 있어요.
          </p>
          <button
            class="mt-10 h-[46px] w-[220px] rounded-full bg-text text-sm font-bold text-white transition-transform hover:scale-105"
            @click="saveSuccess = false"
          >
            계속 작성
          </button>
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
        <h2 class="mt-8 text-2xl font-bold text-text">모집글을 공개했어요</h2>
        <p class="mt-3 text-sm text-text-secondary">
          프로젝트 상세 화면에서 지원자와 모집 상태를 관리할 수 있습니다.
        </p>
        <button
          class="mt-10 h-[46px] w-[220px] rounded-full bg-text text-sm font-bold text-white transition-transform hover:scale-105"
          @click="router.push(`/projects/${createdProjectId}`)"
        >
          모집글 확인
        </button>
      </div>
    </div>

    <!-- 폼 -->
    <template v-else-if="draftLoading">
      <h1 class="hero-animate text-[30px] font-bold text-text">모집글 작성</h1>
      <p class="mt-2 text-sm text-text-secondary">임시저장된 데이터를 불러오는 중...</p>
      <div class="mt-8 flex gap-6">
        <div class="flex-1 space-y-4">
          <div class="skeleton-pulse h-[48px] rounded-lg bg-bg-card" />
          <div class="skeleton-pulse h-[200px] rounded-lg bg-bg-card" />
          <div class="skeleton-pulse h-[48px] rounded-lg bg-bg-card" />
          <div class="skeleton-pulse h-[120px] rounded-lg bg-bg-card" />
        </div>
        <div class="hidden w-[436px] shrink-0 lg:block">
          <div class="skeleton-pulse h-[300px] rounded-xl bg-bg-card" />
        </div>
      </div>
    </template>

    <template v-else>
      <h1 class="hero-animate text-[30px] font-bold text-text">모집글 작성</h1>

      <!-- 스텝 인디케이터 -->
      <div class="mt-4 flex items-center">
        <span :class="['text-sm', step === 1 ? 'font-bold text-text' : 'text-text-secondary']"
          >1. 기본 정보</span
        >
        <span
          :class="[
            'ml-[266px] text-sm',
            step === 2 ? 'font-bold text-text' : 'text-text-secondary',
          ]"
          >2. 모집 역할</span
        >
        <span
          :class="[
            'ml-[266px] text-sm',
            step === 3 ? 'font-bold text-text' : 'text-text-secondary',
          ]"
          >3. 검토</span
        >
      </div>
      <!-- 프로그레스 바 (현재 스텝 아래에만) -->
      <div
        class="mt-2 h-1 w-[304px] rounded-full bg-primary transition-all duration-300"
        :style="{ marginLeft: step === 1 ? '0px' : step === 2 ? '332px' : '664px' }"
      />

      <div class="mt-8 flex gap-6">
        <!-- ════════ Step 1: 기본 정보 ════════ -->
        <div v-if="step === 1" class="flex-1 rounded-xl border border-border bg-white p-8">
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

          <!-- 진행 방식 / 모집 마감일 -->
          <div class="mt-6 grid grid-cols-2 gap-4">
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

          <!-- 프로젝트 기간 / 주당 참여시간 -->
          <div class="mt-6 grid grid-cols-3 gap-4">
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
          </div>

          <!-- 버튼 -->
          <div class="mt-10 flex justify-end gap-3">
            <button
              class="flex h-[46px] w-[150px] items-center justify-center rounded-full border border-border bg-white text-sm font-bold text-text transition-all hover:bg-bg-muted"
              :disabled="saving"
              @click="handleSaveDraft"
            >
              <span
                v-if="saving"
                class="inline-block size-4 animate-spin rounded-full border-2 border-text border-t-transparent"
              />
              <span v-else>임시저장</span>
            </button>
            <button
              class="h-[46px] w-[162px] rounded-full bg-text text-sm font-bold text-white transition-transform hover:scale-105 disabled:opacity-40"
              :disabled="!step1Valid"
              @click="step = 2"
            >
              다음
            </button>
          </div>
        </div>

        <!-- ════════ Step 2: 모집 역할 ════════ -->
        <div v-if="step === 2" class="flex-1 rounded-xl border border-border bg-white p-8">
          <!-- 관심 토픽 -->
          <div>
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

          <!-- 기술 스택 -->
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

            <!-- 추가된 포지션 -->
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
          </div>

          <!-- 버튼 -->
          <div class="mt-10 flex justify-end gap-3">
            <button
              class="h-[46px] w-[150px] rounded-full border border-border bg-white text-sm font-bold text-text transition-all hover:bg-bg-muted"
              @click="step = 1"
            >
              이전
            </button>
            <button
              class="flex h-[46px] w-[150px] items-center justify-center rounded-full border border-border bg-white text-sm font-bold text-text transition-all hover:bg-bg-muted"
              :disabled="saving"
              @click="handleSaveDraft"
            >
              <span
                v-if="saving"
                class="inline-block size-4 animate-spin rounded-full border-2 border-text border-t-transparent"
              />
              <span v-else>임시저장</span>
            </button>
            <button
              class="h-[46px] w-[162px] rounded-full bg-text text-sm font-bold text-white transition-transform hover:scale-105 disabled:opacity-40"
              :disabled="!step2Valid"
              @click="step = 3"
            >
              다음
            </button>
          </div>
        </div>

        <!-- ════════ Step 3: 검토 ════════ -->
        <div v-if="step === 3" class="flex-1 rounded-xl border border-border bg-white p-8">
          <!-- 미리보기 -->
          <div
            class="rounded-full bg-primary-dark px-3 py-1 text-[11px] font-bold text-text inline-block"
          >
            모집중
          </div>
          <h2 class="mt-4 text-xl font-bold text-text">{{ title }}</h2>
          <p class="mt-2 text-sm text-text-secondary">
            {{
              allTopics
                .filter((t) => selectedTopicIds.includes(t.topicId))
                .map((t) => t.topicName)
                .join(' · ')
            }}
          </p>
          <div class="mt-4 h-px bg-border" />

          <div class="mt-5">
            <h4 class="text-sm font-bold text-text">프로젝트 소개</h4>
            <p class="mt-2 text-[13px] text-text-secondary leading-relaxed">{{ description }}</p>
          </div>

          <div class="mt-5">
            <h4 class="text-sm font-bold text-text">진행 조건</h4>
            <p class="mt-2 text-[13px] text-text-secondary">
              {{ workTypeLabel(workType) }}
              <template v-if="expectedStartDate && expectedEndDate">
                · {{ expectedStartDate }} ~ {{ expectedEndDate }}
              </template>
              <template v-if="weeklyHours"> · 주 {{ weeklyHours }}시간</template>
              · {{ recruitmentDeadline }} 마감
            </p>
          </div>

          <div class="mt-5">
            <h4 class="text-sm font-bold text-text">모집 역할</h4>
            <p class="mt-2 text-[13px] text-text-secondary">
              {{ positions.map((p) => `${p.positionTitle} ${p.requiredCount}명`).join(' · ') }}
            </p>
          </div>

          <!-- 버튼 -->
          <div class="mt-10 flex justify-end gap-3">
            <button
              class="h-[46px] w-[150px] rounded-full border border-border bg-white text-sm font-bold text-text transition-all hover:bg-bg-muted"
              @click="step = 2"
            >
              이전
            </button>
            <button
              class="h-[46px] w-[162px] rounded-full bg-text text-sm font-bold text-white transition-transform hover:scale-105 disabled:opacity-40"
              :disabled="submitting"
              @click="requestPublish"
            >
              {{ submitting ? '등록 중...' : '모집글 공개' }}
            </button>
          </div>
        </div>

        <!-- 우측: 사이드바 -->
        <aside class="hidden w-[436px] shrink-0 lg:block">
          <div class="sticky top-[100px] rounded-xl bg-bg-card p-7">
            <!-- Step 1 사이드바 -->
            <template v-if="step === 1">
              <h4 class="text-sm font-bold text-text">작성 기준</h4>
              <ul class="mt-3 space-y-2 text-[13px] text-text-secondary">
                <li>• 제목 5~100자</li>
                <li>• 설명 20~5000자</li>
                <li>• 마감일은 현재 이후 날짜</li>
                <li>• 스크립트 태그는 제거</li>
                <li>• 총 모집 인원 최대 20명</li>
              </ul>
              <div class="mt-8">
                <p class="text-xs font-bold text-text-secondary">LIVE PREVIEW</p>
                <div v-if="title" class="mt-3 rounded-xl border border-border bg-white p-4">
                  <span
                    class="inline-block rounded-full bg-primary-dark px-3 py-1 text-[11px] font-bold text-text"
                    >모집중</span
                  >
                  <div class="mt-1.5 h-[3px] w-[58px] rounded-full bg-primary-dark" />
                  <h4 class="mt-3 text-sm font-bold leading-snug text-text line-clamp-2">
                    {{ title }}
                  </h4>
                  <p class="mt-2 text-[13px] text-text-secondary">
                    {{ workTypeLabel(workType) }}
                    <template v-if="weeklyHours"> · 주 {{ weeklyHours }}시간</template>
                    <template v-if="recruitmentDeadline">
                      · {{ recruitmentDeadline }} 마감</template
                    >
                  </p>
                  <p v-if="positions.length" class="mt-3 text-[13px] font-bold text-text">
                    {{
                      positions.map((p) => `${p.positionTitle} 0/${p.requiredCount}`).join(' · ')
                    }}
                  </p>
                </div>
                <p v-else class="mt-3 text-[13px] text-text-secondary">
                  프로젝트 제목을 입력하면 카드 미리보기가 나타납니다.
                </p>
              </div>
            </template>

            <!-- Step 2 사이드바 -->
            <template v-if="step === 2">
              <h4 class="text-sm font-bold text-text">모집 인원 규칙</h4>
              <p class="mt-3 text-[13px] text-text-secondary">
                역할은 최소 1개가 필요합니다. 역할별 최소 1명, 전체 최대 20명까지 설정할 수
                있습니다.
              </p>
              <div class="mt-6">
                <p class="text-sm font-bold text-text">모집 요약</p>
                <p class="mt-2 text-[13px] text-text-secondary">
                  <span v-for="(pos, i) in positions" :key="pos.roleId">
                    {{ pos.positionTitle }} {{ pos.requiredCount }}명<span
                      v-if="i < positions.length - 1"
                    >
                      ·
                    </span>
                  </span>
                  <br />총 {{ totalRecruitCount }}명 모집
                </p>
              </div>
            </template>

            <!-- Step 3 사이드바 -->
            <template v-if="step === 3">
              <h4 class="text-sm font-bold text-text">필수 정보 확인</h4>
              <div class="mt-4 space-y-3">
                <div class="flex items-center justify-between">
                  <span class="text-[13px] text-text">기본 정보</span>
                  <span
                    class="rounded-full bg-primary-dark px-3 py-1 text-[11px] font-bold text-text"
                    >완료</span
                  >
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-[13px] text-text">토픽·기술</span>
                  <span
                    class="rounded-full bg-primary-dark px-3 py-1 text-[11px] font-bold text-text"
                    >완료</span
                  >
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-[13px] text-text">모집 역할</span>
                  <span
                    class="rounded-full bg-primary-dark px-3 py-1 text-[11px] font-bold text-text"
                    >완료</span
                  >
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-[13px] text-text">진행 조건</span>
                  <span
                    class="rounded-full bg-primary-dark px-3 py-1 text-[11px] font-bold text-text"
                    >완료</span
                  >
                </div>
              </div>
              <p class="mt-6 text-[13px] text-text-secondary">
                공개하면 프로젝트 목록과 추천 결과에 노출됩니다.
              </p>
            </template>
          </div>
        </aside>
      </div>
    </template>
  </div>
</template>
