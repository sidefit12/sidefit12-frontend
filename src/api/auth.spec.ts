/**
 * @fileoverview 인증 API 단위 테스트
 *
 * login, logout, fetchCurrentUser 함수가 올바른 엔드포인트를 호출하는지 검증한다.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  login,
  logout,
  fetchCurrentUser,
  requestPasswordReset,
  confirmPasswordReset,
  withdraw,
} from '@/api/auth'
import apiClient from '@/api/client'

vi.mock('@/api/client', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('auth API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('login', () => {
    it('POST /api/v1/auth/login 호출', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            accessToken: 'at',
            refreshToken: 'rt',
            tokenType: 'Bearer',
            expiresIn: 1800,
            user: {},
          },
        },
      }
      vi.mocked(apiClient.post).mockResolvedValue(mockResponse)

      const result = await login({ email: 'test@test.com', password: 'pass' })

      expect(apiClient.post).toHaveBeenCalledWith('/api/v1/auth/login', {
        email: 'test@test.com',
        password: 'pass',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('logout', () => {
    it('POST /api/v1/auth/logout 호출', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ data: {} })

      await logout('rt_test')

      expect(apiClient.post).toHaveBeenCalledWith('/api/v1/auth/logout', {
        refreshToken: 'rt_test',
      })
    })
  })

  describe('fetchCurrentUser', () => {
    it('GET /api/v1/auth/me 호출', async () => {
      const mockResponse = {
        data: { success: true, data: { user: { userId: 1, nickname: 'test' } } },
      }
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)

      const result = await fetchCurrentUser()

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/auth/me')
      expect(result.data.user.nickname).toBe('test')
    })
  })

  describe('requestPasswordReset', () => {
    it('POST /api/v1/auth/password-reset/request 호출', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ data: {} })

      await requestPasswordReset({ email: 'user@test.com' })

      expect(apiClient.post).toHaveBeenCalledWith('/api/v1/auth/password-reset/request', {
        email: 'user@test.com',
      })
    })
  })

  describe('confirmPasswordReset', () => {
    it('POST /api/v1/auth/password-reset/confirm 호출', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ data: {} })

      await confirmPasswordReset({
        newPassword: 'NewPass123!',
        newPasswordConfirm: 'NewPass123!',
        resetToken: 'prt_abc',
      })

      expect(apiClient.post).toHaveBeenCalledWith('/api/v1/auth/password-reset/confirm', {
        newPassword: 'NewPass123!',
        newPasswordConfirm: 'NewPass123!',
        resetToken: 'prt_abc',
      })
    })
  })

  describe('withdraw', () => {
    it('DELETE /api/v1/users/me 호출', async () => {
      vi.mocked(apiClient.delete).mockResolvedValue({ data: {} })

      await withdraw({ confirmation: 'WITHDRAW', password: 'P@ssw0rd!' })

      expect(apiClient.delete).toHaveBeenCalledWith('/api/v1/users/me', {
        data: { confirmation: 'WITHDRAW', password: 'P@ssw0rd!' },
      })
    })
  })
})
