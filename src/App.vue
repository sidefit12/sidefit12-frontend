<!--
  @component App
  @description 루트 컴포넌트. 앱 시작 시 인증 상태를 복원하고 DefaultLayout을 렌더링한다.
-->
<script setup lang="ts">
import { onMounted } from 'vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import { useAuthStore } from '@/stores/useAuthStore'

const authStore = useAuthStore()

onMounted(() => {
  authStore.initUser()
})
</script>

<template>
  <DefaultLayout />
</template>
