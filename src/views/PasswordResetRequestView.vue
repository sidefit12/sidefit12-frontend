<!--
  @component PasswordResetRequestView
  @description 비밀번호 찾기 페이지. 이메일 입력 후 재설정 메일 발송 요청.
  성공 시 안내 메시지 표시.
-->
<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { requestPasswordReset } from '@/api/auth'

const route = useRoute()
const router = useRouter()

// token 쿼리가 있으면 confirm 페이지로 리다이렉트
if (route.query.token) {
  router.replace({ path: '/password-reset/confirm', query: { token: route.query.token as string } })
}

const email = ref('')
const errorMessage = ref('')
const submitting = ref(false)
const sent = ref(false)

async function handleSubmit() {
  errorMessage.value = ''

  if (!email.value) {
    errorMessage.value = '이메일을 입력해 주세요.'
    return
  }

  submitting.value = true
  try {
    await requestPasswordReset({ email: email.value })
    sent.value = true
  } catch (e: unknown) {
    const err = e as { response?: { status?: number } }
    if (err.response?.status === 429) {
      errorMessage.value = '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.'
    } else if (err.response?.status === 503) {
      errorMessage.value =
        '이메일 발송 서비스를 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해 주세요.'
    } else {
      errorMessage.value = '요청에 실패했어요. 잠시 후 다시 시도해 주세요.'
    }
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div
    class="mx-auto flex min-h-[calc(100vh-76px)] max-w-[1440px] flex-col items-center px-12 pt-16"
  >
    <!-- 타이틀 -->
    <h1 class="text-[32px] font-bold text-text">비밀번호 찾기</h1>
    <p class="mt-3 text-sm text-text-secondary">
      가입한 이메일을 입력하면 재설정 링크를 보내드려요.
    </p>

    <!-- 카드 -->
    <div class="mt-10 w-full max-w-[580px] rounded-xl border border-border bg-white px-8 py-10">
      <!-- 발송 전 -->
      <template v-if="!sent">
        <h2 class="text-lg font-bold text-text">재설정 메일 보내기</h2>

        <form class="mt-6" @submit.prevent="handleSubmit">
          <!-- 이메일 -->
          <label class="block text-[13px] text-text-secondary">이메일</label>
          <input
            v-model="email"
            type="email"
            placeholder="name@example.com"
            autocomplete="email"
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
            {{ submitting ? '전송 중...' : '재설정 메일 보내기' }}
          </button>
        </form>
      </template>

      <!-- 발송 완료 -->
      <template v-else>
        <div class="flex flex-col items-center py-6">
          <!-- 체크 아이콘 (scale + draw 애니메이션) -->
          <div
            class="check-circle flex h-16 w-16 items-center justify-center rounded-full border-4 border-primary bg-primary"
          >
            <svg
              class="check-icon h-8 w-8 text-text"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h2 class="fade-in-up mt-5 text-lg font-bold text-text">메일을 보냈어요</h2>
          <p class="fade-in-up delay-100 mt-2 text-center text-sm text-text-secondary">
            <span class="font-medium text-text">{{ email }}</span> 으로<br />
            비밀번호 재설정 링크를 보냈습니다.<br />
            메일함을 확인해 주세요.
          </p>

          <!-- 로그인으로 돌아가기 -->
          <router-link
            to="/login"
            class="fade-in-up delay-200 mt-8 flex h-[46px] w-full max-w-[320px] items-center justify-center rounded-full bg-text text-sm font-bold text-white"
          >
            로그인으로 돌아가기
          </router-link>
        </div>
      </template>

      <!-- 로그인 링크 -->
      <p v-if="!sent" class="mt-8 text-center text-[13px] text-text-secondary">
        비밀번호가 생각났나요?
        <router-link to="/login" class="font-bold text-text hover:underline"> 로그인 </router-link>
      </p>
    </div>
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
