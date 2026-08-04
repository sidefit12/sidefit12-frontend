<!--
  @component AppHeader
  @description 전역 네비게이션 헤더. Figma 디자인 기준 76px 높이, 1440px max-width.
-->
<script setup lang="ts"></script>

<template>
  <header class="sticky top-0 z-50 border-b border-border bg-white">
    <div class="mx-auto flex h-[76px] max-w-[1440px] items-center px-11">
      <!-- Logo -->
      <router-link to="/" class="mr-10 shrink-0">
        <img src="/logo-identity.png" alt="SIDEFIT" class="h-9 w-[136px] object-contain" />
      </router-link>

      <!-- Navigation -->
      <nav class="flex items-center gap-6">
        <router-link to="/projects" class="text-sm font-bold text-text hover:text-text">
          프로젝트 찾기
        </router-link>
        <router-link to="/recommend" class="text-sm text-text-secondary hover:text-text">
          AI 추천
        </router-link>
        <router-link to="/activity" class="text-sm text-text-secondary hover:text-text">
          내 활동
        </router-link>
      </nav>

      <!-- Search -->
      <div class="ml-auto flex h-11 w-[286px] items-center rounded-full bg-bg-muted px-5">
        <span class="text-[13px] text-[#8d8d8d]"> 프로젝트명, 기술 스택 검색 </span>
        <span class="ml-auto text-lg text-text-secondary">⌕</span>
      </div>

      <!-- CTA -->
      <router-link
        to="/write"
        class="ml-4 flex h-[46px] items-center justify-center rounded-full bg-primary px-6 text-sm font-bold text-text"
      >
        모집글 작성
      </router-link>

      <!-- Profile -->
      <div class="ml-4 flex items-center gap-2">
        <div
          class="flex size-10 items-center justify-center rounded-full border border-text bg-white"
        >
          <div class="size-[11px] rounded-full bg-text" />
        </div>
        <span class="text-sm font-bold text-text">백현빈</span>
        <span class="text-sm text-text-secondary">⌄</span>
      </div>
    </div>
  </header>
</template>
