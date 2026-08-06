<!--
  @view ProfileEditView
  @description 프로필 수정 화면 - 닉네임, 자기소개, 토픽, 기술스택, 역할, 외부링크, 파일
  @route /profile/edit
-->
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore'
import DefaultAvatar from '@/components/DefaultAvatar.vue'
import TechStackChip from '@/components/TechStackChip.vue'
import { type TechStackName } from '@/constants/techStacks'
import {
  fetchMyProfile,
  updateProfile,
  replaceTopics,
  replaceRoles,
  replaceTechStacks,
  checkNicknameAvailability,
  uploadFile,
  type ProfileData,
  type TechStackInput,
} from '@/api/profile'
import { fetchOnboardingOptions } from '@/api/onboarding'

const router = useRouter()
const authStore = useAuthStore()

/* ────── 상태 ────── */
const loading = ref(true)
const saving = ref(false)
const profile = ref<ProfileData | null>(null)

// 폼 필드
const nickname = ref('')
const nicknameChecked = ref(false)
const nicknameMessage = ref('')
const introduction = ref('')
const externalLinkUrl = ref('')

// 선택 가능한 목록 (온보딩 옵션에서 가져옴)
const allTopics = ref<{ topicId: number; topicName: string }[]>([])
const allRoles = ref<{ roleId: number; roleName: string }[]>([])
const allTechStacks = ref<
  { techStackId: number; techStackName: string; category: string | null }[]
>([])

// 선택된 항목
const selectedTopicIds = ref<number[]>([])
const selectedRoleIds = ref<number[]>([])
const selectedTechStacks = ref<
  { techStackId: number; techStackName: string; proficiencyLevel: string }[]
>([])

const selectedTechStackIds = computed(() => selectedTechStacks.value.map((t) => t.techStackId))

// 프로필 이미지
const profileImageUrl = ref<string | null>(null)
const profileImageFileId = ref<number | null>(null)

// 공개 자료 파일
const publicMaterialFileName = ref('')
const publicMaterialFileSize = ref('')
const publicMaterialFileId = ref<number | null>(null)

/* ────── 데이터 로드 ────── */
onMounted(async () => {
  if (!authStore.isLoggedIn) {
    router.push('/login')
    return
  }
  try {
    const [profileRes, optionsRes] = await Promise.all([fetchMyProfile(), fetchOnboardingOptions()])

    // 프로필 데이터
    profile.value = profileRes.data
    nickname.value = profileRes.data.user.nickname
    nicknameChecked.value = true
    introduction.value = profileRes.data.introduction ?? ''
    externalLinkUrl.value = profileRes.data.externalLinkUrl ?? ''
    selectedTopicIds.value = profileRes.data.topics.map((t) => t.topicId)
    selectedRoleIds.value = profileRes.data.roles.map((r) => r.roleId)
    selectedTechStacks.value = profileRes.data.techStacks.map((ts) => ({
      techStackId: ts.techStackId,
      techStackName: ts.techStackName,
      proficiencyLevel: ts.proficiencyLevel,
    }))
    profileImageUrl.value =
      profileRes.data.profileImage?.url ?? profileRes.data.user.profileImageUrl
    profileImageFileId.value = profileRes.data.profileImageFileId
    publicMaterialFileId.value = profileRes.data.publicMaterialFileId
    if (profileRes.data.publicMaterial) {
      publicMaterialFileName.value = profileRes.data.publicMaterial.originalName
      publicMaterialFileSize.value = ''
    }

    // 선택 가능 목록
    allTopics.value = optionsRes.data.topics.map((t: { topicId: number; topicName: string }) => ({
      topicId: t.topicId,
      topicName: t.topicName,
    }))
    allRoles.value = optionsRes.data.roles.map((r: { roleId: number; roleName: string }) => ({
      roleId: r.roleId,
      roleName: r.roleName,
    }))
    allTechStacks.value = optionsRes.data.techStacks.map(
      (ts: { techStackId: number; techStackName: string; category: string | null }) => ({
        techStackId: ts.techStackId,
        techStackName: ts.techStackName,
        category: ts.category,
      }),
    )
  } catch {
    router.push('/mypage')
  } finally {
    loading.value = false
  }
})

/* ────── 토픽 토글 ────── */
function toggleTopic(topicId: number) {
  const idx = selectedTopicIds.value.indexOf(topicId)
  if (idx >= 0) {
    selectedTopicIds.value.splice(idx, 1)
  } else {
    if (selectedTopicIds.value.length >= 10) return
    selectedTopicIds.value.push(topicId)
  }
}

