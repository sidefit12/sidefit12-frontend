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
