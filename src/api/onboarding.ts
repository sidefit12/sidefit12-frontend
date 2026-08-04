/**
 * @fileoverview 온보딩 API
 *
 * GET /api/v1/onboarding/options — 토픽·기술·역할 목록 + 현재 선택값
 * PUT /api/v1/users/me/onboarding — 온보딩 정보 일괄 저장
 */

import apiClient from '@/api/client'

/* ────── 타입 ────── */

export interface TopicItem {
  topicId: number
  topicCode: string
  topicName: string
  isActive: boolean
}

export interface TechStackItem {
  techStackId: number
  techStackCode: string
  techStackName: string
  category: string | null
  isActive: boolean
}

export interface RoleItem {
  roleId: number
  roleCode: string
  roleName: string
  isActive: boolean
}

export interface OnboardingOptionsData {
  currentSelection: {
    topicIds: number[]
    techStackIds: number[]
    roleIds: number[]
  }
  topics: TopicItem[]
  techStacks: TechStackItem[]
  roles: RoleItem[]
}

export interface OnboardingOptionsResponse {
  success: boolean
  data: OnboardingOptionsData
}

export interface TechStackSelection {
  techStackId: number
  proficiencyLevel: 'LEARNING' | 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
  experienceMonths: number
  isLearning: boolean
}

export interface RoleSelection {
  roleId: number
  priority: number
  experienceLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | null
}

export interface OnboardingRequest {
  introduction?: string | null
  preferredWorkType?: 'ONLINE' | 'OFFLINE' | 'HYBRID' | null
  preferredRegion?: string | null
  availableStartDate?: string | null
  availableEndDate?: string | null
  availableHoursPerWeek?: number | null
  topicIds: number[]
  techStacks: TechStackSelection[]
  roles: RoleSelection[]
}

/* ────── API 함수 ────── */

/**
 * 온보딩 선택 정보 조회
 */
export async function fetchOnboardingOptions(): Promise<OnboardingOptionsResponse> {
  const { data } = await apiClient.get<OnboardingOptionsResponse>('/api/v1/onboarding/options')
  return data
}

/**
 * 온보딩 정보 일괄 저장
 */
export async function saveOnboarding(payload: OnboardingRequest) {
  const { data } = await apiClient.put('/api/v1/users/me/onboarding', payload)
  return data
}
