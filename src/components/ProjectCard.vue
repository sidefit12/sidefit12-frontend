<!--
  @component ProjectCard
  @description 추천 프로젝트 카드. 매치율, 제목, 조건, 기술스택, 모집현황을 표시한다.
-->
<script setup lang="ts">
import { ref } from 'vue'

interface Reason {
  reasonType: string
  reasonText: string
  contributionScore: number | null
}

interface Props {
  title: string
  matchRate: number
  condition: string
  topic: string
  techStacks: string[]
  roles: string
  reasons?: Reason[]
}

defineProps<Props>()

const showReasons = ref(false)
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

    <!-- 추천 이유 -->
    <template v-if="reasons?.length">
      <div class="mt-3 flex justify-end">
        <button
          class="text-[12px] font-bold text-text-secondary transition-colors hover:text-text"
          @click.stop="showReasons = true"
        >
          추천 이유 보기
        </button>
      </div>

      <!-- 추천 이유 모달 -->
      <Teleport to="body">
        <transition name="reasons">
          <div
            v-if="showReasons"
            class="fixed inset-0 z-[100] flex items-center justify-center bg-black/40"
            @click.self="showReasons = false"
          >
            <div class="reason-modal w-full max-w-[400px] rounded-xl bg-white px-7 py-6">
              <div class="flex items-center justify-between">
                <h3 class="text-base font-bold text-text">추천 이유</h3>
                <button
                  class="text-lg text-text-secondary hover:text-text"
                  @click.stop="showReasons = false"
                >
                  ×
                </button>
              </div>
              <p class="mt-1 text-[12px] text-text-secondary">{{ title }}</p>
              <div class="mt-5 flex flex-col gap-3">
                <div v-for="(r, i) in reasons" :key="i" class="rounded-lg bg-bg-muted px-4 py-3">
                  <p class="text-[13px] text-text">{{ r.reasonText }}</p>
                </div>
              </div>
            </div>
          </div>
        </transition>
      </Teleport>
    </template>
  </article>
</template>

<style scoped>
.reasons-enter-active,
.reasons-leave-active {
  transition: all 0.25s ease;
}
.reasons-enter-from,
.reasons-leave-to {
  opacity: 0;
}
.reason-modal {
  animation: modal-pop 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
@keyframes modal-pop {
  0% {
    transform: scale(0.9);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
