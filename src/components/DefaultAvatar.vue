<!--
  @component DefaultAvatar
  @description 프로필 이미지가 없을 때 사용하는 기본 아바타.
  Size 40은 헤더, 48은 리스트, 60은 온보딩, 94는 공개 프로필에 사용한다.
  profileImageUrl이 있으면 이미지를 표시하고 없으면 기본 아바타를 표시한다.
-->
<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  size?: 40 | 48 | 60 | 94 | 132
  imageUrl?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  size: 40,
  imageUrl: null,
})

const sizeClass = computed(() => {
  const map: Record<number, string> = {
    40: 'size-10',
    48: 'size-12',
    60: 'size-[60px]',
    94: 'size-[94px]',
    132: 'size-[132px]',
  }
  return map[props.size] ?? 'size-10'
})

const headSize = computed(() => {
  const map: Record<number, string> = {
    40: 'size-[11px] top-[8px]',
    48: 'size-[13px] top-[9px]',
    60: 'size-[16px] top-[12px]',
    94: 'size-[25px] top-[19px]',
    132: 'size-[35px] top-[27px]',
  }
  return map[props.size] ?? 'size-[11px] top-[8px]'
})

const bodySize = computed(() => {
  const map: Record<number, string> = {
    40: 'h-[11px] w-[21px] bottom-[8px] rounded-[5px]',
    48: 'h-[13px] w-[25px] bottom-[9px] rounded-[6px]',
    60: 'h-[16px] w-[31px] bottom-[11px] rounded-[8px]',
    94: 'h-[25px] w-[49px] bottom-[17px] rounded-[12px]',
    132: 'h-[35px] w-[69px] bottom-[24px] rounded-[17px]',
  }
  return map[props.size] ?? 'h-[11px] w-[21px] bottom-[8px] rounded-[5px]'
})
</script>

<template>
  <!-- 이미지가 있으면 표시 -->
  <img
    v-if="imageUrl"
    :src="imageUrl"
    alt="프로필"
    :class="[sizeClass, 'rounded-full border border-border object-cover']"
  />
  <!-- 기본 아바타 -->
  <div v-else :class="[sizeClass, 'relative rounded-full border border-text bg-white']">
    <!-- 머리 -->
    <div :class="[headSize, 'absolute left-1/2 -translate-x-1/2 rounded-full bg-text']" />
    <!-- 몸 -->
    <div :class="[bodySize, 'absolute left-1/2 -translate-x-1/2 bg-text']" />
  </div>
</template>
