/**
 * @fileoverview TanStack Vue Query 플러그인 설정
 *
 * QueryClient 인스턴스를 생성하고 기본 옵션(staleTime, retry)을 설정한 뒤,
 * Vue 앱에 VueQueryPlugin을 등록하는 헬퍼 함수를 제공한다.
 */

import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import type { VueQueryPluginOptions } from '@tanstack/vue-query'
import type { App } from 'vue'

/**
 * 전역 QueryClient 인스턴스
 *
 * - staleTime: 5분 (캐시된 데이터를 5분간 fresh로 간주)
 * - retry: 1회 (실패 시 1번 재시도)
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
})

/** VueQueryPlugin에 전달할 옵션 */
const vueQueryPluginOptions: VueQueryPluginOptions = {
  queryClient,
}

/**
 * Vue 앱에 TanStack Vue Query를 등록한다.
 *
 * @param app - Vue 앱 인스턴스
 */
export function setupQueryClient(app: App) {
  app.use(VueQueryPlugin, vueQueryPluginOptions)
}

export { queryClient }
