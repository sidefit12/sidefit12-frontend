/**
 * @fileoverview 프로젝트 API 단위 테스트
 *
 * fetchProjects 함수가 올바른 엔드포인트와 기본 파라미터로 호출되는지 검증한다.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchProjects } from '@/api/projects'
import apiClient from '@/api/client'

vi.mock('@/api/client', () => ({
  default: {
    get: vi.fn(),
  },
}))

describe('projects API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('기본 파라미터로 GET /api/v1/projects 호출', async () => {
    const mockData = {
      data: {
        success: true,
        data: { items: [] },
        meta: { page: 0, size: 20, totalElements: 0, totalPages: 0, hasNext: false },
        requestId: 'req_test',
      },
    }
    vi.mocked(apiClient.get).mockResolvedValue(mockData)

    const result = await fetchProjects()

    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/projects', {
      params: {
        recruitmentStatus: 'RECRUITING',
        sort: 'LATEST',
        page: 0,
        size: 20,
      },
    })
    expect(result.success).toBe(true)
    expect(result.data.items).toEqual([])
  })

  it('커스텀 파라미터 전달', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        success: true,
        data: { items: [] },
        meta: { page: 1, size: 10, totalElements: 0, totalPages: 0, hasNext: false },
        requestId: 'req',
      },
    })

    await fetchProjects({ keyword: '핀테크', page: 1, size: 10, sort: 'DEADLINE' })

    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/projects', {
      params: {
        recruitmentStatus: 'RECRUITING',
        sort: 'DEADLINE',
        page: 1,
        size: 10,
        keyword: '핀테크',
      },
    })
  })

  it('topicIds, roleIds 파라미터 전달', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        success: true,
        data: { items: [] },
        meta: { page: 0, size: 20, totalElements: 0, totalPages: 0, hasNext: false },
        requestId: 'req',
      },
    })

    await fetchProjects({ topicIds: '1,3', roleIds: '2' })

    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/projects', {
      params: expect.objectContaining({
        topicIds: '1,3',
        roleIds: '2',
      }),
    })
  })
})
