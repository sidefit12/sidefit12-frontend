/**
 * @fileoverview 프로젝트 상세 API 단위 테스트
 *
 * fetchProjectDetail 함수가 올바른 엔드포인트를 호출하는지 검증한다.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchProjectDetail } from '@/api/projectDetail'
import apiClient from '@/api/client'

vi.mock('@/api/client', () => ({
  default: {
    get: vi.fn(),
  },
}))

describe('projectDetail API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('GET /api/v1/projects/{id} 호출', async () => {
    const mockData = {
      data: {
        success: true,
        data: {
          project: { projectId: 100, title: '테스트 프로젝트' },
          description: '설명',
          expectedStartDate: null,
          expectedEndDate: null,
          weeklyHours: null,
          visibility: 'PUBLIC',
          updatedAt: '2026-08-01T00:00:00Z',
          shareUrl: 'https://sidefit.dev/projects/100',
          ownerProfile: { userId: 1, nickname: 'leader' },
          memberSummary: { totalMembers: 1 },
        },
        requestId: 'req_test',
      },
    }
    vi.mocked(apiClient.get).mockResolvedValue(mockData)

    const result = await fetchProjectDetail(100)

    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/projects/100')
    expect(result.success).toBe(true)
    expect(result.data.project.projectId).toBe(100)
  })
})
