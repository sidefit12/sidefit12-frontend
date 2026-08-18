<!--
  @component SettingsView
  @description 설정 페이지. 알림 수신 설정 토글 + 회원 탈퇴.
-->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore'
import {
  fetchNotificationPreferences,
  updateNotificationPreferences,
  type NotificationPreferences,
} from '@/api/notifications'
import { withdraw } from '@/api/auth'

const router = useRouter()
const authStore = useAuthStore()

/* ────── 알림 설정 ────── */
const prefs = ref<NotificationPreferences | null>(null)
const prefsLoading = ref(true)

async function loadPrefs() {
  try {
    const res = await fetchNotificationPreferences()
    prefs.value = res.data
  } catch {
    // 무시
  } finally {
    prefsLoading.value = false
  }
}

async function togglePref(key: keyof NotificationPreferences) {
  if (!prefs.value || key === 'updatedAt' || key === 'systemEnabled') return
  prefs.value[key] = !prefs.value[key] as never
}

const saving = ref(false)

async function savePrefs() {
  if (!prefs.value) return
  saving.value = true
  try {
    await updateNotificationPreferences({
      applicationEnabled: prefs.value.applicationEnabled,
      recruitmentDeadlineEnabled: prefs.value.recruitmentDeadlineEnabled,
      teamEnabled: prefs.value.teamEnabled,
    })
  } catch {
    // 실패 시 다시 로드
    await loadPrefs()
  } finally {
    saving.value = false
  }
}

/* ────── 회원 탈퇴 ────── */
const withdrawModalOpen = ref(false)
const withdrawPassword = ref('')
const withdrawing = ref(false)
const withdrawError = ref('')

async function handleWithdraw() {
  withdrawError.value = ''
  if (withdrawPassword.value.length < 8) {
    withdrawError.value = '비밀번호를 입력해 주세요.'
    return
  }

  withdrawing.value = true
  try {
    await withdraw({ confirmation: 'WITHDRAW', password: withdrawPassword.value })
    await authStore.logout()
    router.push('/login')
  } catch (e: unknown) {
    const err = e as { response?: { status?: number } }
    if (err.response?.status === 401) {
      withdrawError.value = '현재 비밀번호가 일치하지 않습니다.'
    } else if (err.response?.status === 400) {
      withdrawError.value = '활성 프로젝트가 있어 탈퇴할 수 없습니다.'
    } else {
      withdrawError.value = '요청에 실패했어요. 잠시 후 다시 시도해 주세요.'
    }
  } finally {
    withdrawing.value = false
  }
}

onMounted(loadPrefs)
</script>

