/**
 * @fileoverview 홈 화면 API 단위 테스트
 *
 * fetchHome 함수가 올바른 엔드포인트와 파라미터로 호출되는지 검증한다.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchHome } from '@/api/home'
import apiClient from '@/api/client'

vi.mock('@/api/client', () => ({
  default: {
    get: vi.fn(),
  },
}))

describe('home API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('GET /api/v1/home 호출 (기본 sectionSize=6)', async () => {
    const mockData = {
      data: {
        success: true,
        data: {
          profileSummary: {},
          activitySummary: {},
          recommendations: [],
          latestProjects: [],
          closingSoonProjects: [],
          partialErrors: [],
        },
        requestId: 'req_test',
      },
    }
    vi.mocked(apiClient.get).mockResolvedValue(mockData)

    const result = await fetchHome()

    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/home', { params: { sectionSize: 6 } })
    expect(result.success).toBe(true)
  })

  it('커스텀 sectionSize 전달', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { success: true, data: {} } })

    await fetchHome(10)

    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/home', { params: { sectionSize: 10 } })
  })
})
