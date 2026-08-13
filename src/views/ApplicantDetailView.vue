<!--
  @view ApplicantDetailView
  @description 지원자 상세 검토 화면 - 지원자 프로필 + 지원 내용 + 승인/거절
  @route /projects/:id/applicants/:applicationId
-->
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore'
import DefaultAvatar from '@/components/DefaultAvatar.vue'
import TechStackChip from '@/components/TechStackChip.vue'
import PdfViewer from '@/components/PdfViewer.vue'
import { type TechStackName } from '@/constants/techStacks'
import apiClient from '@/api/client'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const projectId = computed(() => Number(route.params.id))
const applicationId = computed(() => Number(route.params.applicationId))

/* ────── 상태 ────── */
const loading = ref(true)
const application = ref<Record<string, unknown> | null>(null)
const applicantProfile = ref<Record<string, unknown> | null>(null)
const processing = ref(false)

/* ────── Computed 헬퍼 ────── */
const applicantNickname = computed(() =>
  (applicantProfile.value as Record<string, unknown> | null)?.nickname as string ?? '',
)
const applicantRolesText = computed(() => {
  const roles = (applicantProfile.value as Record<string, unknown> | null)?.roles as Array<Record<string, unknown>> | undefined
  return roles?.map((r) => r.roleName).join(' · ') ?? ''
})

/* ────── 데이터 로드 ────── */
onMounted(async () => {
  if (!authStore.isLoggedIn) {
    router.push('/login')
    return
  }
  try {
    const { data } = await apiClient.get(`/api/v1/applications/${applicationId.value}`)
    application.value = data.data.application
    applicantProfile.value = data.data.applicantProfile
  } catch {
    router.push(`/projects/${projectId.value}/applicants`)
  } finally {
    loading.value = false
  }
})

/* ────── 승인/거절 완료 상태 ────── */
const acceptSuccess = ref(false)
const capacityError = ref(false)
const confirmAcceptOpen = ref(false)

/* ────── 승인 ────── */
function requestAccept() {
  confirmAcceptOpen.value = true
}

async function handleAccept() {
  confirmAcceptOpen.value = false
  processing.value = true
  try {
    await apiClient.patch(`/api/v1/applications/${applicationId.value}/accept`, {})
    acceptSuccess.value = true
  } catch (err: unknown) {
    const axiosErr = err as { response?: { status?: number } }
    if (axiosErr.response?.status === 409) {
      capacityError.value = true
    } else {
      alert('승인에 실패했습니다.')
    }
  } finally {
    processing.value = false
  }
}

/* ────── 거절 ────── */
async function handleReject() {
  if (!confirm('지원자를 거절할까요?')) return
  processing.value = true
  try {
    await apiClient.patch(`/api/v1/applications/${applicationId.value}/reject`, {
      rejectionReasonCode: 'ROLE_MISMATCH',
      rejectionReason: null,
    })
    alert('거절되었습니다.')
    router.push(`/projects/${projectId.value}/applicants`)
  } catch {
    alert('거절에 실패했습니다.')
  } finally {
    processing.value = false
  }
}

/* ────── 파일 미리보기 모달 ────── */
const filePreviewOpen = ref(false)
const filePreviewUrl = ref('')
const filePreviewName = ref('')

function openFilePreview(url: string, name: string) {
  filePreviewUrl.value = url
  filePreviewName.value = name
  filePreviewOpen.value = true
}

function openPublicMaterialPreview() {
  const pm = (applicantProfile.value as Record<string, unknown> | null)?.publicMaterial as Record<string, unknown> | undefined
  if (pm) {
    openFilePreview(pm.url as string, pm.originalName as string)
  }
}

