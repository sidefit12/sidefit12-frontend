<!--
  @view NotFoundView
  @description 404 페이지 - 존재하지 않는 경로
  @route /:pathMatch(.*)*
-->
<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <div class="flex min-h-[60vh] flex-col items-center justify-center px-6">
    <div class="flex size-[120px] items-center justify-center rounded-full bg-bg-card">
      <span class="text-5xl font-bold text-text-secondary">404</span>
    </div>
    <h1 class="mt-8 text-2xl font-bold text-text">페이지를 찾을 수 없어요</h1>
    <p class="mt-3 text-sm text-text-secondary">
      요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
    </p>
    <div class="mt-10 flex gap-3">
      <button
        class="h-[46px] w-[150px] rounded-full border border-border bg-white text-sm font-bold text-text transition-all hover:bg-bg-muted"
        @click="router.back()"
      >
        이전 페이지
      </button>
      <button
        class="h-[46px] w-[150px] rounded-full bg-text text-sm font-bold text-white transition-transform hover:scale-105"
        @click="router.push('/')"
      >
        홈으로
      </button>
    </div>
  </div>
</template>
