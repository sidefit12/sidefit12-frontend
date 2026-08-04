<!--
  @component DefaultLayout
  @description 기본 페이지 레이아웃.
  header(네비게이션), main(router-view), footer 3단 구조를 제공한다.
-->
<script setup lang="ts"></script>

<template>
  <div class="flex min-h-screen flex-col">
    <header class="border-b border-gray-200 px-6 py-4">
      <nav>
        <router-link to="/" class="text-lg font-semibold">Sidefit</router-link>
      </nav>
    </header>

    <main class="flex-1 p-6">
      <router-view />
    </main>

    <footer class="border-t border-gray-200 px-6 py-4 text-center text-sm text-gray-500">
      &copy; {{ new Date().getFullYear() }} Sidefit
    </footer>
  </div>
</template>
