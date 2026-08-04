/**
 * @fileoverview 홈 화면 API
 *
 * GET /api/v1/home — 프로필·활동 요약과 개인화 추천·최신·마감 임박 프로젝트를 조합해 반환.
 */

import apiClient from '@/api/client'

/** 프로젝트 카드에 포함되는 토픽 */
export interface TopicData {
  topicId: number
  topicCode: string
  topicName: string
  isActive: boolean
}

/** 프로젝트 카드에 포함되는 기술 스택 */
export interface TechStackData {
  techStackId: number
  techStackCode: string
  techStackName: string
  category: string | null
  isActive: boolean
}

/** 프로젝트 카드에 포함되는 포지션 */
export interface PositionData {
  projectPositionId: number
  positionTitle: string
  requiredCount: number
  acceptedCount: number
  positionStatus: string
  role: {
    roleId: number
    roleCode: string
    roleName: string
    isActive: boolean
  }
}

/** 프로젝트 카드 */
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
  topics: TopicData[]
  techStacks: TechStackData[]
  positions: PositionData[]
  isApplied: boolean | null
  isBookmarked: boolean | null
}

/** 추천 이유 */
export interface RecommendationReason {
  reasonType: string
  reasonText: string
  contributionScore: number | null
}

/** 추천 아이템 */
export interface RecommendationItem {
  recommendationResultId: number | null
  project: ProjectCard
  ruleScore: number
  semanticScore: number | null
  finalScore: number
  recommendationVersion: string
  reasons: RecommendationReason[]
}

/** 프로필 요약 */
export interface ProfileSummary {
  userId: number
  nickname: string
  onboardingCompleted: boolean
  preferredWorkType: string | null
}

/** 활동 요약 */
export interface ActivitySummary {
  authoredProjectCount: number
  applicationCount: number
  pendingApplicationCount: number
  acceptedApplicationCount: number
  bookmarkedProjectCount: number
}

/** 홈 응답 데이터 */
export interface HomeData {
  profileSummary: ProfileSummary
  activitySummary: ActivitySummary
  recommendations: RecommendationItem[]
  latestProjects: ProjectCard[]
  closingSoonProjects: ProjectCard[]
  partialErrors: { section: string; code: string; message: string }[]
}

/** 홈 API 응답 */
export interface HomeResponse {
  success: boolean
  data: HomeData
  requestId: string | null
}

/**
 * 홈 화면 정보 조회
 * @param sectionSize 영역별 반환 개수 (기본 6, 최대 20)
 */
export async function fetchHome(sectionSize = 6): Promise<HomeResponse> {
  const { data } = await apiClient.get<HomeResponse>('/api/v1/home', {
    params: { sectionSize },
  })
  return data
}
