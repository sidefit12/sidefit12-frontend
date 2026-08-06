/**
 * @fileoverview 기준정보 API
 *
 * GET /api/v1/topics — 토픽 목록 조회
 * GET /api/v1/tech-stacks — 기술 스택 목록 조회
 * GET /api/v1/roles — 역할 목록 조회
 */

import apiClient from '@/api/client'

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

export interface TopicListResponse {
  success: boolean
  data: { items: TopicItem[] }
  requestId: string | null
}

export interface TechStackListResponse {
  success: boolean
  data: { items: TechStackItem[] }
  requestId: string | null
}

export interface RoleListResponse {
  success: boolean
  data: { items: RoleItem[] }
  requestId: string | null
}

/**
 * 활성 토픽 목록 조회
 */
export async function fetchTopics(): Promise<TopicListResponse> {
  const { data } = await apiClient.get<TopicListResponse>('/api/v1/topics')
  return data
}

/**
 * 활성 기술 스택 목록 조회
 */
export async function fetchTechStacks(): Promise<TechStackListResponse> {
  const { data } = await apiClient.get<TechStackListResponse>('/api/v1/tech-stacks')
  return data
}

/**
 * 활성 역할 목록 조회
 */
export async function fetchRoles(): Promise<RoleListResponse> {
  const { data } = await apiClient.get<RoleListResponse>('/api/v1/roles')
  return data
}