/* ────── 역할 토글 ────── */
function toggleRole(roleId: number) {
  const idx = selectedRoleIds.value.indexOf(roleId)
  if (idx >= 0) {
    selectedRoleIds.value.splice(idx, 1)
  } else {
    if (selectedRoleIds.value.length >= 3) return
    selectedRoleIds.value.push(roleId)
  }
}

/* ────── 기술 스택 추가/제거 ────── */
function toggleTechStack(techStackId: number, techStackName: string) {
  const idx = selectedTechStacks.value.findIndex((t) => t.techStackId === techStackId)
  if (idx >= 0) {
    selectedTechStacks.value.splice(idx, 1)
  } else {
    if (selectedTechStacks.value.length >= 20) return
    selectedTechStacks.value.push({
      techStackId,
      techStackName,
      proficiencyLevel: 'BEGINNER',
    })
  }
}

const proficiencyLevels = [
  { value: 'LEARNING', label: '입문' },
  { value: 'BEGINNER', label: '초급' },
  { value: 'INTERMEDIATE', label: '중급' },
  { value: 'ADVANCED', label: '고급' },
]

/* ────── 닉네임 중복 확인 ────── */
const nicknameChecking = ref(false)

async function handleNicknameCheck() {
  if (nickname.value.length < 2 || nickname.value.length > 15) {
    nicknameMessage.value = '2~15자로 입력해주세요.'
    nicknameChecked.value = false
    return
  }
  if (nickname.value === profile.value?.user.nickname) {
    nicknameMessage.value = '현재 사용 중인 닉네임입니다.'
    nicknameChecked.value = true
    return
  }
  nicknameChecking.value = true
  try {
    const res = await checkNicknameAvailability(nickname.value)
    if (res.data.available) {
      nicknameMessage.value = '사용 가능한 닉네임입니다.'
      nicknameChecked.value = true
    } else {
      nicknameMessage.value = '이미 사용 중인 닉네임입니다.'
      nicknameChecked.value = false
    }
  } catch {
    nicknameMessage.value = '확인에 실패했습니다.'
    nicknameChecked.value = false
  } finally {
    nicknameChecking.value = false
  }
}

function onNicknameInput() {
  nicknameChecked.value = nickname.value === profile.value?.user.nickname
  nicknameMessage.value = ''
}

/* ────── 프로필 이미지 변경 ────── */
const imageUploading = ref(false)

function triggerImageUpload() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/jpeg,image/png,image/webp'
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      alert('파일 크기는 5MB 이하여야 합니다.')
      return
    }
    imageUploading.value = true
    try {
      const res = await uploadFile(file, 'PROFILE_IMAGE')
      profileImageFileId.value = res.data.file.fileId
      profileImageUrl.value = res.data.file.url
    } catch {
      alert('이미지 업로드에 실패했습니다.')
    } finally {
      imageUploading.value = false
    }
  }
  input.click()
}

/* ────── 공개 자료 파일 업로드 ────── */
const fileUploading = ref(false)

function triggerFileUpload() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'application/pdf'
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      alert('파일 크기는 5MB 이하여야 합니다.')
      return
    }
    fileUploading.value = true
    try {
      const res = await uploadFile(file, 'PUBLIC_MATERIAL')
      publicMaterialFileId.value = res.data.file.fileId
      publicMaterialFileName.value = res.data.file.originalName
      publicMaterialFileSize.value = `${(res.data.file.fileSize / 1024 / 1024).toFixed(1)}MB`
    } catch {
      alert('파일 업로드에 실패했습니다.')
    } finally {
      fileUploading.value = false
    }
  }
  input.click()
}

