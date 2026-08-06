<!--
  @component OnboardingView
  @description 온보딩 3단계: 관심 토픽 → 기술 스택 → 희망 역할·자료.
  API에서 선택지를 가져오고 완료 시 일괄 저장한다.
-->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore'
import {
  fetchOnboardingOptions,
  saveOnboarding,
  type TopicItem,
  type TechStackItem,
  type RoleItem,
  type TechStackSelection,
  type RoleSelection,
} from '@/api/onboarding'
import DefaultAvatar from '@/components/DefaultAvatar.vue'
import TechStackChip from '@/components/TechStackChip.vue'
import { type TechStackName } from '@/constants/techStacks'

const router = useRouter()
const authStore = useAuthStore()

/* ────── 상태 ────── */
const step = ref<1 | 2 | 3 | 4>(1)
const loading = ref(true)
const submitting = ref(false)
const error = ref('')

// 기준정보
const topics = ref<TopicItem[]>([])
const techStacks = ref<TechStackItem[]>([])
const roles = ref<RoleItem[]>([])

// 선택값
const selectedTopicIds = ref<number[]>([])
const selectedTechStacks = ref<TechStackSelection[]>([])
const selectedRoles = ref<RoleSelection[]>([])
const externalLinkUrl = ref('')
const selectedFile = ref<File | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)

function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files && input.files[0]) {
    const file = input.files[0]
    if (file.size > 5 * 1024 * 1024) {
      alert('파일 크기는 5MB 이하만 가능합니다.')
      return
    }
    selectedFile.value = file
  }
}

function triggerFileInput() {
  fileInputRef.value?.click()
}

const PROFICIENCY_LABELS: Record<string, string> = {
  LEARNING: '입문',
  BEGINNER: '초급',
  INTERMEDIATE: '중급',
  ADVANCED: '고급',
}

/* ────── 초기 데이터 로드 ────── */
onMounted(async () => {
  try {
    const res = await fetchOnboardingOptions()
    topics.value = res.data.topics
    techStacks.value = res.data.techStacks
    roles.value = res.data.roles

    // 기존 선택값 복원
    selectedTopicIds.value = res.data.currentSelection.topicIds
  } catch {
    error.value = '정보를 불러오지 못했어요.'
  } finally {
    loading.value = false
  }
})

/* ────── Step 1: 토픽 ────── */
const topicLimitMessage = ref('')

function toggleTopic(id: number) {
  const idx = selectedTopicIds.value.indexOf(id)
  if (idx >= 0) {
    selectedTopicIds.value.splice(idx, 1)
    topicLimitMessage.value = ''
  } else if (selectedTopicIds.value.length < 10) {
    selectedTopicIds.value.push(id)
    topicLimitMessage.value = ''
  } else {
    topicLimitMessage.value = '10개 이상 선택이 불가합니다.'
    setTimeout(() => {
      topicLimitMessage.value = ''
    }, 2500)
  }
}

const canGoStep2 = computed(() => selectedTopicIds.value.length >= 1)

/* ────── Step 2: 기술 스택 ────── */
function toggleTechStack(id: number) {
  const idx = selectedTechStacks.value.findIndex((t) => t.techStackId === id)
  if (idx >= 0) {
    selectedTechStacks.value.splice(idx, 1)
  } else if (selectedTechStacks.value.length < 20) {
    selectedTechStacks.value.push({
      techStackId: id,
      proficiencyLevel: 'BEGINNER',
      experienceMonths: 0,
      isLearning: false,
    })
  }
}

function isTechSelected(id: number) {
  return selectedTechStacks.value.some((t) => t.techStackId === id)
}

function getProficiency(id: number) {
  return selectedTechStacks.value.find((t) => t.techStackId === id)?.proficiencyLevel ?? 'BEGINNER'
}

function setProficiency(id: number, level: TechStackSelection['proficiencyLevel']) {
  const item = selectedTechStacks.value.find((t) => t.techStackId === id)
  if (item) item.proficiencyLevel = level
}

function getTechName(id: number) {
  return techStacks.value.find((t) => t.techStackId === id)?.techStackName ?? ''
}

const canGoStep3 = computed(() => selectedTechStacks.value.length >= 1)

