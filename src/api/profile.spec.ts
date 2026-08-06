/**
 * @fileoverview 프로필 API 단위 테스트
 *
 * 프로필 조회, 수정, 토픽/기술스택/역할 설정, 닉네임 중복확인 함수를 검증한다.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  fetchMyProfile,
  updateProfile,
  replaceTopics,
  replaceTechStacks,
  replaceRoles,
  checkNicknameAvailability,
} from '@/api/profile'
import apiClient from '@/api/client'

vi.mock('@/api/client', () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
  },
}))

describe('profile API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // 내 프로필 조회
  it('fetchMyProfile: GET /api/v1/users/me/profile 호출', async () => {
    const mockRes = {
      data: {
        success: true,
        data: {
          user: { userId: 1, nickname: 'test' },
          topics: [],
          techStacks: [],
          roles: [],
        },
      },
    }
    vi.mocked(apiClient.get).mockResolvedValue(mockRes)

    const result = await fetchMyProfile()

    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/users/me/profile')
    expect(result.data.user.nickname).toBe('test')
  })

  // 프로필 수정
  it('updateProfile: PATCH /api/v1/users/me/profile 호출', async () => {
    vi.mocked(apiClient.patch).mockResolvedValue({ data: { success: true, data: {} } })

    await updateProfile({ nickname: 'newname', introduction: '안녕' })

    expect(apiClient.patch).toHaveBeenCalledWith('/api/v1/users/me/profile', {
      nickname: 'newname',
      introduction: '안녕',
    })
  })

  // 토픽 설정
  it('replaceTopics: PUT /api/v1/users/me/topics 호출', async () => {
    vi.mocked(apiClient.put).mockResolvedValue({ data: { success: true } })

    await replaceTopics([1, 3, 5])

    expect(apiClient.put).toHaveBeenCalledWith('/api/v1/users/me/topics', { topicIds: [1, 3, 5] })
  })

  // 기술스택 설정
  it('replaceTechStacks: PUT /api/v1/users/me/tech-stacks 호출', async () => {
    vi.mocked(apiClient.put).mockResolvedValue({ data: { success: true } })

    const stacks = [{ techStackId: 4, proficiencyLevel: 'INTERMEDIATE' as const }]
    await replaceTechStacks(stacks)

    expect(apiClient.put).toHaveBeenCalledWith('/api/v1/users/me/tech-stacks', {
      techStacks: stacks,
    })
  })

  // 역할 설정
  it('replaceRoles: PUT /api/v1/users/me/roles 호출', async () => {
    vi.mocked(apiClient.put).mockResolvedValue({ data: { success: true } })

    const roles = [{ roleId: 2, priority: 1 }]
    await replaceRoles(roles)

    expect(apiClient.put).toHaveBeenCalledWith('/api/v1/users/me/roles', { roles })
  })

  // 닉네임 중복확인
  it('checkNicknameAvailability: GET /api/v1/auth/nickname-availability 호출', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { success: true, data: { available: true, message: '사용 가능' } },
    })

    const result = await checkNicknameAvailability('testuser')

    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/auth/nickname-availability', {
      params: { nickname: 'testuser' },
    })
    expect(result.data.available).toBe(true)
  })
})