function closeFilePreview() {
  filePreviewOpen.value = false
  filePreviewUrl.value = ''
  filePreviewName.value = ''
}
function formatDate(dateStr: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function proficiencyLabel(level: string): string {
  const map: Record<string, string> = { LEARNING: '입문', BEGINNER: '초급', INTERMEDIATE: '중급', ADVANCED: '고급' }
  return map[level] ?? level
}
</script>

<template>
  <div class="mx-auto max-w-[1440px] px-12 pb-16 pt-8">
    <!-- 로딩 -->
    <template v-if="loading">
      <div class="skeleton-pulse mb-4 h-9 w-[200px] rounded bg-bg-card" />
      <div class="skeleton-pulse mb-8 h-5 w-[400px] rounded bg-bg-card" />
      <div class="flex gap-6">
        <div class="skeleton-pulse h-[716px] w-[500px] rounded-xl bg-bg-card" />
        <div class="skeleton-pulse h-[716px] flex-1 rounded-xl bg-bg-card" />
      </div>
    </template>

    <!-- 메인 -->
    <template v-else-if="application && applicantProfile">
      <h1 class="hero-animate text-[30px] font-bold text-text">지원자 상세</h1>
      <p class="hero-animate hero-animate-delay-1 mt-2 text-sm text-text-secondary">
        지원 시 제출한 공개 정보와 메시지를 검토합니다.
      </p>

      <div class="mt-8 flex gap-6">
        <!-- 좌측: 지원자 프로필 -->
        <div class="hero-animate hero-animate-delay-2 w-[500px] shrink-0 rounded-xl bg-bg-card p-7">
          <!-- 아바타 + 이름 -->
          <div class="flex items-center gap-4">
            <DefaultAvatar
              :size="94"
              :image-url="(applicantProfile as Record<string, unknown>).profileImage ? ((applicantProfile as Record<string, unknown>).profileImage as Record<string, unknown>).url as string : null"
            />
            <div>
              <router-link
                :to="`/users/${(applicantProfile as Record<string, unknown>).userId}`"
                class="text-xl font-bold text-text hover:underline"
              >
                {{ applicantNickname }}
              </router-link>
              <p class="mt-1 text-sm text-text-secondary">
                {{ applicantRolesText }}
              </p>
            </div>
          </div>

          <!-- 희망 역할 -->
          <div class="mt-8">
            <p class="text-[13px] text-text-secondary">희망 역할</p>
            <div class="mt-2 flex flex-wrap gap-2">
              <span
                v-for="role in ((applicantProfile as Record<string, unknown>).roles as Array<Record<string, unknown>>) || []"
                :key="(role.roleId as number)"
                class="rounded-full border border-border bg-white px-4 py-1.5 text-xs font-bold text-text"
              >
                {{ role.roleName }}
              </span>
            </div>
          </div>

          <!-- 기술 스택 -->
          <div class="mt-6">
            <p class="text-[13px] text-text-secondary">기술 스택</p>
            <div class="mt-2 flex flex-col gap-2">
              <div
                v-for="ts in ((applicantProfile as Record<string, unknown>).techStacks as Array<Record<string, unknown>>) || []"
                :key="(ts.techStackId as number)"
                class="flex items-center justify-between"
              >
                <div class="flex items-center gap-2">
                  <TechStackChip :name="(ts.techStackName as TechStackName)" theme="light" />
                </div>
                <span class="rounded-full border border-border bg-white px-3 py-1 text-[11px] text-text">
                  {{ proficiencyLabel(ts.proficiencyLevel as string) }}
                </span>
              </div>
            </div>
          </div>

          <!-- 공개 자료 -->
          <div class="mt-6">
            <p class="text-[13px] text-text-secondary">공개 자료</p>
            <div class="mt-2 flex flex-col gap-2">
              <div
                v-if="(applicantProfile as Record<string, unknown>).externalLinkUrl"
                class="flex items-center justify-between rounded-lg border border-border bg-white px-4 py-2.5 text-sm text-text"
              >
                외부 링크
                <a
                  :href="(applicantProfile as Record<string, unknown>).externalLinkUrl as string"
                  target="_blank"
                  class="text-xs font-bold text-text hover:underline"
                >
                  열기
                </a>
              </div>
              <div
                v-if="(applicantProfile as Record<string, unknown>).publicMaterial"
                class="flex items-center justify-between rounded-lg border border-border bg-white px-4 py-2.5 text-sm text-text"
              >
                {{ ((applicantProfile as Record<string, unknown>).publicMaterial as Record<string, unknown>).originalName }}
                <button
                  class="text-xs font-bold text-text hover:underline"
                  @click="openPublicMaterialPreview"
                >
                  보기
                </button>
              </div>
            </div>
            <p class="mt-3 text-xs text-text-secondary">
              파일은 사이트 내 미리보기로 열리며 다운로드는 제공하지 않습니다.
            </p>
          </div>

          <p class="mt-6 text-xs text-text-secondary">
            이메일과 비공개 연락처는 승인 전 노출하지 않습니다.
          </p>
        </div>

        <!-- 우측: 지원 정보 -->
        <div class="hero-animate hero-animate-delay-3 flex-1 rounded-xl border border-border bg-white p-7">
          <!-- 지원 역할 -->
          <div>
            <p class="text-[13px] text-text-secondary">지원 역할</p>
            <h3 class="mt-1 text-lg font-bold text-text">
              {{ (application as Record<string, unknown>).positionTitle ?? `포지션 #${(application as Record<string, unknown>).projectPositionId}` }}
            </h3>
          </div>

          <!-- 지원 메시지 -->
          <div class="mt-8">
            <p class="text-base font-bold text-text">지원 메시지</p>
            <div class="mt-3 min-h-[220px] rounded-lg border border-border bg-bg-card p-5 text-sm leading-relaxed text-text">
              {{ (application as Record<string, unknown>).applicationMessage || '메시지 없음' }}
            </div>
          </div>

          <!-- 지원 일시 -->
          <p class="mt-6 text-[13px] text-text-secondary">
            지원 일시 {{ formatDate((application as Record<string, unknown>).appliedAt as string) }}
          </p>

          <!-- 버튼 -->
          <div
            v-if="(application as Record<string, unknown>).applicationStatus === 'PENDING'"
            class="mt-10 flex justify-end gap-3"
          >
            <button
              class="h-[46px] w-[210px] rounded-full border border-border bg-white text-sm font-bold text-text transition-all hover:bg-bg-muted active:scale-95"
              :disabled="processing"
              @click="handleReject"
            >
              거절
            </button>
            <button
              class="h-[46px] w-[230px] rounded-full bg-text text-sm font-bold text-white transition-all hover:opacity-80 active:scale-95"
              :disabled="processing"
              @click="requestAccept"
            >
              승인
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- 승인 확인 모달 -->
    <transition name="fade-in-up">
      <div
        v-if="confirmAcceptOpen"
        class="fixed inset-0 z-[100] flex items-center justify-center bg-black/40"
      >
        <div class="w-[780px] rounded-2xl bg-white px-12 py-12 shadow-2xl">
          <div class="flex size-[58px] items-center justify-center rounded-full border-2 border-text">
            <span class="text-xl font-bold text-text">?</span>
          </div>
          <h2 class="mt-6 text-2xl font-bold text-text">지원자를 승인할까요?</h2>
          <p class="mt-3 text-sm text-text-secondary">
            승인하면 해당 역할의 충원 인원이 증가하고 지원자에게 결과가 전달됩니다.
          </p>
          <div class="mt-10 flex gap-4">
            <button
              class="h-[46px] flex-1 rounded-full border border-border bg-white text-sm font-bold text-text transition-all hover:bg-bg-muted"
              @click="confirmAcceptOpen = false"
            >
              취소
            </button>
            <button
              class="h-[46px] flex-1 rounded-full bg-text text-sm font-bold text-white transition-all hover:opacity-80"
              @click="handleAccept"
            >
              승인하기
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- 승인 완료 오버레이 -->
    <transition name="fade-in-up">
      <div
        v-if="acceptSuccess"
        class="fixed inset-0 z-[100] flex items-center justify-center bg-black/40"
      >
        <div class="flex w-[780px] flex-col items-center rounded-2xl bg-white px-12 py-16 shadow-2xl">
          <div class="check-bounce flex size-[104px] items-center justify-center rounded-full bg-primary-dark">
            <span class="text-4xl text-text">✓</span>
          </div>
          <h2 class="mt-8 text-2xl font-bold text-text">팀원으로 승인했어요</h2>
          <p class="mt-3 text-sm text-text-secondary">
            확정 팀원 목록과 역할별 충원 현황이 갱신되었습니다.
          </p>
          <button
            class="mt-10 h-[46px] w-[220px] rounded-full bg-text text-sm font-bold text-white transition-transform hover:scale-105"
            @click="router.push(`/projects/${projectId}/applicants`)"
          >
            팀원 보기
          </button>
        </div>
      </div>
    </transition>

    <!-- 역할 정원 초과 오버레이 -->
    <transition name="fade-in-up">
      <div
        v-if="capacityError"
        class="fixed inset-0 z-[100] flex items-center justify-center bg-black/40"
      >
        <div class="flex w-[780px] flex-col items-center rounded-2xl bg-white px-12 py-16 shadow-2xl">
          <div class="check-bounce flex size-[104px] items-center justify-center rounded-full bg-[#D43F21]">
            <span class="text-4xl font-bold text-white">!</span>
          </div>
          <h2 class="mt-8 text-2xl font-bold text-text">역할 정원이 이미 충족되었어요</h2>
          <p class="mt-3 text-sm text-text-secondary">
            다른 처리에서 마지막 자리가 먼저 승인되었습니다. 지원자 목록을 새로고침해 주세요.
          </p>
          <button
            class="mt-10 h-[46px] w-[220px] rounded-full bg-text text-sm font-bold text-white transition-transform hover:scale-105"
            @click="router.push(`/projects/${projectId}/applicants`)"
          >
            지원자 목록
          </button>
        </div>
      </div>
    </transition>

    <!-- 파일 미리보기 모달 -->
    <transition name="fade-in-up">
      <div
        v-if="filePreviewOpen"
        class="fixed inset-0 z-[100] flex items-center justify-center bg-black/50"
        @click.self="closeFilePreview"
      >
        <div
          class="relative h-[80vh] w-[900px] overflow-hidden rounded-2xl bg-white shadow-2xl"
          @contextmenu.prevent
        >
          <!-- 헤더 -->
          <div class="border-b border-border px-8 py-4">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-bold text-text">파일 미리보기</h3>
              <button
                class="rounded-full border border-border bg-white px-4 py-2 text-xs font-bold text-text hover:bg-bg-muted"
                @click="closeFilePreview"
              >
                닫기
              </button>
            </div>
            <p class="mt-1 text-[13px] text-text">{{ filePreviewName }}</p>
            <p class="mt-1 text-xs text-text-secondary">
              사이트 내에서 파일을 열람할 수 있습니다. 다운로드는 지원하지 않습니다.
            </p>
          </div>
          <!-- PDF 뷰어 (canvas 기반, 다운로드 차단) -->
          <PdfViewer :url="filePreviewUrl" class="h-[calc(100%-100px)]" />
        </div>
      </div>
    </transition>
  </div>
</template>
