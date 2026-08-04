<!--
  @component HomeView
  @description 홈 페이지 뷰. 프로젝트 초기 상태 확인을 위한 카운터 데모를 포함한다.
-->
<script setup lang="ts">
import { useExampleStore } from '@/stores/useExampleStore'

/** Example 스토어 인스턴스 */
const store = useExampleStore()
</script>

<template>
  <div class="mx-auto max-w-2xl py-10 text-center">
    <h1 class="mb-4 text-4xl font-bold">Welcome to Sidefit</h1>
    <p class="mb-6 text-gray-600">Vue 3 + TypeScript + Vite project is ready.</p>
    <button
      class="rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
      @click="store.increment()"
    >
      Count: {{ store.count }}
    </button>
  </div>
</template>
