/**
 * @fileoverview 마이페이지 API
 *
 * GET /api/v1/users/me/applications — 내 지원 목록
 * GET /api/v1/users/me/projects — 내 모집글 목록
 * GET /api/v1/users/me/bookmarks — 내 북마크 프로젝트 목록
 * GET /api/v1/home — 활동 요약 (activitySummary 필드)
 */

import apiClient from '@/api/client'

/* ────── 활동 요약 (홈 API에서 추출) ────── */

export interface ActivitySummary {
  authoredProjectCount: number
  applicationCount: number
  pendingApplicationCount: number
  acceptedApplicationCount: number
  bookmarkedProjectCount: number
}

/**
 * 홈 API 대신 전용 엔드포인트에서 요약 조회
 */
export async function fetchActivitySummary(): Promise<ActivitySummary> {
  const { data } = await apiClient.get('/api/v1/users/me/activity-summary')
  return data.data
}

/* ────── 내 지원 목록 ────── */

export interface ApplicationResource {
  applicationId: number
  projectId: number
  projectPositionId: number
  projectTitle: string | null
  applicationMessage: string | null
  applicationStatus: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELED'
  appliedAt: string
  reviewedAt: string | null
  rejectionReason: string | null
  applicant: { userId: number; nickname: string }
  project: {
    projectId: number
    title: string
    workType: string
    recruitmentDeadline: string
    recruitmentStatus: string
    topics: { topicId: number; topicCode: string; topicName: string; isActive: boolean }[]
    techStacks: {
      techStackId: number
      techStackCode: string
      techStackName: string
      category: string | null
      isActive: boolean
    }[]
    positions: {
      projectPositionId: number
      positionTitle: string
      requiredCount: number
      acceptedCount: number
      positionStatus: string
      role: { roleId: number; roleCode: string; roleName: string; isActive: boolean }
    }[]
  } | null
}

export interface ApplicationPageResponse {
  success: boolean
  data: {
    items: ApplicationResource[]
    statusCounts: Record<string, number>
  }
  meta: {
    page: number
    size: number
    totalElements: number
    totalPages: number
    hasNext: boolean
  }
}

export async function fetchMyApplications(
  params: { status?: string; page?: number; size?: number } = {},
): Promise<ApplicationPageResponse> {
  const { data } = await apiClient.get<ApplicationPageResponse>('/api/v1/users/me/applications', {
    params,
  })
  return data
}

/* ────── 내 모집글 목록 ────── */

export interface ProjectCard {
  projectId: number
  title: string
  summary: string
  workType: string
  region: string | null
  recruitmentDeadline: string
  recruitmentStatus: string
  projectStatus: string
  viewCount: number
  createdAt: string
  owner: { userId: number; nickname: string }
  topics: { topicId: number; topicCode: string; topicName: string; isActive: boolean }[]
  techStacks: {
    techStackId: number
    techStackCode: string
    techStackName: string
    category: string | null
    isActive: boolean
  }[]
  positions: {
    projectPositionId: number
    positionTitle: string
    requiredCount: number
    acceptedCount: number
    positionStatus: string
    role: { roleId: number; roleCode: string; roleName: string; isActive: boolean }
  }[]
  isApplied: boolean | null
  isBookmarked: boolean | null
}

export interface ProjectPageResponse {
  success: boolean
  data: {
    items: ProjectCard[]
  }
  meta: {
    page: number
    size: number
    totalElements: number
    totalPages: number
    hasNext: boolean
  }
}

export async function fetchMyProjects(
  params: { status?: string; page?: number; size?: number; includeDeleted?: boolean } = {},
): Promise<ProjectPageResponse> {
  const { data } = await apiClient.get<ProjectPageResponse>('/api/v1/users/me/projects', {
    params,
  })
  return data
}

/* ────── 내 북마크 프로젝트 ────── */

export async function fetchMyBookmarks(
  params: { page?: number; size?: number; includeClosed?: boolean } = {},
): Promise<ProjectPageResponse> {
  const { data } = await apiClient.get<ProjectPageResponse>('/api/v1/users/me/bookmarks', {
    params,
  })
  return data
}

/* ────── 지원 취소 ────── */

export async function cancelApplication(
  applicationId: number,
  reason?: string,
): Promise<{ success: boolean }> {
  const { data } = await apiClient.patch(`/api/v1/applications/${applicationId}/cancel`, {
    reason: reason ?? null,
  })
  return data
}
