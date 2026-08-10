/**
 * @fileoverview 추천 API 단위 테스트
 *
 * fetchRecommendations — 개인화 추천 조회 (GET, 커서 페이징)
 * refreshRecommendations — 추천 결과 새로고침 (POST)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchRecommendations, refreshRecommendations } from '@/api/recommendations'
import apiClient from '@/api/client'

vi.mock('@/api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

describe('fetchRecommendations API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('기본 파라미터로 GET /api/v1/recommendations/projects 호출', async () => {
    const mockData = {
      data: {
        success: true,
        data: { items: [], fallback: false, fallbackReason: null },
        meta: { nextCursor: null, hasNext: false },
        requestId: 'req_test',
      },
    }
    vi.mocked(apiClient.get).mockResolvedValue(mockData)

    const result = await fetchRecommendations()

    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/recommendations/projects', {
      params: { size: 20 },
    })
    expect(result.success).toBe(true)
    expect(result.data.items).toEqual([])
    expect(result.meta.hasNext).toBe(false)
  })

  it('커서와 사이즈 파라미터 전달', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        success: true,
        data: { items: [], fallback: false, fallbackReason: null },
        meta: { nextCursor: 'cursor_abc', hasNext: true },
        requestId: 'req',
      },
    })

    await fetchRecommendations({ cursor: 'cursor_prev', size: 10 })

    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/recommendations/projects', {
      params: { size: 10, cursor: 'cursor_prev' },
    })
  })
})

/**
 * refreshRecommendations — 추천 새로고침
 * POST /api/v1/recommendations/projects/refresh
 */
describe('refreshRecommendations API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('force=false로 POST 호출', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      data: {
        success: true,
        data: { jobId: 'job_123', status: 'QUEUED' },
        requestId: 'req',
      },
    })

    const result = await refreshRecommendations(false)

    expect(apiClient.post).toHaveBeenCalledWith('/api/v1/recommendations/projects/refresh', {
      force: false,
    })
    expect(result.success).toBe(true)
    expect(result.data.jobId).toBe('job_123')
    expect(result.data.status).toBe('QUEUED')
  })

  it('force=true로 POST 호출', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      data: {
        success: true,
        data: { jobId: 'job_456', status: 'QUEUED' },
        requestId: 'req',
      },
    })

    const result = await refreshRecommendations(true)

    expect(apiClient.post).toHaveBeenCalledWith('/api/v1/recommendations/projects/refresh', {
      force: true,
    })
    expect(result.data.jobId).toBe('job_456')
  })
})
