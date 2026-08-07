<!--
  @component DefaultLayout
  @description 기본 페이지 레이아웃.
  AppHeader + main(router-view with page transition) 구조를 제공한다.
  404 페이지에서는 헤더를 숨긴다.
-->
<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'

const route = useRoute()
const hideHeader = computed(() => route.name === 'NotFound')
</script>

<template>
  <div class="flex min-h-screen flex-col font-sans">
    <AppHeader v-if="!hideHeader" />

    <main class="flex-1">
      <router-view v-slot="{ Component }">
        <transition name="page" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
</template>
