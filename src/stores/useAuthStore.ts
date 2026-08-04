/**
 * @fileoverview 인증 상태 관리 스토어
 *
 * 로그인/로그아웃 액션과 토큰·사용자 정보를 관리한다.
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  login as loginApi,
  logout as logoutApi,
  fetchCurrentUser,
  type LoginRequest,
  type UserSummary,
} from '@/api/auth'

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref<string | null>(localStorage.getItem('accessToken'))
  const refreshTokenValue = ref<string | null>(localStorage.getItem('refreshToken'))
  const user = ref<UserSummary | null>(null)

  const isLoggedIn = computed(() => !!accessToken.value)

  /**
   * 이메일 로그인
   */
  async function login(payload: LoginRequest) {
    const res = await loginApi(payload)
    accessToken.value = res.data.accessToken
    refreshTokenValue.value = res.data.refreshToken
    user.value = res.data.user

    localStorage.setItem('accessToken', res.data.accessToken)
    localStorage.setItem('refreshToken', res.data.refreshToken)

    return res.data.user
  }

  /**
   * 로그아웃
   */
  async function logout() {
    try {
      if (refreshTokenValue.value) {
        await logoutApi(refreshTokenValue.value)
      }
    } finally {
      accessToken.value = null
      refreshTokenValue.value = null
      user.value = null
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
    }
  }

  /**
   * 앱 시작 시 토큰이 있으면 유저 정보 복원
   */
  async function initUser() {
    if (!accessToken.value) return
    try {
      const res = await fetchCurrentUser()
      user.value = res.data.user
    } catch {
      // 토큰 만료 등 실패 시 로그아웃 처리
      accessToken.value = null
      refreshTokenValue.value = null
      user.value = null
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
    }
  }

  return {
    accessToken,
    refreshTokenValue,
    user,
    isLoggedIn,
    login,
    logout,
    initUser,
  }
})