<template>
  <div class="mx-auto max-w-[1200px] px-12 pt-10 pb-16">
    <h1 class="text-[28px] font-bold text-text">설정</h1>

    <!-- 알림 수신 설정 -->
    <div class="mt-8 rounded-xl border border-border bg-white px-8 py-7">
      <h2 class="text-lg font-bold text-text">알림 수신 설정</h2>

      <div v-if="prefsLoading" class="mt-6 space-y-4">
        <div v-for="i in 4" :key="i" class="h-9 animate-pulse rounded bg-bg-muted" />
      </div>

      <div v-else-if="prefs" class="mt-6 flex flex-col gap-5">
        <!-- 지원 결과 -->
        <div class="flex items-center justify-between">
          <span class="text-sm text-text">지원 결과</span>
          <button
            :class="[
              'relative h-7 w-12 rounded-full transition-colors',
              prefs.applicationEnabled ? 'bg-primary' : 'bg-border',
            ]"
            @click="togglePref('applicationEnabled')"
          >
            <span
              :class="[
                'absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform',
                prefs.applicationEnabled ? 'translate-x-5' : 'translate-x-0',
              ]"
            />
          </button>
        </div>

        <!-- 모집 마감 -->
        <div class="flex items-center justify-between">
          <span class="text-sm text-text">모집 마감</span>
          <button
            :class="[
              'relative h-7 w-12 rounded-full transition-colors',
              prefs.recruitmentDeadlineEnabled ? 'bg-primary' : 'bg-border',
            ]"
            @click="togglePref('recruitmentDeadlineEnabled')"
          >
            <span
              :class="[
                'absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform',
                prefs.recruitmentDeadlineEnabled ? 'translate-x-5' : 'translate-x-0',
              ]"
            />
          </button>
        </div>

        <!-- 팀 알림 -->
        <div class="flex items-center justify-between">
          <span class="text-sm text-text">팀 알림</span>
          <button
            :class="[
              'relative h-7 w-12 rounded-full transition-colors',
              prefs.teamEnabled ? 'bg-primary' : 'bg-border',
            ]"
            @click="togglePref('teamEnabled')"
          >
            <span
              :class="[
                'absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform',
                prefs.teamEnabled ? 'translate-x-5' : 'translate-x-0',
              ]"
            />
          </button>
        </div>

        <!-- 저장 버튼 -->
        <div class="mt-4 flex justify-end">
          <button
            class="rounded-full bg-text px-6 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-80 disabled:opacity-40"
            :disabled="saving"
            @click="savePrefs"
          >
            {{ saving ? '저장 중...' : '저장' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 회원 탈퇴 -->
    <div class="mt-8 rounded-xl border border-border bg-bg-card px-8 py-7">
      <h2 class="text-lg font-bold text-text">회원 탈퇴</h2>
      <p class="mt-2 text-sm text-text-secondary">
        계정은 복구할 수 없으며 게시글과 지원 이력은 익명화 정책에 따라 보관됩니다.
      </p>

      <div class="mt-6 flex items-end gap-4">
        <div class="flex-1">
          <label class="block text-[13px] text-text-secondary">비밀번호</label>
          <input
            v-model="withdrawPassword"
            type="password"
            placeholder="본인 확인을 위해 입력하세요"
            autocomplete="current-password"
            class="mt-2 h-12 w-full rounded-lg border border-border bg-white px-4 text-sm text-text placeholder:text-[#8d8d8d] focus:border-text focus:outline-none"
          />
        </div>
        <button
          class="h-12 shrink-0 rounded-full bg-text px-6 text-sm font-bold text-white transition-opacity hover:opacity-80"
          @click="withdrawModalOpen = true"
        >
          회원 탈퇴
        </button>
      </div>
    </div>

    <!-- 탈퇴 확인 모달 -->
    <Teleport to="body">
      <transition name="fade">
        <div
          v-if="withdrawModalOpen"
          class="fixed inset-0 z-[100] flex items-center justify-center bg-black/40"
        >
          <div class="withdraw-modal w-full max-w-[480px] rounded-xl bg-white px-8 py-8">
            <div
              class="withdraw-icon flex h-[58px] w-[58px] items-center justify-center rounded-full bg-[#d43f21]"
            >
              <span class="text-xl font-bold text-white">!</span>
            </div>
            <h2 class="withdraw-fade mt-6 text-xl font-bold text-text">정말 탈퇴하시겠어요?</h2>
            <p class="withdraw-fade delay-1 mt-3 text-sm text-text-secondary">
              탈퇴 후 계정과 데이터는 복구할 수 없습니다.
            </p>

            <p v-if="withdrawError" class="mt-4 text-[13px] text-[#d43f21]">
              {{ withdrawError }}
            </p>

            <div class="mt-8 flex gap-4">
              <button
                class="h-[46px] flex-1 rounded-full border border-border bg-white text-sm font-bold text-text transition-all hover:bg-bg-muted"
                @click="withdrawModalOpen = false"
              >
                취소
              </button>
              <button
                class="h-[46px] flex-1 rounded-full bg-[#d43f21] text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-40"
                :disabled="withdrawing"
                @click="handleWithdraw"
              >
                {{ withdrawing ? '처리 중...' : '탈퇴하기' }}
              </button>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<style scoped>
.withdraw-modal {
  animation: modal-pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

.withdraw-icon {
  animation: scale-pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s both;
}

.withdraw-fade {
  opacity: 0;
  transform: translateY(8px);
  animation: fade-up 0.3s ease-out 0.25s forwards;
}

.withdraw-fade.delay-1 {
  animation-delay: 0.35s;
}

@keyframes modal-pop {
  0% {
    transform: scale(0.9);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes scale-pop {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes fade-up {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
