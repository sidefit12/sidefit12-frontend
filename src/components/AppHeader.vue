<!--
  @component AppHeader
  @description 전역 네비게이션 헤더. 로그인 상태에 따라 프로필/로그인 버튼을 표시한다.
-->
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore'
import DefaultAvatar from '@/components/DefaultAvatar.vue'

const authStore = useAuthStore()
const router = useRouter()
const menuOpen = ref(false)

function toggleMenu() {
  menuOpen.value = !menuOpen.value
}

function closeMenu() {
  menuOpen.value = false
}

async function handleLogout() {
  closeMenu()
  await authStore.logout()
  router.push('/login')
}
</script>

<template>
  <header class="sticky top-0 z-50 border-b border-border bg-white">
    <div class="relative mx-auto flex h-[76px] max-w-[1440px] items-center px-11">
      <!-- Logo -->
      <router-link to="/" class="shrink-0">
        <img src="/logo-identity.png" alt="SIDEFIT" class="h-9 w-[136px] object-contain" />
      </router-link>

      <!-- Navigation -->
      <nav class="ml-[94px] flex items-center gap-[26px]">
        <router-link
          to="/projects"
          class="whitespace-nowrap text-sm text-text-secondary hover:text-text"
          active-class="!font-bold !text-text"
        >
          프로젝트 찾기
        </router-link>
        <router-link
          to="/recommend"
          class="whitespace-nowrap text-sm text-text-secondary hover:text-text"
          active-class="!font-bold !text-text"
        >
          AI 추천
        </router-link>
        <router-link
          v-if="authStore.isLoggedIn"
          to="/mypage"
          class="whitespace-nowrap text-sm text-text-secondary hover:text-text"
          active-class="!font-bold !text-text"
        >
          내 활동
        </router-link>
      </nav>

      <!-- Search -->
      <div class="ml-auto flex h-11 w-[286px] items-center rounded-full bg-bg-muted px-5">
        <span class="text-[13px] text-[#8d8d8d]">프로젝트명, 기술 스택 검색</span>
        <span class="ml-auto text-lg text-text-secondary">⌕</span>
      </div>

      <!-- 로그인 상태 -->
      <template v-if="authStore.isLoggedIn">
        <!-- CTA -->
        <router-link
          to="/write"
          class="ml-5 flex h-[46px] w-[150px] items-center justify-center rounded-full bg-primary text-sm font-bold text-text"
        >
          모집글 작성
        </router-link>

        <!-- Profile -->
        <div class="relative ml-5">
          <button class="flex h-10 items-center gap-3" @click="toggleMenu">
            <DefaultAvatar :size="40" :image-url="authStore.user?.profileImageUrl" />
            <span v-if="authStore.user?.nickname" class="text-sm font-bold text-text">{{
              authStore.user.nickname
            }}</span>
            <span
              class="ml-8 flex size-6 -translate-y-0.5 items-center justify-center text-sm text-text-secondary transition-transform duration-200"
              :class="menuOpen ? 'rotate-180' : ''"
              >⌄</span
            >
          </button>

          <!-- 드롭다운 메뉴 -->
          <transition name="dropdown">
            <div
              v-if="menuOpen"
              class="absolute right-0 top-[56px] z-50 w-[220px] rounded-xl border border-border bg-white py-2 shadow-lg"
            >
              <router-link
                to="/notifications"
                class="flex items-center justify-between px-5 py-3 text-sm text-text hover:bg-bg-muted"
                @click="closeMenu"
              >
                알림
                <span class="text-xs text-text-secondary">3</span>
              </router-link>
              <router-link
                to="/settings/notifications"
                class="flex items-center justify-between px-5 py-3 text-sm text-text hover:bg-bg-muted"
                @click="closeMenu"
              >
                알림 설정
              </router-link>
              <div class="mx-5 my-1 border-t border-border" />
              <button
                class="flex w-full items-center px-5 py-3 text-sm text-text hover:bg-bg-muted"
                @click="handleLogout"
              >
                로그아웃
              </button>
            </div>
          </transition>
          <div v-if="menuOpen" class="fixed inset-0 z-40" @click="closeMenu" />
        </div>
      </template>

      <!-- 비로그인 상태 -->
      <template v-else>
        <router-link
          to="/login"
          class="ml-5 whitespace-nowrap text-sm text-text-secondary hover:text-text"
        >
          로그인
        </router-link>
        <router-link
          to="/signup"
          class="ml-4 flex h-[46px] items-center justify-center rounded-full bg-text px-6 text-sm font-bold text-white"
        >
          회원가입
        </router-link>
      </template>
    </div>
  </header>
</template>
