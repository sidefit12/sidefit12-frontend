/**
 * @fileoverview useExampleStore 단위 테스트
 *
 * Pinia 카운터 스토어의 초기값과 increment 동작을 검증한다.
 */

import { setActivePinia, createPinia } from 'pinia'
import { useExampleStore } from './useExampleStore'

describe('useExampleStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should start with count 0', () => {
    const store = useExampleStore()
    expect(store.count).toBe(0)
  })

  it('should increment count', () => {
    const store = useExampleStore()
    store.increment()
    expect(store.count).toBe(1)
  })
})
