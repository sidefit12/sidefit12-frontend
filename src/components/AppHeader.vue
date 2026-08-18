<!--
  @component AppHeader
  @description 전역 네비게이션 헤더. 로그인 상태에 따라 프로필/로그인 버튼을 표시한다.
-->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore'
import DefaultAvatar from '@/components/DefaultAvatar.vue'
import NotificationToast from '@/components/NotificationToast.vue'
import type { ToastPayload } from '@/components/NotificationToast.vue'
import { fetchUnreadCount, registerPushDevice } from '@/api/notifications'
import { requestFcmToken, onForegroundMessage } from '@/lib/firebase'

const authStore = useAuthStore()
const router = useRouter()
const menuOpen = ref(false)
const unreadCount = ref(0)
const toasts = ref<(ToastPayload & { id: number })[]>([])
let toastId = 0

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

onMounted(async () => {
  if (authStore.isLoggedIn) {
    try {
      const res = await fetchUnreadCount()
      unreadCount.value = res.data.unreadCount
    } catch {
      // 무시
    }

    // FCM 토큰 등록
    try {
      const token = await requestFcmToken()
      if (token) {
        await registerPushDevice(token)
      }
    } catch {
      // 무시
    }

    // 포그라운드 메시지 수신 시 배지 갱신 + 토스트
    onForegroundMessage((payload: unknown) => {
      unreadCount.value += 1
      const msg = payload as {
        notification?: { title?: string; body?: string }
        data?: { notificationType?: string; referenceType?: string; referenceId?: string }
      }
      const toast: ToastPayload & { id: number } = {
        id: ++toastId,
        title: msg.notification?.title || '새 알림',
        body: msg.notification?.body || '',
        notificationType: msg.data?.notificationType || '',
        referenceType: msg.data?.referenceType || '',
        referenceId: msg.data?.referenceId || '',
      }
      toasts.value.push(toast)
    })
  }
})
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

      <!-- 로그인 상태 -->
      <template v-if="authStore.isLoggedIn">
        <!-- CTA -->
        <router-link
          to="/write"
          class="ml-auto flex h-[46px] w-[150px] items-center justify-center rounded-full bg-primary text-sm font-bold text-text"
        >
          모집글 작성
        </router-link>

        <!-- 알림 아이콘 -->
        <router-link
          to="/notifications"
          class="notification-bell relative ml-5 flex h-10 w-10 items-center justify-center rounded-full transition-all hover:bg-bg-muted active:scale-90"
        >
          <svg
            class="h-[22px] w-[22px] text-text"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
            />
          </svg>
          <span
            v-if="unreadCount > 0"
            class="absolute right-1 top-1 flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-[#d43f21] px-1 text-[9px] font-bold text-white"
          >
            {{ unreadCount > 99 ? '99+' : unreadCount }}
          </span>
        </router-link>

        <!-- Profile -->
        <div class="relative ml-5">
          <button class="flex h-10 items-center gap-3" @click="toggleMenu">
            <DefaultAvatar :size="40" :image-url="authStore.user?.profileImageUrl" />
            <span v-if="authStore.user?.nickname" class="text-sm font-bold text-text">{{
              authStore.user.nickname
            }}</span>
          </button>

          <!-- 드롭다운 메뉴 -->
          <transition name="dropdown">
            <div
              v-if="menuOpen"
              class="absolute right-0 top-[52px] z-50 w-[160px] overflow-hidden rounded-lg border border-border bg-white shadow-lg"
            >
              <router-link
                to="/settings"
                class="flex w-full items-center px-4 py-3 text-sm text-text hover:bg-bg-muted"
                @click="closeMenu"
              >
                설정
              </router-link>
              <button
                class="flex w-full items-center border-t border-border px-4 py-3 text-sm text-text hover:bg-bg-muted"
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
          class="ml-auto whitespace-nowrap text-sm text-text-secondary hover:text-text"
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

  <!-- 인앱 알림 토스트 -->
  <Teleport to="body">
    <NotificationToast
      v-for="t in toasts"
      :key="t.id"
      :payload="t"
      @close="toasts = toasts.filter((x) => x.id !== t.id)"
    />
  </Teleport>
</template>
