/**
 * @fileoverview 프로젝트 API
 *
 * GET /api/v1/projects — 프로젝트 목록·검색 조회
 */

import apiClient from '@/api/client'
import type { ProjectCard } from '@/api/home'

export interface ProjectPageMeta {
  page: number
  size: number
  totalElements: number
  totalPages: number
  hasNext: boolean
}

export interface ProjectPageResponse {
  success: boolean
  data: {
    items: ProjectCard[]
  }
  meta: ProjectPageMeta
  requestId: string
}

export interface ProjectListParams {
  keyword?: string
  topicIds?: string
  techStackIds?: string
  roleIds?: string
  workType?: 'ONLINE' | 'OFFLINE' | 'HYBRID'
  recruitmentStatus?: 'DRAFT' | 'RECRUITING' | 'CLOSED'
  sort?: 'LATEST' | 'DEADLINE' | 'RECOMMENDED'
  page?: number
  size?: number
}

/**
 * 프로젝트 목록·검색 조회
 */
export async function fetchProjects(params: ProjectListParams = {}): Promise<ProjectPageResponse> {
  const { data } = await apiClient.get<ProjectPageResponse>('/api/v1/projects', {
    params: {
      recruitmentStatus: 'RECRUITING',
      sort: 'LATEST',
      page: 0,
      size: 20,
      ...params,
    },
  })
  return data
}

/* ────── 모집글 수정 ────── */

export interface PatchProjectPayload {
  title?: string
  summary?: string
  description?: string
  workType?: 'ONLINE' | 'OFFLINE' | 'HYBRID'
  recruitmentDeadline?: string
  weeklyHours?: number | null
  expectedStartDate?: string
  expectedEndDate?: string
  topicIds?: number[]
  techStacks?: { techStackId: number; requirementType: 'PREFERRED' | 'REQUIRED' }[]
  positions?: {
    projectPositionId?: number
    roleId: number
    positionTitle: string
    requiredCount: number
  }[]
}

/**
 * 모집글 부분 수정
 * PATCH /api/v1/projects/{projectId}
 */
export async function patchProject(
  projectId: number,
  payload: PatchProjectPayload,
): Promise<{ success: boolean }> {
  const { data } = await apiClient.patch(`/api/v1/projects/${projectId}`, payload)
  return data
}

/**
 * 모집 상태 변경
 * PATCH /api/v1/projects/{projectId}/recruitment-status
 */
export async function patchRecruitmentStatus(
  projectId: number,
  recruitmentStatus: 'RECRUITING' | 'CLOSED',
): Promise<{ success: boolean }> {
  const { data } = await apiClient.patch(`/api/v1/projects/${projectId}/recruitment-status`, {
    recruitmentStatus,
  })
  return data
}

/**
 * 모집글 삭제
 * DELETE /api/v1/projects/{projectId}
 */
export async function deleteProject(
  projectId: number,
  deletionReason: string,
): Promise<{ success: boolean }> {
  const { data } = await apiClient.delete(`/api/v1/projects/${projectId}`, {
    data: { deletionReason },
  })
  return data
}
