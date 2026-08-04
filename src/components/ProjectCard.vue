<!--
  @component ProjectCard
  @description 추천 프로젝트 카드. 매치율, 제목, 조건, 기술스택, 모집현황을 표시한다.
-->
<script setup lang="ts">
interface Props {
  title: string
  matchRate: number
  condition: string
  topic: string
  techStacks: string[]
  roles: string
}

defineProps<Props>()
</script>

<template>
  <article
    class="flex w-full flex-col rounded-xl border border-border bg-white p-5 transition-all duration-200 hover:-translate-y-1 hover:border-text hover:shadow-md"
  >
    <!-- 상단: 모집중 뱃지 + 매치율 -->
    <div class="mb-1 flex items-center justify-between">
      <span class="text-xs font-bold text-text">모집중</span>
      <span class="flex h-8 items-center rounded-full bg-text px-3 text-xs font-bold text-white">
        {{ matchRate }}%
      </span>
    </div>

    <!-- 액센트 라인 -->
    <div class="mb-3 h-[3px] w-[58px] rounded-full bg-primary-dark" />

    <!-- 제목 -->
    <h3 class="mb-2 text-lg font-bold leading-tight text-text">
      {{ title }}
    </h3>

    <!-- 조건 -->
    <p class="mb-3 text-[13px] text-text-secondary">
      {{ condition }}
    </p>

    <!-- 기술 스택 -->
    <div class="mb-3 flex flex-wrap items-center gap-2">
      <span class="rounded-full border border-border px-2.5 py-1.5 text-xs text-text">
        {{ topic }}
      </span>
      <span
        v-for="tech in techStacks"
        :key="tech"
        class="flex items-center gap-1 rounded-full border border-border px-2.5 py-1.5 text-[10px] font-bold text-text"
      >
        {{ tech }}
      </span>
    </div>

    <!-- 모집 현황 -->
    <p class="mt-auto text-[13px] font-bold text-text">
      {{ roles }}
    </p>
  </article>
</template>
