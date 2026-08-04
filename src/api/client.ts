/**
 * @fileoverview Axios HTTP 클라이언트 인스턴스
 *
 * 공통 baseURL, timeout, 헤더를 설정하고
 * 요청/응답 인터셉터를 통해 인증 토큰 주입 및 전역 에러 처리를 담당한다.
 *
 * @example
 * ```ts
 * import apiClient from '@/api/client'
 *
 * const { data } = await apiClient.get('/users')
 * ```
 */

import axios from 'axios'

/**
 * 전역 Axios 인스턴스
 *
 * - baseURL: 환경변수 `VITE_API_BASE_URL` 또는 기본값 `/api`
 * - timeout: 10초
 */
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

/**
 * 요청 인터셉터
 *
 * 모든 요청 전에 실행되며, 인증 토큰 등을 헤더에 추가하는 데 사용한다.
 */
apiClient.interceptors.request.use(
  (config) => {
    // TODO: Add auth token if needed
    return config
  },
  (error) => Promise.reject(error),
)

/**
 * 응답 인터셉터
 *
 * 모든 응답에 대해 실행되며, 401/500 등 전역 에러 핸들링에 사용한다.
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // TODO: Handle global errors (401, 500, etc.)
    return Promise.reject(error)
  },
)

export default apiClient
