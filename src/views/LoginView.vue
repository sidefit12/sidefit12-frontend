<!--
  @component LoginView
  @description 이메일 로그인 페이지. 중앙 카드 레이아웃, 이메일/비밀번호 폼.
-->
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const errorMessage = ref('')
const submitting = ref(false)

async function handleLogin() {
  errorMessage.value = ''

  if (!email.value || !password.value) {
    errorMessage.value = '이메일과 비밀번호를 입력해 주세요.'
    return
  }

  submitting.value = true
  try {
    await authStore.login({
      email: email.value,
      password: password.value,
      deviceInfo: navigator.userAgent,
    })
    router.push('/')
  } catch (e: unknown) {
    const err = e as { response?: { status?: number } }
    if (err.response?.status === 401) {
      errorMessage.value = '이메일 또는 비밀번호를 확인해 주세요.'
    } else if (err.response?.status === 403) {
      errorMessage.value = '정지되거나 탈퇴한 계정입니다.'
    } else {
      errorMessage.value = '로그인에 실패했어요. 잠시 후 다시 시도해 주세요.'
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
    <h1 class="text-[32px] font-bold text-text">로그인</h1>
    <p class="mt-3 text-sm text-text-secondary">이메일 계정으로 SideFit을 계속 이용하세요.</p>

    <!-- 카드 -->
    <div class="mt-10 w-full max-w-[580px] rounded-xl border border-border bg-white px-8 py-10">
      <h2 class="text-lg font-bold text-text">계정 로그인</h2>

      <form class="mt-6" @submit.prevent="handleLogin">
        <!-- 이메일 -->
        <label class="block text-[13px] text-text-secondary">이메일</label>
        <input
          v-model="email"
          type="email"
          placeholder="name@example.com"
          autocomplete="email"
          class="mt-2 h-12 w-full rounded-lg border border-border bg-white px-4 text-sm text-text placeholder:text-[#8d8d8d] focus:border-text focus:outline-none"
        />

        <!-- 비밀번호 -->
        <label class="mt-5 block text-[13px] text-text-secondary">비밀번호</label>
        <input
          v-model="password"
          type="password"
          placeholder="8자 이상 비밀번호"
          autocomplete="current-password"
          class="mt-2 h-12 w-full rounded-lg border border-border bg-white px-4 text-sm text-text placeholder:text-[#8d8d8d] focus:border-text focus:outline-none"
        />

        <!-- 비밀번호 찾기 -->
        <div class="mt-4 text-right">
          <router-link to="/password-reset" class="text-[13px] text-text-secondary hover:text-text">
            비밀번호를 잊으셨나요?
          </router-link>
        </div>

        <!-- 에러 메시지 -->
        <p v-if="errorMessage" class="mt-4 text-[13px] text-[#d43f21]">
          {{ errorMessage }}
        </p>

        <!-- 로그인 버튼 -->
        <button
          type="submit"
          :disabled="submitting"
          class="mt-6 flex h-[46px] w-full items-center justify-center rounded-full bg-text text-sm font-bold text-white disabled:opacity-50"
        >
          {{ submitting ? '로그인 중...' : '로그인' }}
        </button>
      </form>

      <!-- 회원가입 링크 -->
      <p class="mt-8 text-center text-[13px] text-text-secondary">
        계정이 없나요?
        <router-link to="/signup" class="font-bold text-text hover:underline">
          회원가입
        </router-link>
      </p>
    </div>

    <!-- 안내 -->
    <p class="mt-6 text-[11px] text-text-secondary">
      로그인 실패 시 계정 존재 여부를 구분하지 않는 동일한 안내를 제공합니다.
    </p>
  </div>
</template>
