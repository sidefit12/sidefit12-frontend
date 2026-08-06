/**
 * @fileoverview 프로젝트 상세 API
 *
 * GET /api/v1/projects/{projectId} — 프로젝트 상세 조회
 */

import apiClient from '@/api/client'
import type { ProjectCard } from '@/api/home'

export interface MemberSummary {
  totalMembers: number
}

export interface ProjectDetailData {
  project: ProjectCard
  description: string
  expectedStartDate: string | null
  expectedEndDate: string | null
  weeklyHours: number | null
  visibility: string
  updatedAt: string
  shareUrl: string
  ownerProfile: { userId: number; nickname: string }
  memberSummary: MemberSummary
  myApplication: { applicationStatus: string } | null
}

export interface ProjectDetailResponse {
  success: boolean
  data: ProjectDetailData
  requestId: string
}

/**
 * 프로젝트 상세 조회
 */
export async function fetchProjectDetail(projectId: number): Promise<ProjectDetailResponse> {
  const { data } = await apiClient.get<ProjectDetailResponse>(`/api/v1/projects/${projectId}`)
  return data
}
