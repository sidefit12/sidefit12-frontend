/**
 * @fileoverview 회원가입 관련 API
 *
 * - GET /api/v1/auth/email-availability — 이메일 중복 확인
 * - GET /api/v1/auth/nickname-availability — 닉네임 중복 확인
 * - POST /api/v1/auth/email-verifications — 인증 코드 발송
 * - POST /api/v1/auth/email-verifications/confirm — 인증 코드 확인
 * - POST /api/v1/auth/sign-up — 회원가입
 */

import apiClient from '@/api/client'
import type { AuthResponse } from '@/api/auth'

/* ────────── 이메일 중복 확인 ────────── */

export interface AvailabilityResponse {
  success: boolean
  data: {
    available: boolean
    message: string
    reasonCode: string | null
  }
}

export async function checkEmailAvailability(email: string): Promise<AvailabilityResponse> {
  const { data } = await apiClient.get<AvailabilityResponse>('/api/v1/auth/email-availability', {
    params: { email },
  })
  return data
}

/* ────────── 닉네임 중복 확인 ────────── */

export async function checkNicknameAvailability(nickname: string): Promise<AvailabilityResponse> {
  const { data } = await apiClient.get<AvailabilityResponse>('/api/v1/auth/nickname-availability', {
    params: { nickname },
  })
  return data
}

/* ────────── 이메일 인증 코드 발송 ────────── */

export interface VerificationDispatchResponse {
  success: boolean
  data: {
    verificationId: number
    expiresAt: string
    resendAvailableAt: string
  }
}

export async function sendVerificationCode(
  email: string,
  verificationType = 'SIGN_UP',
): Promise<VerificationDispatchResponse> {
  const { data } = await apiClient.post<VerificationDispatchResponse>(
    '/api/v1/auth/email-verifications',
    { email, verificationType },
  )
  return data
}

/* ────────── 이메일 인증 코드 확인 ────────── */

export interface VerificationConfirmResponse {
  success: boolean
  data: {
    verified: boolean
    verificationToken: string
    expiresAt: string
  }
}

export async function confirmVerificationCode(
  email: string,
  code: string,
  verificationType = 'SIGN_UP',
): Promise<VerificationConfirmResponse> {
  const { data } = await apiClient.post<VerificationConfirmResponse>(
    '/api/v1/auth/email-verifications/confirm',
    { email, code, verificationType },
  )
  return data
}

/* ────────── 회원가입 ────────── */

export interface SignUpRequest {
  email: string
  nickname: string
  password: string
  passwordConfirm: string
  verificationToken: string
  termsServiceRequired: boolean
  termsPrivacyRequired: boolean
  termsMarketingOptional: boolean
}

export async function signUp(payload: SignUpRequest): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/api/v1/auth/sign-up', payload)
  return data
}