/* ────── Step 3: 역할 ────── */
function toggleRole(id: number) {
  const idx = selectedRoles.value.findIndex((r) => r.roleId === id)
  if (idx >= 0) {
    selectedRoles.value.splice(idx, 1)
    // 우선순위 재정렬
    selectedRoles.value.forEach((r, i) => {
      r.priority = i + 1
    })
  } else if (selectedRoles.value.length < 3) {
    selectedRoles.value.push({
      roleId: id,
      priority: selectedRoles.value.length + 1,
      experienceLevel: 'BEGINNER',
    })
  }
}

function isRoleSelected(id: number) {
  return selectedRoles.value.some((r) => r.roleId === id)
}

const canSubmit = computed(() => selectedRoles.value.length >= 1)

/* ────── 제출 ────── */
async function handleSubmit() {
  error.value = ''
  submitting.value = true
  try {
    await saveOnboarding({
      topicIds: selectedTopicIds.value,
      techStacks: selectedTechStacks.value,
      roles: selectedRoles.value,
    })
    await authStore.initUser()
    step.value = 4
  } catch {
    error.value = '저장에 실패했어요. 다시 시도해 주세요.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-[1440px] px-12 pb-16 pt-10">
    <!-- 제목 -->
    <h1 class="text-[32px] font-bold text-text">
      {{
        step === 1
          ? '관심 있는 프로젝트 분야를 선택하세요.'
          : step === 2
            ? '보유하거나 학습 중인 기술을 설정하세요.'
            : '프로젝트에서 맡고 싶은 역할을 설정하세요.'
      }}
    </h1>
    <p class="mt-2 text-sm text-text-secondary">회원가입 후 필요한 정보를 3단계로 설정합니다.</p>

    <!-- 스텝 인디케이터 -->
    <div class="mt-5 grid grid-cols-3 text-sm">
      <div>
        <span :class="step === 1 ? 'font-bold text-text' : 'text-text-secondary'"
          >1. 관심 토픽</span
        >
        <div
          class="mt-2 h-1 w-full rounded-full"
          :class="step === 1 ? 'bg-primary-dark' : 'bg-transparent'"
        />
      </div>
      <div>
        <span :class="step === 2 ? 'font-bold text-text' : 'text-text-secondary'"
          >2. 기술 스택</span
        >
        <div
          class="mt-2 h-1 w-full rounded-full"
          :class="step === 2 ? 'bg-primary-dark' : 'bg-transparent'"
        />
      </div>
      <div>
        <span :class="step === 3 ? 'font-bold text-text' : 'text-text-secondary'"
          >3. 희망 역할·자료</span
        >
        <div
          class="mt-2 h-1 w-full rounded-full"
          :class="step === 3 ? 'bg-primary-dark' : 'bg-transparent'"
        />
      </div>
    </div>

    <!-- 로딩 -->
    <div v-if="loading" class="mt-10 flex justify-center">
      <div class="size-8 animate-spin rounded-full border-4 border-border border-t-text" />
    </div>

    <!-- 콘텐츠 -->
    <template v-else>
      <div class="mt-8 flex gap-6">
        <!-- 왼쪽: 스텝 영역 -->
        <div class="flex-1">
          <transition name="fade-in-up" mode="out-in">
            <!-- ═══ Step 1: 토픽 선택 ═══ -->
            <div v-if="step === 1" key="step1">
              <div class="rounded-xl border border-border bg-white p-8">
                <span
                  class="inline-block rounded-full bg-primary-dark px-3 py-2 text-xs font-bold text-text"
                  >STEP 1 OF 3</span
                >
                <p class="mt-4 text-sm text-text-secondary">
                  최소 1개, 최대 10개까지 선택할 수 있어요.
                </p>

                <div class="mt-6 flex flex-wrap gap-3">
                  <button
                    v-for="topic in topics"
                    :key="topic.topicId"
                    type="button"
                    :class="[
                      'rounded-full border px-4 py-2 text-xs font-bold transition-all',
                      selectedTopicIds.includes(topic.topicId)
                        ? 'border-text bg-text text-white'
                        : 'border-border bg-white text-text hover:border-text',
                    ]"
                    @click="toggleTopic(topic.topicId)"
                  >
                    {{ topic.topicName }}
                  </button>
                </div>

                <!-- 선택된 토픽 -->
                <div v-if="selectedTopicIds.length" class="mt-8">
                  <p class="text-sm font-bold text-text">
                    선택됨 {{ selectedTopicIds.length }} / 10
                  </p>
                  <transition name="fade-in-up">
                    <p v-if="topicLimitMessage" class="mt-2 text-[13px] font-bold text-[#d43f21]">
                      {{ topicLimitMessage }}
                    </p>
                  </transition>
                  <div class="mt-3 flex flex-wrap gap-2">
                    <span
                      v-for="id in selectedTopicIds"
                      :key="id"
                      class="stagger-item flex items-center gap-1 rounded-full bg-text px-3 py-2 text-xs font-bold text-white"
                    >
                      {{ topics.find((t) => t.topicId === id)?.topicName }} ×
                      <button
                        type="button"
                        class="ml-0.5 text-white/60 hover:text-white"
                        @click="toggleTopic(id)"
                      ></button>
                    </span>
                  </div>
                </div>

                <!-- 다음 버튼 (카드 안) -->
                <div class="mt-8 flex justify-end">
                  <button
                    :disabled="!canGoStep2"
                    class="flex h-[46px] items-center justify-center rounded-full bg-text px-8 text-sm font-bold text-white transition-transform hover:scale-105 disabled:opacity-40"
                    @click="step = 2"
                  >
                    다음
                  </button>
                </div>
              </div>
            </div>

            <!-- ═══ Step 2: 기술 스택 ═══ -->
            <div v-else-if="step === 2" key="step2" class="mt-8">
              <div class="rounded-xl border border-border bg-white p-8">
                <span
                  class="inline-block rounded-full bg-primary-dark px-3 py-2 text-xs font-bold text-text"
                  >STEP 2 OF 3</span
                >
                <p class="mt-4 text-sm text-text-secondary">
                  최대 20개 · 숙련도는 입문/초급/중급/고급
                </p>

                <!-- 기술 선택 칩 -->
                <div class="mt-6 flex flex-wrap gap-2">
                  <button
                    v-for="tech in techStacks"
                    :key="tech.techStackId"
                    type="button"
                    class="transition-all"
                    :class="isTechSelected(tech.techStackId) ? 'opacity-50' : 'hover:scale-105'"
                    @click="toggleTechStack(tech.techStackId)"
                  >
                    <TechStackChip
                      :name="tech.techStackName as TechStackName"
                      :theme="isTechSelected(tech.techStackId) ? 'dark' : 'light'"
                    />
                  </button>
                </div>

                <!-- 선택된 기술 + 숙련도 -->
                <div v-if="selectedTechStacks.length" class="mt-8 space-y-3">
                  <div
                    v-for="ts in selectedTechStacks"
                    :key="ts.techStackId"
                    class="stagger-item flex items-center justify-between rounded-lg border border-border px-4 py-3"
                  >
                    <span class="text-sm font-bold text-text">{{
                      getTechName(ts.techStackId)
                    }}</span>
                    <div class="flex gap-1">
                      <button
                        v-for="level in [
                          'LEARNING',
                          'BEGINNER',
                          'INTERMEDIATE',
                          'ADVANCED',
                        ] as const"
                        :key="level"
                        type="button"
                        :class="[
                          'rounded-full px-3 py-1 text-[11px] font-bold transition-all',
                          getProficiency(ts.techStackId) === level
                            ? 'bg-text text-white'
                            : 'bg-bg-muted text-text-secondary hover:bg-border',
                        ]"
                        @click="setProficiency(ts.techStackId, level)"
                      >
                        {{ PROFICIENCY_LABELS[level] }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div class="mt-6 flex justify-between">
                <button
                  class="flex h-[46px] items-center justify-center rounded-full border border-border px-8 text-sm font-bold text-text transition-transform hover:scale-105"
                  @click="step = 1"
                >
                  이전
                </button>
                <button
                  :disabled="!canGoStep3"
                  class="flex h-[46px] items-center justify-center rounded-full bg-text px-8 text-sm font-bold text-white transition-transform hover:scale-105 disabled:opacity-40"
                  @click="step = 3"
                >
                  다음
                </button>
              </div>
            </div>

            <!-- ═══ Step 3: 희망 역할 ═══ -->
            <div v-else-if="step === 3" key="step3" class="mt-8">
              <div class="rounded-xl border border-border bg-white p-8">
                <span
                  class="inline-block rounded-full bg-primary-dark px-3 py-2 text-xs font-bold text-text"
                  >STEP 3 OF 3</span
                >
                <p class="mt-4 text-sm text-text-secondary">
                  최소 1개, 최대 3개까지 선택할 수 있어요.
                </p>

                <!-- 역할 카드 -->
                <div class="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <button
                    v-for="role in roles"
                    :key="role.roleId"
                    type="button"
                    :class="[
                      'flex flex-col items-start rounded-xl border p-5 text-left transition-all',
                      isRoleSelected(role.roleId)
                        ? 'border-text bg-text text-white'
                        : 'border-border bg-white hover:border-text',
                    ]"
                    @click="toggleRole(role.roleId)"
                  >
                    <span
                      class="text-base font-bold"
                      :class="isRoleSelected(role.roleId) ? 'text-white' : 'text-text'"
                      >{{ role.roleName }}</span
                    >
                    <span
                      class="mt-2 text-xs"
                      :class="isRoleSelected(role.roleId) ? 'text-white/70' : 'text-text-secondary'"
                    >
                      {{ isRoleSelected(role.roleId) ? '선택됨' : '선택하기' }}
                    </span>
                  </button>
                </div>

                <p v-if="selectedRoles.length" class="mt-6 text-sm font-bold text-text">
                  선택됨 {{ selectedRoles.length }} / 3
                </p>

                <!-- 공개 프로필 자료 (선택) -->
                <div class="mt-8 border-t border-border pt-8">
                  <h3 class="text-base font-bold text-text">공개 프로필 자료 (선택)</h3>

                  <div class="mt-5 grid grid-cols-1 gap-6 md:grid-cols-2">
                    <!-- 외부 URL -->
                    <div>
                      <label class="block text-[13px] font-bold text-text">외부 URL</label>
                      <input
                        v-model="externalLinkUrl"
                        type="url"
                        placeholder="GitHub, 블로그, Notion 등 URL"
                        class="mt-2 h-12 w-full rounded-lg border border-border px-4 text-sm text-text placeholder:text-[#8d8d8d] focus:border-text focus:outline-none"
                      />
                    </div>

                    <!-- 파일 -->
                    <div>
                      <label class="block text-[13px] font-bold text-text">파일</label>
                      <input
                        ref="fileInputRef"
                        type="file"
                        accept=".pdf"
                        class="hidden"
                        @change="handleFileSelect"
                      />
                      <div class="mt-2 flex h-12 items-center gap-3">
                        <div
                          class="flex h-12 flex-1 items-center rounded-lg border border-border px-4"
                        >
                          <span v-if="selectedFile" class="text-sm text-text">
                            {{ selectedFile.name }}
                            <span class="ml-2 text-text-secondary"
                              >{{ (selectedFile.size / 1024 / 1024).toFixed(1) }}MB</span
                            >
                          </span>
                          <span v-else class="text-sm text-[#8d8d8d]">PDF · 최대 5MB</span>
                        </div>
                        <button
                          type="button"
                          class="h-12 shrink-0 rounded-full bg-text px-5 text-sm font-bold text-white transition-transform hover:scale-105"
                          @click="triggerFileInput"
                        >
                          파일 선택
                        </button>
                      </div>
                    </div>
                  </div>

                  <p class="mt-3 text-[11px] text-text-secondary">
                    외부 URL 또는 파일을 등록하면 공개 프로필에 표시됩니다.
                  </p>
                </div>
              </div>

              <!-- 에러 -->
              <p v-if="error" class="mt-4 text-[13px] text-[#d43f21]">{{ error }}</p>

              <!-- 하단 버튼 -->
              <div class="mt-6 flex justify-end gap-4">
                <button
                  class="flex h-[46px] items-center justify-center rounded-full border border-border px-8 text-sm font-bold text-text transition-transform hover:scale-105"
                  @click="step = 2"
                >
                  이전
                </button>
                <button
                  :disabled="!canSubmit || submitting"
                  class="flex h-[46px] items-center justify-center rounded-full bg-primary-dark px-8 text-sm font-bold text-text transition-transform hover:scale-105 disabled:opacity-40"
                  @click="handleSubmit"
                >
                  {{ submitting ? '저장 중...' : '프로필 완성' }}
                </button>
              </div>
            </div>

            <!-- ═══ Step 4: 완료 ═══ -->
            <div
              v-else-if="step === 4"
              key="step4"
              class="mt-8 flex flex-col items-center rounded-xl border border-border bg-white py-16"
            >
              <div
                class="check-bounce flex size-[104px] items-center justify-center rounded-full bg-primary-dark"
              >
                <span class="text-4xl text-text">✓</span>
              </div>
              <h2 class="hero-animate hero-animate-delay-1 mt-6 text-2xl font-bold text-text">
                프로필 설정이 완료되었어요
              </h2>
              <p class="hero-animate hero-animate-delay-2 mt-3 text-sm text-text-secondary">
                이제 나와 잘 맞는 프로젝트를 추천받을 수 있어요.
              </p>
              <button
                class="hero-animate hero-animate-delay-3 mt-8 flex h-[46px] items-center justify-center rounded-full bg-text px-8 text-sm font-bold text-white transition-transform hover:scale-105"
                @click="router.push('/')"
              >
                홈으로 이동
              </button>
            </div>
          </transition>
        </div>
        <!-- 오른쪽: 프로필 미리보기 -->
        <aside class="hidden w-[420px] shrink-0 lg:block">
          <div class="sticky top-[100px] rounded-xl bg-bg-card p-7">
            <h3 class="text-base font-bold text-text">프로필 미리보기</h3>

            <!-- 아바타 + 이름 -->
            <div class="mt-5 flex items-center gap-3">
              <DefaultAvatar :size="60" />
              <div>
                <p class="text-base font-bold text-text">백현빈</p>
                <p class="text-[13px] text-text-secondary">백엔드 개발자</p>
              </div>
            </div>

            <!-- 관심 토픽 -->
            <div v-if="selectedTopicIds.length" class="mt-6">
              <p class="text-[13px] text-text-secondary">관심 토픽</p>
              <p class="mt-2 text-sm font-bold text-text">
                {{
                  selectedTopicIds
                    .map((id) => topics.find((t) => t.topicId === id)?.topicName)
                    .join(' · ')
                }}
              </p>
            </div>

            <!-- 기술 스택 -->
            <div v-if="selectedTechStacks.length" class="mt-5">
              <p class="text-[13px] text-text-secondary">기술 스택</p>
              <div class="mt-2 flex flex-wrap gap-1.5">
                <span
                  v-for="ts in selectedTechStacks.slice(0, 5)"
                  :key="ts.techStackId"
                  class="rounded-full bg-bg-muted px-2.5 py-1 text-[11px] font-bold text-text"
                >
                  {{ getTechName(ts.techStackId) }}
                </span>
                <span
                  v-if="selectedTechStacks.length > 5"
                  class="rounded-full bg-bg-muted px-2.5 py-1 text-[11px] text-text-secondary"
                >
                  +{{ selectedTechStacks.length - 5 }}
                </span>
              </div>
            </div>

            <!-- 희망 역할 -->
            <div v-if="selectedRoles.length" class="mt-5">
              <p class="text-[13px] text-text-secondary">희망 역할</p>
              <p class="mt-2 text-sm font-bold text-text">
                {{
                  selectedRoles
                    .map((r) => roles.find((role) => role.roleId === r.roleId)?.roleName)
                    .join(' · ')
                }}
              </p>
            </div>

            <!-- 다음 단계 안내 -->
            <p class="mt-8 text-[12px] leading-relaxed text-text-secondary">
              {{
                step === 1
                  ? '다음 단계에서 기술 스택과 숙련도를 선택합니다.'
                  : step === 2
                    ? '다음 단계에서 희망 역할과 공개 자료를 설정합니다.'
                    : '프로필 완성 버튼을 누르면 홈으로 이동합니다.'
              }}
            </p>
          </div>
        </aside>
      </div>
    </template>
  </div>
</template>
