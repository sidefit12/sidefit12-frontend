/**
 * @fileoverview 프로젝트 지원 API 단위 테스트
 *
 * createApplication 함수가 올바른 엔드포인트와 페이로드로 호출되는지 검증한다.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createApplication } from '@/api/application'
import apiClient from '@/api/client'

vi.mock('@/api/client', () => ({
  default: {
    post: vi.fn(),
  },
}))

describe('application API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('POST /api/v1/projects/{id}/applications 호출', async () => {
    const mockData = {
      data: {
        success: true,
        data: {
          applicationId: 200,
          projectId: 100,
          projectPositionId: 21,
          applicationMessage: '지원합니다.',
          applicationStatus: 'PENDING',
          appliedAt: '2026-08-02T00:00:00Z',
          reviewedAt: null,
          rejectionReason: null,
          applicant: { userId: 2, nickname: 'applicant' },
        },
        requestId: 'req_test',
      },
    }
    vi.mocked(apiClient.post).mockResolvedValue(mockData)

    const result = await createApplication(100, {
      applicationMessage: '지원합니다.',
      projectPositionId: 21,
    })

    expect(apiClient.post).toHaveBeenCalledWith('/api/v1/projects/100/applications', {
      applicationMessage: '지원합니다.',
      projectPositionId: 21,
    })
    expect(result.success).toBe(true)
    expect(result.data.applicationStatus).toBe('PENDING')
  })
})
