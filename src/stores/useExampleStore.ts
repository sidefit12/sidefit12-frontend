/**
 * @fileoverview 예시 카운터 스토어
 *
 * Pinia Composition API 스타일의 스토어 작성 예시.
 * 실제 기능 개발 시 이 파일을 참고하여 새 스토어를 생성한다.
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * 카운터 예시 스토어
 *
 * @example
 * ```ts
 * const store = useExampleStore()
 * store.increment()
 * console.log(store.count) // 1
 * ```
 */
export const useExampleStore = defineStore('example', () => {
  /** 현재 카운트 값 */
  const count = ref(0)

  /**
   * 카운트를 1 증가시킨다.
   */
  function increment() {
    count.value++
  }

  return { count, increment }
})
