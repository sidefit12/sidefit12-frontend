<!--
  @component NotificationsView
  @description 알림 센터 페이지. 알림 목록을 유형별 필터와 함께 표시하고
  읽음/전체 읽음 처리를 지원한다.
-->
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  fetchNotifications,
  markAsRead,
  markAllAsRead,
  type NotificationItem,
} from '@/api/notifications'

const router = useRouter()

const notifications = ref<NotificationItem[]>([])
const unreadCount = ref(0)
const loading = ref(true)
const activeFilter = ref<string | undefined>(undefined)

const filters = [
  { label: '전체', value: undefined },
  { label: '지원', value: 'APPLICATION_RECEIVED,APPLICATION_ACCEPTED,APPLICATION_REJECTED' },
  { label: '모집', value: 'RECRUITMENT_CLOSED' },
  { label: '서비스', value: 'SYSTEM' },
]

async function load() {
  loading.value = true
  try {
    const params: Record<string, unknown> = { size: 50 }
    if (activeFilter.value) {
      params.notificationType = activeFilter.value.split(',')[0]
    }
    const res = await fetchNotifications(params as never)
    notifications.value = res.data.items
    unreadCount.value = res.data.unreadCount
  } catch {
    // 에러 무시
  } finally {
    loading.value = false
  }
}

function setFilter(value: string | undefined) {
  activeFilter.value = value
  load()
}

async function handleRead(notification: NotificationItem) {
  if (!notification.isRead) {
    try {
      await markAsRead(notification.notificationId)
      notification.isRead = true
      notification.readAt = new Date().toISOString()
      unreadCount.value = Math.max(0, unreadCount.value - 1)
    } catch {
      // 에러 무시
    }
  }
  // 관련 페이지로 이동
  navigateTo(notification)
}

async function handleMarkAllRead() {
  try {
    await markAllAsRead()
    notifications.value.forEach((n) => {
      n.isRead = true
      n.readAt = new Date().toISOString()
    })
    unreadCount.value = 0
  } catch {
    // 에러 무시
  }
}

function navigateTo(notification: NotificationItem) {
  const { referenceType, referenceId } = notification
  if (!referenceType || !referenceId) return

  switch (referenceType) {
    case 'APPLICATION':
      router.push(`/mypage/applications`)
      break
    case 'PROJECT':
      router.push(`/projects/${referenceId}`)
      break
    default:
      break
  }
}

/** 상대 시간 표시 */
function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return '방금 전'
  if (minutes < 60) return `${minutes}분 전`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}시간 전`
  const days = Math.floor(hours / 24)
  if (days === 1) return '어제'
  if (days < 7) return `${days}일 전`
  const weeks = Math.floor(days / 7)
  if (weeks < 5) return `${weeks}주 전`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}개월 전`
  return `${Math.floor(months / 12)}년 전`
}

const isEmpty = computed(() => !loading.value && notifications.value.length === 0)

onMounted(load)
</script>

