/**
 * @fileoverview useAuthStore 단위 테스트
 *
 * 로그인, 로그아웃, 토큰 기반 유저 복원(initUser) 동작을 검증한다.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/useAuthStore'

// Mock API module
vi.mock('@/api/auth', () => ({
  login: vi.fn(),
  logout: vi.fn(),
  fetchCurrentUser: vi.fn(),
}))

import { login as loginApi, logout as logoutApi, fetchCurrentUser } from '@/api/auth'

describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('초기 상태', () => {
    it('토큰 없으면 비로그인 상태', () => {
      const store = useAuthStore()
      expect(store.isLoggedIn).toBe(false)
      expect(store.user).toBeNull()
    })

    it('localStorage에 토큰 있으면 isLoggedIn true', () => {
      localStorage.setItem('accessToken', 'test-token')
      const store = useAuthStore()
      expect(store.isLoggedIn).toBe(true)
    })
  })

  describe('login', () => {
    it('로그인 성공 시 토큰과 유저 저장', async () => {
      const mockUser = {
        userId: 1,
        email: 'test@test.com',
        nickname: 'tester',
        userStatus: 'ACTIVE',
        systemRole: 'USER',
        onboardingCompleted: false,
        profileImageUrl: null,
      }

      vi.mocked(loginApi).mockResolvedValue({
        success: true,
        data: {
          accessToken: 'at_test',
          refreshToken: 'rt_test',
          tokenType: 'Bearer',
          expiresIn: 1800,
          user: mockUser,
        },
      })

      const store = useAuthStore()
      await store.login({ email: 'test@test.com', password: 'password' })

      expect(store.isLoggedIn).toBe(true)
      expect(store.user?.nickname).toBe('tester')
      expect(localStorage.getItem('accessToken')).toBe('at_test')
      expect(localStorage.getItem('refreshToken')).toBe('rt_test')
    })

    it('로그인 실패 시 에러 전파', async () => {
      vi.mocked(loginApi).mockRejectedValue(new Error('401'))

      const store = useAuthStore()
      await expect(store.login({ email: 'x', password: 'y' })).rejects.toThrow()
      expect(store.isLoggedIn).toBe(false)
    })
  })

  describe('logout', () => {
    it('로그아웃 시 상태 초기화', async () => {
      localStorage.setItem('accessToken', 'at')
      localStorage.setItem('refreshToken', 'rt')

      vi.mocked(logoutApi).mockResolvedValue(undefined)

      const store = useAuthStore()
      store.user = {
        userId: 1,
        email: null,
        nickname: 'x',
        userStatus: 'ACTIVE',
        systemRole: 'USER',
        onboardingCompleted: true,
        profileImageUrl: null,
      }
      await store.logout()

      expect(store.isLoggedIn).toBe(false)
      expect(store.user).toBeNull()
      expect(localStorage.getItem('accessToken')).toBeNull()
    })
  })

  describe('initUser', () => {
    it('토큰 있으면 유저 정보 복원', async () => {
      localStorage.setItem('accessToken', 'at_test')

      vi.mocked(fetchCurrentUser).mockResolvedValue({
        success: true,
        data: {
          user: {
            userId: 1,
            email: 'test@test.com',
            nickname: 'restored',
            userStatus: 'ACTIVE',
            systemRole: 'USER',
            onboardingCompleted: true,
            profileImageUrl: null,
          },
        },
      })

      const store = useAuthStore()
      await store.initUser()

      expect(store.user?.nickname).toBe('restored')
    })

    it('토큰 만료 시 자동 로그아웃', async () => {
      localStorage.setItem('accessToken', 'expired')
      localStorage.setItem('refreshToken', 'rt')

      vi.mocked(fetchCurrentUser).mockRejectedValue(new Error('401'))

      const store = useAuthStore()
      await store.initUser()

      expect(store.isLoggedIn).toBe(false)
      expect(localStorage.getItem('accessToken')).toBeNull()
    })

    it('토큰 없으면 아무것도 안 함', async () => {
      const store = useAuthStore()
      await store.initUser()

      expect(fetchCurrentUser).not.toHaveBeenCalled()
    })
  })
})