/* ────── 저장 ────── */
async function handleSave() {
  if (!nicknameChecked.value) {
    alert('닉네임 중복 확인을 해주세요.')
    return
  }
  if (selectedTopicIds.value.length === 0) {
    alert('관심 토픽을 1개 이상 선택해주세요.')
    return
  }
  if (selectedRoleIds.value.length === 0) {
    alert('희망 역할을 1개 이상 선택해주세요.')
    return
  }

  saving.value = true
  try {
    // 토픽, 역할, 기술스택은 별도 API로 저장
    await Promise.all([
      replaceTopics(selectedTopicIds.value),
      replaceRoles(selectedRoleIds.value.map((id, i) => ({ roleId: id, priority: i + 1 }))),
      replaceTechStacks(
        selectedTechStacks.value.map((ts) => ({
          techStackId: ts.techStackId,
          proficiencyLevel: ts.proficiencyLevel as TechStackInput['proficiencyLevel'],
          experienceMonths: 0,
          isLearning: false,
        })),
      ),
      updateProfile({
        nickname: nickname.value,
        introduction: introduction.value || null,
        externalLinkUrl: externalLinkUrl.value || null,
        profileImageFileId: profileImageFileId.value,
        publicMaterialFileId: publicMaterialFileId.value,
      }),
    ])

    await authStore.initUser()
    router.push('/mypage')
  } catch {
    alert('프로필 저장에 실패했습니다.')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-[1440px] px-12 pb-16 pt-8">
    <!-- 로딩 -->
    <template v-if="loading">
      <div class="skeleton-pulse mb-4 h-9 w-[200px] rounded bg-bg-card" />
      <div class="skeleton-pulse mb-8 h-5 w-[400px] rounded bg-bg-card" />
      <div class="flex gap-6">
        <div class="skeleton-pulse h-[718px] w-[352px] rounded-xl bg-bg-card" />
        <div class="skeleton-pulse h-[718px] flex-1 rounded-xl bg-bg-card" />
      </div>
    </template>

    <!-- 메인 -->
    <template v-else>
      <h1 class="hero-animate text-[30px] font-bold text-text">프로필 수정</h1>
      <p class="hero-animate hero-animate-delay-1 mt-2 text-sm text-text-secondary">
        지원자와 모집자가 확인할 공개 정보를 관리합니다.
      </p>

      <div class="mt-8 flex gap-6">
        <!-- 좌측: 프로필 이미지 -->
        <div
          class="hero-animate hero-animate-delay-2 w-[352px] shrink-0 rounded-xl bg-bg-card px-8 py-10"
        >
          <div class="flex flex-col items-center">
            <DefaultAvatar :size="132" :image-url="profileImageUrl" />

            <button
              class="mt-8 flex h-[46px] w-[248px] items-center justify-center rounded-full bg-text text-sm font-bold text-white transition-transform hover:scale-105 active:scale-95"
              :disabled="imageUploading"
              @click="triggerImageUpload"
            >
              {{ imageUploading ? '업로드 중...' : '이미지 변경' }}
            </button>
            <p class="mt-3 text-center text-xs text-text-secondary">JPG · PNG · WEBP / 최대 5MB</p>
          </div>

          <div class="mt-16">
            <p class="text-sm font-bold text-text">공개 범위</p>
            <p class="mt-2 text-[13px] text-text-secondary">
              이메일과 로그인 정보는 공개되지 않습니다.
            </p>
          </div>
        </div>

        <!-- 우측: 폼 -->
        <div
          class="hero-animate hero-animate-delay-3 flex-1 rounded-xl border border-border bg-white px-8 py-8"
        >
          <!-- 닉네임 -->
          <div>
            <label class="text-[13px] font-bold text-text">닉네임</label>
            <div class="mt-2 flex gap-3">
              <input
                v-model="nickname"
                type="text"
                maxlength="15"
                class="h-[48px] flex-1 rounded-lg border border-border bg-white px-4 text-[13px] text-text outline-none focus:border-text"
                @input="onNicknameInput"
              />
              <button
                class="h-[46px] w-[124px] rounded-full bg-text text-sm font-bold text-white transition-transform hover:scale-105 active:scale-95"
                :disabled="nicknameChecking"
                @click="handleNicknameCheck"
              >
                {{ nicknameChecking ? '확인 중' : '중복 확인' }}
              </button>
            </div>
            <p
              v-if="nicknameMessage"
              :class="['mt-1.5 text-xs', nicknameChecked ? 'text-green-600' : 'text-red-500']"
            >
              {{ nicknameMessage }}
            </p>
          </div>

          <!-- 자기소개 -->
          <div class="mt-6">
            <label class="text-[13px] font-bold text-text">자기소개</label>
            <textarea
              v-model="introduction"
              maxlength="500"
              rows="3"
              class="mt-2 w-full resize-none rounded-lg border border-border bg-white px-4 py-3 text-[13px] text-text outline-none focus:border-text"
              placeholder="자신을 소개하는 글을 작성하세요."
            />
          </div>

          <!-- 관심 토픽 -->
          <div class="mt-6">
            <p class="text-[13px] font-bold text-text">
              관심 토픽
              <span class="ml-2 font-normal text-text-secondary"
                >{{ selectedTopicIds.length }} / 10</span
              >
            </p>
            <div class="mt-3 flex flex-wrap gap-2">
              <button
                v-for="topic in allTopics"
                :key="topic.topicId"
                :class="[
                  'rounded-full px-4 py-2 text-xs font-bold transition-all',
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

          <!-- 희망 역할 -->
          <div class="mt-6">
            <p class="text-[13px] font-bold text-text">
              희망 역할
              <span class="ml-2 font-normal text-text-secondary"
                >{{ selectedRoleIds.length }} / 3</span
              >
            </p>
            <div class="mt-3 flex flex-wrap gap-2">
              <button
                v-for="role in allRoles"
                :key="role.roleId"
                :class="[
                  'rounded-full px-4 py-2 text-xs font-bold transition-all',
                  selectedRoleIds.includes(role.roleId)
                    ? 'bg-text text-white'
                    : 'border border-border bg-white text-text hover:bg-bg-muted',
                ]"
                @click="toggleRole(role.roleId)"
              >
                {{ role.roleName }}
                <span v-if="selectedRoleIds.includes(role.roleId)"> ×</span>
              </button>
            </div>
          </div>

          <!-- 기술 스택 -->
          <div class="mt-6">
            <p class="text-[13px] font-bold text-text">
              기술 스택
              <span class="ml-2 font-normal text-text-secondary"
                >{{ selectedTechStackIds.length }} / 20</span
              >
            </p>
            <!-- 전체 목록에서 선택 -->
            <div class="mt-3 flex flex-wrap gap-2">
              <button
                v-for="ts in allTechStacks"
                :key="ts.techStackId"
                :class="[
                  'transition-all',
                  selectedTechStackIds.includes(ts.techStackId)
                    ? 'opacity-100'
                    : 'opacity-70 hover:opacity-100',
                ]"
                @click="toggleTechStack(ts.techStackId, ts.techStackName)"
              >
                <TechStackChip
                  :name="ts.techStackName as TechStackName"
                  :theme="selectedTechStackIds.includes(ts.techStackId) ? 'dark' : 'light'"
                />
              </button>
            </div>
            <!-- 선택된 항목 숙련도 조절 -->
            <div v-if="selectedTechStacks.length" class="mt-4 flex flex-col gap-2">
              <div
                v-for="ts in selectedTechStacks"
                :key="ts.techStackId"
                class="flex items-center gap-3 rounded-lg bg-bg-card px-4 py-3"
              >
                <span class="min-w-[100px] text-[13px] font-bold text-text">{{
                  ts.techStackName
                }}</span>
                <div class="flex gap-1">
                  <button
                    v-for="level in proficiencyLevels"
                    :key="level.value"
                    :class="[
                      'rounded-full px-3 py-1 text-[11px] font-bold transition-all',
                      ts.proficiencyLevel === level.value
                        ? 'bg-text text-white'
                        : 'border border-border bg-white text-text hover:bg-bg-muted',
                    ]"
                    @click="ts.proficiencyLevel = level.value"
                  >
                    {{ level.label }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 외부 링크 -->
          <div class="mt-6">
            <label class="text-[13px] font-bold text-text">외부 링크 (선택)</label>
            <input
              v-model="externalLinkUrl"
              type="url"
              class="mt-2 h-[44px] w-full rounded-lg border border-border bg-white px-4 text-[13px] text-text outline-none focus:border-text"
              placeholder="GitHub, 블로그 등 URL"
            />
            <p class="mt-1.5 text-xs text-text-secondary">
              입력한 링크만 공개 프로필에 표시됩니다.
            </p>
          </div>

          <!-- 파일 -->
          <div class="mt-6">
            <p class="text-base font-semibold text-text">파일</p>
            <div class="mt-3 flex items-center gap-3">
              <div
                v-if="publicMaterialFileName"
                class="flex h-[48px] flex-1 items-center justify-between rounded-lg border border-border bg-white px-4"
              >
                <span class="text-sm font-semibold text-text">{{ publicMaterialFileName }}</span>
                <span class="text-[13px] text-text-secondary"
                  >PDF · {{ publicMaterialFileSize }}</span
                >
              </div>
              <div
                v-else
                class="flex h-[48px] flex-1 items-center rounded-lg border border-border bg-white px-4"
              >
                <span class="text-[13px] text-text-secondary">공개 자료 파일을 선택하세요</span>
              </div>
              <button
                class="h-[34px] rounded-full bg-text px-5 text-sm font-semibold text-white transition-transform hover:scale-105 active:scale-95"
                :disabled="fileUploading"
                @click="triggerFileUpload"
              >
                {{ fileUploading ? '업로드 중' : '파일 선택' }}
              </button>
            </div>
          </div>

          <!-- 저장 버튼 -->
          <div class="mt-10 flex justify-end">
            <button
              class="h-[46px] w-[234px] rounded-full bg-text text-sm font-bold text-white transition-transform hover:scale-105 active:scale-95"
              :disabled="saving"
              @click="handleSave"
            >
              {{ saving ? '저장 중...' : '저장' }}
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