<template>
  <div class="mx-auto max-w-[1440px] px-12 pt-8 pb-16">
    <!-- 빈 상태일 때는 타이틀/필터 숨김 -->
    <template v-if="!isEmpty">
      <!-- 타이틀 -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-[30px] font-bold text-text">알림</h1>
          <p class="mt-1 text-sm text-text-secondary">읽지 않은 알림 {{ unreadCount }}개</p>
        </div>
        <button
          v-if="unreadCount > 0"
          class="rounded-full border border-border bg-white px-4 py-2 text-xs font-bold text-text transition-colors hover:bg-bg-muted"
          @click="handleMarkAllRead"
        >
          전체 읽음
        </button>
      </div>

      <!-- 필터 -->
      <div class="mt-6 flex gap-2">
        <button
          v-for="f in filters"
          :key="f.label"
          :class="[
            'rounded-full px-4 py-2 text-xs font-bold transition-all',
            activeFilter === f.value
              ? 'bg-text text-white'
              : 'border border-border bg-white text-text hover:bg-bg-muted',
          ]"
          @click="setFilter(f.value)"
        >
          {{ f.label }}
        </button>
      </div>
    </template>

    <!-- 로딩 -->
    <div v-if="loading" class="mt-6 space-y-3">
      <div v-for="i in 5" :key="i" class="h-[108px] animate-pulse rounded-xl bg-bg-muted" />
    </div>

    <!-- 빈 상태 -->
    <div v-else-if="isEmpty" class="flex min-h-[calc(100vh-76px)] items-center justify-center">
      <div
        class="fade-in-up flex flex-col items-center rounded-xl border border-border bg-white px-16 py-14"
      >
        <div
          class="check-circle flex h-[104px] w-[104px] items-center justify-center rounded-full bg-[#d43f21]"
        >
          <span class="text-[34px] font-bold text-white">—</span>
        </div>
        <h2 class="fade-in-up delay-1 mt-6 text-xl font-bold text-text">새로운 알림이 없어요</h2>
        <p class="fade-in-up delay-2 mt-2 text-sm text-text-secondary">
          지원과 모집 상태가 변경되면 이곳에서 확인할 수 있습니다.
        </p>
        <button
          class="fade-in-up delay-3 mt-8 flex h-[46px] w-[220px] items-center justify-center rounded-full bg-text text-sm font-bold text-white"
          @click="router.push('/projects')"
        >
          프로젝트 찾기
        </button>
      </div>
    </div>

    <!-- 알림 리스트 -->
    <div v-else class="mt-6 flex flex-col gap-3">
      <div
        v-for="(n, idx) in notifications"
        :key="n.notificationId"
        :class="[
          'notification-item relative flex cursor-pointer items-start gap-4 rounded-xl border border-border px-6 py-5 transition-all hover:shadow-sm',
          !n.isRead ? 'bg-white' : 'bg-white opacity-70',
        ]"
        :style="{ animationDelay: `${idx * 0.06}s` }"
        @click="handleRead(n)"
      >
        <!-- 미읽음 표시 바 -->
        <div v-if="!n.isRead" class="absolute left-0 top-0 h-full w-1.5 rounded-l-xl bg-primary" />

        <!-- 아이콘 -->
        <div
          :class="[
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-full',
            n.notificationType.includes('ACCEPTED') ? 'bg-primary' : 'bg-text',
          ]"
        >
          <span v-if="n.notificationType.includes('ACCEPTED')" class="text-sm font-bold text-text"
            >✓</span
          >
          <span v-else class="text-sm font-bold text-white">i</span>
        </div>

        <!-- 내용 -->
        <div class="flex-1">
          <p class="text-sm font-bold text-text">{{ n.title }}</p>
          <p class="mt-1 text-[13px] text-text-secondary">{{ n.content }}</p>
        </div>

        <!-- 시간 -->
        <span class="shrink-0 text-xs text-text-secondary">{{ relativeTime(n.createdAt) }}</span>
      </div>
    </div>

    <!-- 하단 안내 -->
    <p v-if="!isEmpty && !loading" class="mt-6 text-xs text-text-secondary">
      알림을 클릭하면 관련 게시글 또는 지원 화면으로 이동합니다.
    </p>
  </div>
</template>

<style scoped>
.check-circle {
  animation: scale-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

.fade-in-up {
  opacity: 0;
  transform: translateY(12px);
  animation: fade-up 0.4s ease-out 0.3s forwards;
}

.fade-in-up.delay-1 {
  animation-delay: 0.5s;
}

.fade-in-up.delay-2 {
  animation-delay: 0.6s;
}

.fade-in-up.delay-3 {
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

@keyframes fade-up {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.notification-item {
  opacity: 0;
  transform: translateY(16px);
  animation: slide-in 0.35s ease-out forwards;
}

@keyframes slide-in {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
