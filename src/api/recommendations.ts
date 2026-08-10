/**
 * @fileoverview 추천 API
 *
 * GET /api/v1/recommendations/projects — 개인화 프로젝트 추천 조회
 * POST /api/v1/recommendations/projects/refresh — 추천 결과 새로고침
 */

import apiClient from '@/api/client'
import type { ProjectCard } from '@/api/home'

/** 추천 이유 */
export interface RecommendationReason {
  reasonType: string
  reasonText: string
  contributionScore: number | null
}

/** 추천 항목 */
export interface RecommendationItem {
  recommendationResultId: number | null
  project: ProjectCard
  ruleScore: number
  semanticScore: number | null
  finalScore: number
  recommendationVersion: string
  reasons: RecommendationReason[]
}

/** 추천 목록 응답 데이터 */
export interface RecommendationPageData {
  items: RecommendationItem[]
  fallback: boolean
  fallbackReason: string | null
}

/** 커서 메타 */
export interface CursorMeta {
  nextCursor: string | null
  hasNext: boolean
}

/** 추천 목록 응답 */
export interface RecommendationPageResponse {
  success: boolean
  data: RecommendationPageData
  meta: CursorMeta
  requestId: string | null
}

/** 새로고침 응답 */
export interface RecommendationRefreshResponse {
  success: boolean
  data: { jobId: string; status: string }
  requestId: string | null
}

/**
 * 개인화 프로젝트 추천 조회
 * GET /api/v1/recommendations/projects
 */
export async function fetchRecommendations(
  params: { cursor?: string; size?: number } = {},
): Promise<RecommendationPageResponse> {
  const { data } = await apiClient.get<RecommendationPageResponse>(
    '/api/v1/recommendations/projects',
    { params: { size: 20, ...params } },
  )
  return data
}

/**
 * 추천 결과 새로고침
 * POST /api/v1/recommendations/projects/refresh
 */
export async function refreshRecommendations(
  force = false,
): Promise<RecommendationRefreshResponse> {
  const { data } = await apiClient.post<RecommendationRefreshResponse>(
    '/api/v1/recommendations/projects/refresh',
    { force },
  )
  return data
}
