<!--
  @component PasswordResetConfirmView
  @description 새 비밀번호 설정 페이지. URL 쿼리의 resetToken을 사용하여
  새 비밀번호를 설정한다. 성공 시 완료 오버레이 후 로그인 페이지로 이동.
-->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { confirmPasswordReset } from '@/api/auth'

const route = useRoute()
const router = useRouter()

const resetToken = computed(() => (route.query.token as string) || '')

const newPassword = ref('')
const newPasswordConfirm = ref('')
const errorMessage = ref('')
const submitting = ref(false)
const completed = ref(false)

/** 비밀번호 유효성 검사 (8자 이상) */
function validatePassword(): boolean {
  if (newPassword.value.length < 8) {
    errorMessage.value = '비밀번호는 8자 이상이어야 합니다.'
    return false
  }
  if (newPassword.value !== newPasswordConfirm.value) {
    errorMessage.value = '비밀번호가 일치하지 않습니다.'
    return false
  }
  return true
}

async function handleSubmit() {
  errorMessage.value = ''

  if (!resetToken.value) {
    errorMessage.value = '유효하지 않은 링크입니다. 비밀번호 찾기를 다시 진행해 주세요.'
    return
  }

  if (!validatePassword()) return

  submitting.value = true
  try {
    await confirmPasswordReset({
      newPassword: newPassword.value,
      newPasswordConfirm: newPasswordConfirm.value,
      resetToken: resetToken.value,
    })
    completed.value = true
  } catch (e: unknown) {
    const err = e as { response?: { status?: number; data?: { code?: string } } }
    if (err.response?.status === 400) {
      errorMessage.value = '비밀번호 형식이 올바르지 않습니다.'
    } else if (
      err.response?.status === 422 &&
      err.response?.data?.code === 'SAME_AS_CURRENT_PASSWORD'
    ) {
      errorMessage.value = '현재 비밀번호와 동일합니다. 다른 비밀번호를 입력해 주세요.'
    } else if (
      err.response?.status === 401 ||
      err.response?.status === 410 ||
      err.response?.status === 422
    ) {
      errorMessage.value = '링크가 만료되었습니다. 비밀번호 찾기를 다시 진행해 주세요.'
    } else {
      errorMessage.value = '요청에 실패했어요. 잠시 후 다시 시도해 주세요.'
    }
  } finally {
    submitting.value = false
  }
}

function goToLogin() {
  router.push('/login')
}
</script>

<template>
  <div
    class="mx-auto flex min-h-[calc(100vh-76px)] max-w-[1440px] flex-col items-center px-12 pt-16"
  >
    <!-- 완료 오버레이 -->
    <template v-if="completed">
      <div class="flex flex-col items-center pt-20">
        <!-- 체크 바운스 애니메이션 -->
        <div
          class="check-circle flex h-20 w-20 items-center justify-center rounded-full border-4 border-primary bg-primary"
        >
          <svg
            class="check-icon h-10 w-10 text-text"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 class="fade-in-up mt-6 text-[28px] font-bold text-text">비밀번호가 변경되었어요</h1>
        <p class="fade-in-up delay-100 mt-3 text-sm text-text-secondary">
          새 비밀번호로 로그인할 수 있습니다.
        </p>

        <button
          class="fade-in-up delay-200 mt-10 flex h-[46px] w-full max-w-[320px] items-center justify-center rounded-full bg-text text-sm font-bold text-white"
          @click="goToLogin"
        >
          로그인하러 가기
        </button>
      </div>
    </template>

    <!-- 새 비밀번호 입력 폼 -->
    <template v-else>
      <h1 class="text-[32px] font-bold text-text">새 비밀번호 설정</h1>
      <p class="mt-3 text-sm text-text-secondary">새로운 비밀번호를 입력해 주세요.</p>

      <!-- 카드 -->
      <div class="mt-10 w-full max-w-[580px] rounded-xl border border-border bg-white px-8 py-10">
        <h2 class="text-lg font-bold text-text">비밀번호 변경</h2>

        <form class="mt-6" @submit.prevent="handleSubmit">
          <!-- 새 비밀번호 -->
          <label class="block text-[13px] text-text-secondary">새 비밀번호</label>
          <input
            v-model="newPassword"
            type="password"
            placeholder="8자 이상 비밀번호"
            autocomplete="new-password"
            class="mt-2 h-12 w-full rounded-lg border border-border bg-white px-4 text-sm text-text placeholder:text-[#8d8d8d] focus:border-text focus:outline-none"
          />

          <!-- 비밀번호 확인 -->
          <label class="mt-5 block text-[13px] text-text-secondary">비밀번호 확인</label>
          <input
            v-model="newPasswordConfirm"
            type="password"
            placeholder="비밀번호를 다시 입력해 주세요"
            autocomplete="new-password"
            class="mt-2 h-12 w-full rounded-lg border border-border bg-white px-4 text-sm text-text placeholder:text-[#8d8d8d] focus:border-text focus:outline-none"
          />

          <!-- 에러 -->
          <p v-if="errorMessage" class="mt-4 text-[13px] text-[#d43f21]">
            {{ errorMessage }}
          </p>

          <!-- 제출 버튼 -->
          <button
            type="submit"
            :disabled="submitting"
            class="mt-6 flex h-[46px] w-full items-center justify-center gap-2 rounded-full bg-text text-sm font-bold text-white disabled:opacity-50"
          >
            <svg
              v-if="submitting"
              class="h-5 w-5 animate-spin text-white"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              />
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
            {{ submitting ? '변경 중...' : '비밀번호 변경' }}
          </button>
        </form>

        <!-- 로그인 링크 -->
        <p class="mt-8 text-center text-[13px] text-text-secondary">
          비밀번호가 생각났나요?
          <router-link to="/login" class="font-bold text-text hover:underline">
            로그인
          </router-link>
        </p>
      </div>
    </template>
  </div>
</template>

<style scoped>
/* 체크 원 - scale pop */
.check-circle {
  animation: scale-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

/* 체크 아이콘 - stroke draw */
.check-icon path {
  stroke-dasharray: 24;
  stroke-dashoffset: 24;
  animation: draw-check 0.4s ease-out 0.3s forwards;
}

/* 텍스트/버튼 fade-in-up */
.fade-in-up {
  opacity: 0;
  transform: translateY(12px);
  animation: fade-up 0.4s ease-out 0.5s forwards;
}

.fade-in-up.delay-100 {
  animation-delay: 0.6s;
}

.fade-in-up.delay-200 {
  animation-delay: 0.7s;
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

@keyframes draw-check {
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes fade-up {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
