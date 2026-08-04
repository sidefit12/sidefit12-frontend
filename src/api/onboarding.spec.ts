/**
 * @fileoverview 온보딩 API 단위 테스트
 *
 * fetchOnboardingOptions, saveOnboarding 함수의 호출을 검증한다.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchOnboardingOptions, saveOnboarding } from '@/api/onboarding'
import apiClient from '@/api/client'

vi.mock('@/api/client', () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
  },
}))

describe('onboarding API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetchOnboardingOptions: GET /api/v1/onboarding/options', async () => {
    const mockData = {
      data: {
        success: true,
        data: {
          currentSelection: { topicIds: [], techStackIds: [], roleIds: [] },
          topics: [],
          techStacks: [],
          roles: [],
        },
      },
    }
    vi.mocked(apiClient.get).mockResolvedValue(mockData)

    const result = await fetchOnboardingOptions()

    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/onboarding/options')
    expect(result.success).toBe(true)
  })

  it('saveOnboarding: PUT /api/v1/users/me/onboarding', async () => {
    vi.mocked(apiClient.put).mockResolvedValue({ data: { success: true } })

    const payload = {
      topicIds: [1, 2],
      techStacks: [
        {
          techStackId: 4,
          proficiencyLevel: 'INTERMEDIATE' as const,
          experienceMonths: 12,
          isLearning: false,
        },
      ],
      roles: [{ roleId: 2, priority: 1, experienceLevel: 'BEGINNER' as const }],
    }

    await saveOnboarding(payload)

    expect(apiClient.put).toHaveBeenCalledWith('/api/v1/users/me/onboarding', payload)
  })
})
