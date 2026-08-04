/**
 * @fileoverview Vitest 테스트 설정
 *
 * vite.config.ts를 확장하여 테스트 전용 설정을 추가한다.
 * - globals: describe/it/expect 등을 import 없이 사용
 * - environment: jsdom (브라우저 DOM 시뮬레이션)
 * - include: src 하위의 *.test.ts / *.spec.ts 파일
 */

import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.ts'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      globals: true,
      environment: 'jsdom',
      include: ['src/**/*.{test,spec}.{ts,tsx}'],
    },
  }),
)
