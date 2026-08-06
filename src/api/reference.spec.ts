/**
 * @fileoverview 기준정보 API 단위 테스트
 *
 * fetchTopics, fetchTechStacks, fetchRoles 함수가 올바른 엔드포인트를 호출하는지 검증한다.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchTopics, fetchTechStacks, fetchRoles } from '@/api/reference'
import apiClient from '@/api/client'

vi.mock('@/api/client', () => ({
  default: {
    get: vi.fn(),
  },
}))

describe('reference API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('GET /api/v1/topics 호출', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        success: true,
        data: {
          items: [{ topicId: 1, topicCode: 'FINTECH', topicName: '핀테크', isActive: true }],
        },
      },
    })

    const result = await fetchTopics()

    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/topics')
    expect(result.data.items).toHaveLength(1)
    expect(result.data.items[0].topicName).toBe('핀테크')
  })

  it('GET /api/v1/tech-stacks 호출', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        success: true,
        data: {
          items: [
            {
              techStackId: 4,
              techStackCode: 'FASTAPI',
              techStackName: 'FastAPI',
              category: 'Backend',
              isActive: true,
            },
          ],
        },
      },
    })

    const result = await fetchTechStacks()

    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/tech-stacks')
    expect(result.data.items[0].techStackName).toBe('FastAPI')
  })

  it('GET /api/v1/roles 호출', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        success: true,
        data: { items: [{ roleId: 2, roleCode: 'BACKEND', roleName: '백엔드', isActive: true }] },
      },
    })

    const result = await fetchRoles()

    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/roles')
    expect(result.data.items[0].roleName).toBe('백엔드')
  })
})
