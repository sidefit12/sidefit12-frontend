/**
 * @fileoverview 인증 API
 *
 * POST /api/v1/auth/login — 이메일 로그인
 * POST /api/v1/auth/token/refresh — 토큰 재발급
 * POST /api/v1/auth/logout — 로그아웃
 * GET /api/v1/auth/me — 현재 사용자 조회
 */

import apiClient from '@/api/client'

export interface LoginRequest {
  email: string
  password: string
  deviceInfo?: string
}

export interface UserSummary {
  userId: number
  email: string | null
  nickname: string
  userStatus: string
  systemRole: string
  onboardingCompleted: boolean
  profileImageUrl: string | null
}

export interface AuthData {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
  user: UserSummary
}

export interface AuthResponse {
  success: boolean
  data: AuthData
}

/**
 * 이메일 로그인
 */
export async function login(payload: LoginRequest): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/api/v1/auth/login', payload)
  return data
}

/**
 * 토큰 재발급
 */
export async function refreshToken(refreshTokenValue: string) {
  const { data } = await apiClient.post('/api/v1/auth/token/refresh', {
    refreshToken: refreshTokenValue,
  })
  return data
}

/**
 * 로그아웃
 */
export async function logout(refreshTokenValue: string) {
  await apiClient.post('/api/v1/auth/logout', {
    refreshToken: refreshTokenValue,
  })
}

/**
 * 현재 로그인 사용자 조회
 */
export async function fetchCurrentUser() {
  const { data } = await apiClient.get('/api/v1/auth/me')
  return data
}
