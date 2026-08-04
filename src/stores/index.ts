/**
 * @fileoverview Pinia 스토어 인스턴스
 *
 * 애플리케이션 전역 상태 관리를 위한 Pinia 인스턴스를 생성하여 내보낸다.
 */

import { createPinia } from 'pinia'

/** Pinia 루트 인스턴스 */
const pinia = createPinia()

export default pinia
