/**
 * @fileoverview Vite 빌드 설정
 *
 * - Vue 3 SFC 지원 (@vitejs/plugin-vue)
 * - Tailwind CSS v4 빌드 통합 (@tailwindcss/vite)
 * - `@` alias를 `src/` 디렉토리로 매핑
 *
 * @see https://vite.dev/config/
 */

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
})
