<!--
  @component TechStackChip
  @description 기술 스택을 표시하는 공통 칩 컴포넌트.
  공식 로고 20×20px + 기술명(12px bold), pill 형태(높이 40px, border-radius 20px).
  theme="light"(기본) 또는 theme="dark" 선택 가능.
-->
<script setup lang="ts">
import { computed } from 'vue'
import { TECH_STACK_LOGOS, type TechStackName } from '@/constants/techStacks'

interface Props {
  name: TechStackName
  theme?: 'light' | 'dark'
}

const props = withDefaults(defineProps<Props>(), {
  theme: 'light',
})

const logoUrl = computed(() => TECH_STACK_LOGOS[props.name] ?? '')

const chipClasses = computed(() =>
  props.theme === 'dark'
    ? 'flex h-10 items-center gap-2 rounded-full border border-text bg-text px-3 py-2.5'
    : 'flex h-10 items-center gap-2 rounded-full border border-border bg-white px-3 py-2.5',
)

const textClasses = computed(() =>
  props.theme === 'dark'
    ? 'whitespace-nowrap text-xs font-bold text-white'
    : 'whitespace-nowrap text-xs font-bold text-text',
)
</script>

<template>
  <span :class="chipClasses">
    <img v-if="logoUrl" :src="logoUrl" :alt="name" class="size-5 shrink-0 object-contain" />
    <span
      v-else
      class="flex size-5 shrink-0 items-center justify-center rounded-sm bg-border text-[9px] font-bold text-text-secondary"
    >
      {{ name.slice(0, 2) }}
    </span>
    <span :class="textClasses">{{ name }}</span>
  </span>
</template>
