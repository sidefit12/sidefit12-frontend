<!--
  @view NotFoundView
  @description 404 페이지 - 존재하지 않는 경로 접근 시 표시
  @route /:pathMatch(.*)*
-->
<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <div class="flex min-h-[70vh] flex-col items-center justify-center px-6">
    <!-- 점선 경로 일러스트 -->
    <svg class="w-[200px] h-[80px]" viewBox="0 0 200 80" fill="none">
      <path
        d="M10 60 C50 60 50 20 100 40 C150 60 150 20 190 25"
        stroke="#D4D4D4"
        stroke-width="2.5"
        stroke-dasharray="6 4"
        stroke-linecap="round"
      />
      <!-- 끝점에 X 표시 -->
      <path
        d="M185 20 L195 30 M195 20 L185 30"
        stroke="#ABABAB"
        stroke-width="2.5"
        stroke-linecap="round"
      />
      <!-- 시작점 원 -->
      <circle cx="10" cy="60" r="4" fill="#D4D4D4" />
      <!-- 경로 끝 ? 표시 -->
      <text x="190" y="15" text-anchor="middle" font-size="14" font-weight="bold" fill="#ABABAB">
        ?
      </text>
    </svg>

    <!-- 텍스트 -->
    <p
      class="mt-6 text-[80px] font-bold leading-none text-primary-dark"
      style="-webkit-text-stroke: 2px #1a1a1a; paint-order: stroke fill"
    >
      404
    </p>
    <h1 class="mt-4 text-xl font-bold text-text">길을 잃었어요</h1>
    <p class="mt-2 text-sm text-text-secondary">
      찾으시는 페이지가 존재하지 않거나 이동되었을 수 있어요.
    </p>

    <!-- 버튼 -->
    <div class="mt-8 flex gap-3">
      <button
        class="h-[44px] w-[140px] rounded-full border border-border bg-white text-sm font-bold text-text transition-all hover:bg-bg-muted"
        @click="router.back()"
      >
        뒤로 가기
      </button>
      <button
        class="h-[44px] w-[140px] rounded-full bg-text text-sm font-bold text-white transition-transform hover:scale-105"
        @click="router.push('/')"
      >
        홈으로
      </button>
    </div>
  </div>
</template>
