/**
 * @fileoverview 추천 API
 *
 * GET /api/v1/recommendations/projects — 개인화 프로젝트 추천 조회
 * POST /api/v1/recommendations/projects/refresh — 추천 결과 새로고침
 */

import apiClient from '@/api/client'
import type { RecommendationItem } from '@/api/home'

export interface RecommendationPageResponse {
  success: boolean
  data: {
    items: RecommendationItem[]
    fallback: boolean
    fallbackReason: string | null
  }
  meta: {
    nextCursor: string | null
    hasNext: boolean
  }
  requestId: string | null
}

/**
 * 개인화 프로젝트 추천 조회
 */
export async function fetchRecommendations(params?: {
  cursor?: string
  size?: number
}): Promise<RecommendationPageResponse> {
  const { data } = await apiClient.get<RecommendationPageResponse>(
    '/api/v1/recommendations/projects',
    { params },
  )
  return data
}

/**
 * 추천 결과 새로고침 요청
 */
export async function refreshRecommendations(force = false) {
  const { data } = await apiClient.post('/api/v1/recommendations/projects/refresh', { force })
  return data
}
