/**
 * @fileoverview 프로젝트 지원 API
 *
 * POST /api/v1/projects/{projectId}/applications — 프로젝트 지원
 */

import apiClient from '@/api/client'

export interface ApplicationCreateRequest {
  applicationMessage: string
  projectPositionId: number
}

export interface ApplicationResource {
  applicationId: number
  projectId: number
  projectPositionId: number
  applicationMessage: string | null
  applicationStatus: string
  appliedAt: string
  reviewedAt: string | null
  rejectionReason: string | null
  applicant: { userId: number; nickname: string }
}

export interface ApplicationResponse {
  success: boolean
  data: ApplicationResource
  requestId: string | null
}

/**
 * 프로젝트 지원
 */
export async function createApplication(
  projectId: number,
  payload: ApplicationCreateRequest,
): Promise<ApplicationResponse> {
  const { data } = await apiClient.post<ApplicationResponse>(
    `/api/v1/projects/${projectId}/applications`,
    payload,
  )
  return data
}
