<!--
  @component DefaultLayout
  @description 기본 페이지 레이아웃.
  AppHeader + main(router-view with page transition) 구조를 제공한다.
-->
<script setup lang="ts">
import AppHeader from '@/components/AppHeader.vue'
</script>

<template>
  <div class="flex min-h-screen flex-col font-sans">
    <AppHeader />

    <main class="flex-1">
      <router-view v-slot="{ Component }">
        <transition name="page" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
</template>
