/**
 * @fileoverview 신고 API
 *
 * POST /api/v1/projects/:projectId/reports — 프로젝트 신고
 * POST /api/v1/users/:userId/reports — 사용자 신고
 */

import apiClient from '@/api/client'

export type ReasonType =
  'SPAM' | 'HARASSMENT' | 'MISLEADING_INFORMATION' | 'INAPPROPRIATE_CONTENT' | 'OTHER'

export interface ReportCreateRequest {
  reasonType: ReasonType
  detail?: string | null
}

export interface ReportResource {
  reportId: number
  targetType: 'USER' | 'PROJECT'
  targetUserId: number | null
  targetProjectId: number | null
  reasonType: string
  detail: string | null
  reportStatus: string
  resolutionNote: string | null
  createdAt: string
}

/** 프로젝트 신고 */
export async function reportProject(projectId: number, payload: ReportCreateRequest) {
  const { data } = await apiClient.post(`/api/v1/projects/${projectId}/reports`, payload)
  return data
}

/** 사용자 신고 */
export async function reportUser(userId: number, payload: ReportCreateRequest) {
  const { data } = await apiClient.post(`/api/v1/users/${userId}/reports`, payload)
  return data
}
