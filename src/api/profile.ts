/**
 * @fileoverview 프로필 API
 *
 * GET /api/v1/users/me/profile — 내 프로필 조회
 * PATCH /api/v1/users/me/profile — 기본 프로필 수정
 * PUT /api/v1/users/me/topics — 관심 토픽 설정
 * PUT /api/v1/users/me/tech-stacks — 기술 스택 설정
 * PUT /api/v1/users/me/roles — 희망 역할 설정
 * POST /api/v1/files — 파일 업로드
 */

import apiClient from '@/api/client'

/* ────── 공통 타입 ────── */

export interface SelectedTopic {
  topicId: number
  topicCode: string
  topicName: string
  isActive: boolean
  interestLevel: number
  priority: number
}

export interface SelectedTechStack {
  techStackId: number
  techStackCode: string
  techStackName: string
  category: string | null
  isActive: boolean
  proficiencyLevel: string
  experienceMonths: number
  isLearning: boolean
}

export interface SelectedRole {
  roleId: number
  roleCode: string
  roleName: string
  isActive: boolean
  priority: number
  experienceLevel: string | null
}

export interface ProfileUser {
  userId: number
  email: string
  nickname: string
  userStatus: string
  systemRole: string
  onboardingCompleted: boolean
  profileImageUrl: string | null
}

export interface ProfileFileData {
  fileId: number
  originalName: string
  url: string
}

export interface ProfileData {
  user: ProfileUser
  introduction: string | null
  careerLevel: string | null
  preferredWorkType: string | null
  preferredRegion: string | null
  availableStartDate: string | null
  availableEndDate: string | null
  availableHoursPerWeek: number | null
  profileImageFileId: number | null
  publicMaterialFileId: number | null
  profileImage: ProfileFileData | null
  publicMaterial: ProfileFileData | null
  externalLinkUrl: string | null
  topics: SelectedTopic[]
  techStacks: SelectedTechStack[]
  roles: SelectedRole[]
}

export interface ProfileResponse {
  success: boolean
  data: ProfileData
}

/* ────── 공개 프로필 조회 ────── */

export interface PublicProfileData {
  userId: number
  nickname: string
  introduction: string | null
  profileImageFileId: number | null
  publicMaterialFileId: number | null
  profileImage: ProfileFileData | null
  publicMaterial: ProfileFileData | null
  externalLinkUrl: string | null
  topics: SelectedTopic[]
  techStacks: SelectedTechStack[]
  roles: SelectedRole[]
}

export interface PublicProfileResponse {
  success: boolean
  data: PublicProfileData
}

export async function fetchPublicProfile(userId: number): Promise<PublicProfileResponse> {
  const { data } = await apiClient.get<PublicProfileResponse>(`/api/v1/users/${userId}/profile`)
  return data
}

/* ────── 내 프로필 조회 ────── */

export async function fetchMyProfile(): Promise<ProfileResponse> {
  const { data } = await apiClient.get<ProfileResponse>('/api/v1/users/me/profile')
  return data
}

/* ────── 기본 프로필 수정 ────── */

export interface ProfileUpdateRequest {
  nickname?: string
  introduction?: string | null
  careerLevel?: string | null
  preferredWorkType?: string | null
  preferredRegion?: string | null
  availableStartDate?: string | null
  availableEndDate?: string | null
  availableHoursPerWeek?: number | null
  externalLinkUrl?: string | null
  profileImageFileId?: number | null
  publicMaterialFileId?: number | null
}

export async function updateProfile(payload: ProfileUpdateRequest): Promise<ProfileResponse> {
  const { data } = await apiClient.patch<ProfileResponse>('/api/v1/users/me/profile', payload)
  return data
}

/* ────── 관심 토픽 설정 ────── */

export async function replaceTopics(topicIds: number[]) {
  const { data } = await apiClient.put('/api/v1/users/me/topics', { topicIds })
  return data
}

/* ────── 기술 스택 설정 ────── */

export interface TechStackInput {
  techStackId: number
  proficiencyLevel: 'LEARNING' | 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
  experienceMonths?: number
  isLearning?: boolean
}

export async function replaceTechStacks(techStacks: TechStackInput[]) {
  const { data } = await apiClient.put('/api/v1/users/me/tech-stacks', { techStacks })
  return data
}

/* ────── 희망 역할 설정 ────── */

export interface RoleInput {
  roleId: number
  priority: number
  experienceLevel?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
}

export async function replaceRoles(roles: RoleInput[]) {
  const { data } = await apiClient.put('/api/v1/users/me/roles', { roles })
  return data
}

/* ────── 닉네임 중복 확인 ────── */

export async function checkNicknameAvailability(nickname: string) {
  const { data } = await apiClient.get('/api/v1/auth/nickname-availability', {
    params: { nickname },
  })
  return data
}

/* ────── 파일 업로드 ────── */

export interface FileResource {
  fileId: number
  originalName: string
  mimeType: string
  fileSize: number
  fileCategory: string
  visibility: string
  previewAllowed: boolean
  downloadAllowed: boolean
  url: string
  createdAt: string
}

export async function uploadFile(
  file: File,
  fileCategory: 'PROFILE_IMAGE' | 'PUBLIC_MATERIAL',
): Promise<{ success: boolean; data: { file: FileResource } }> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('fileCategory', fileCategory)
  formData.append('visibility', 'PUBLIC')
  formData.append('previewAllowed', 'true')
  formData.append('downloadAllowed', 'false')

  const { data } = await apiClient.post('/api/v1/files', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}
