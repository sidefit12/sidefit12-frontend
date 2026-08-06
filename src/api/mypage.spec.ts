/**
 * @fileoverview 마이페이지 API 단위 테스트
 *
 * 활동 요약, 내 지원 목록, 내 모집글, 북마크, 지원 취소 함수를 검증한다.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  fetchActivitySummary,
  fetchMyApplications,
  fetchMyProjects,
  fetchMyBookmarks,
  cancelApplication,
} from '@/api/mypage'
import apiClient from '@/api/client'

vi.mock('@/api/client', () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}))

describe('mypage API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // 활동 요약 조회
  it('fetchActivitySummary: GET /api/v1/users/me/activity-summary 호출', async () => {
    const mockRes = {
      data: {
        success: true,
        data: {
          authoredProjectCount: 3,
          pendingApplicationCount: 2,
          acceptedApplicationCount: 1,
          bookmarkedProjectCount: 8,
        },
      },
    }
    vi.mocked(apiClient.get).mockResolvedValue(mockRes)

    const result = await fetchActivitySummary()

    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/users/me/activity-summary')
    expect(result.authoredProjectCount).toBe(3)
  })

  // 내 지원 목록 조회
  it('fetchMyApplications: GET /api/v1/users/me/applications 호출', async () => {
    const mockRes = {
      data: {
        success: true,
        data: { items: [], statusCounts: {} },
        meta: { page: 0, size: 10, totalElements: 0, totalPages: 0, hasNext: false },
      },
    }
    vi.mocked(apiClient.get).mockResolvedValue(mockRes)

    const result = await fetchMyApplications({ size: 10 })

    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/users/me/applications', {
      params: { size: 10 },
    })
    expect(result.data.items).toEqual([])
  })

  // 내 모집글 목록 조회
  it('fetchMyProjects: GET /api/v1/users/me/projects 호출', async () => {
    const mockRes = {
      data: {
        success: true,
        data: { items: [] },
        meta: { page: 0, size: 10, totalElements: 0, totalPages: 0, hasNext: false },
      },
    }
    vi.mocked(apiClient.get).mockResolvedValue(mockRes)

    const result = await fetchMyProjects({ size: 10 })

    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/users/me/projects', {
      params: { size: 10 },
    })
    expect(result.data.items).toEqual([])
  })

  // 북마크 목록 조회
  it('fetchMyBookmarks: GET /api/v1/users/me/bookmarks 호출', async () => {
    const mockRes = {
      data: {
        success: true,
        data: { items: [] },
        meta: { page: 0, size: 10, totalElements: 0, totalPages: 0, hasNext: false },
      },
    }
    vi.mocked(apiClient.get).mockResolvedValue(mockRes)

    const result = await fetchMyBookmarks({ size: 10 })

    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/users/me/bookmarks', {
      params: { size: 10 },
    })
    expect(result.data.items).toEqual([])
  })

  // 지원 취소
  it('cancelApplication: PATCH /api/v1/applications/{id}/cancel 호출', async () => {
    vi.mocked(apiClient.patch).mockResolvedValue({ data: { success: true } })

    const result = await cancelApplication(200, '일정 불가')

    expect(apiClient.patch).toHaveBeenCalledWith('/api/v1/applications/200/cancel', {
      reason: '일정 불가',
    })
    expect(result.success).toBe(true)
  })
})
