/**
 * @fileoverview 프로젝트 API 단위 테스트
 *
 * fetchProjects — 목록 조회 (GET)
 * patchProject — 모집글 부분 수정 (PATCH)
 * patchRecruitmentStatus — 모집 상태 변경 (PATCH)
 * deleteProject — 모집글 삭제 (DELETE + deletionReason)
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

/**
 * patchProject — 모집글 부분 수정
 * PATCH /api/v1/projects/{projectId} 호출을 검증한다.
 */
describe('patchProject API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('PATCH /api/v1/projects/{id} 호출', async () => {
    const { patchProject } = await import('@/api/projects')
    const mockPatch = vi.fn().mockResolvedValue({ data: { success: true } })
    vi.mocked(apiClient).patch = mockPatch

    const payload = {
      title: '수정된 제목',
      description: '수정된 설명입니다. 20자 이상 작성합니다.',
      workType: 'ONLINE' as const,
    }

    const result = await patchProject(10, payload)

    expect(mockPatch).toHaveBeenCalledWith('/api/v1/projects/10', payload)
    expect(result.success).toBe(true)
  })
})

/**
 * patchRecruitmentStatus — 모집 상태 변경
 * PATCH /api/v1/projects/{projectId}/recruitment-status 호출을 검증한다.
 * 허용 전환: DRAFT→RECRUITING, RECRUITING→CLOSED, CLOSED→RECRUITING
 */
describe('patchRecruitmentStatus API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('PATCH /api/v1/projects/{id}/recruitment-status CLOSED 호출', async () => {
    const { patchRecruitmentStatus } = await import('@/api/projects')
    const mockPatch = vi.fn().mockResolvedValue({ data: { success: true } })
    vi.mocked(apiClient).patch = mockPatch

    const result = await patchRecruitmentStatus(10, 'CLOSED')

    expect(mockPatch).toHaveBeenCalledWith('/api/v1/projects/10/recruitment-status', {
      recruitmentStatus: 'CLOSED',
    })
    expect(result.success).toBe(true)
  })

  it('PATCH /api/v1/projects/{id}/recruitment-status RECRUITING 호출', async () => {
    const { patchRecruitmentStatus } = await import('@/api/projects')
    const mockPatch = vi.fn().mockResolvedValue({ data: { success: true } })
    vi.mocked(apiClient).patch = mockPatch

    const result = await patchRecruitmentStatus(5, 'RECRUITING')

    expect(mockPatch).toHaveBeenCalledWith('/api/v1/projects/5/recruitment-status', {
      recruitmentStatus: 'RECRUITING',
    })
    expect(result.success).toBe(true)
  })
})

/**
 * deleteProject — 모집글 삭제
 * DELETE /api/v1/projects/{projectId} + { deletionReason } 본문 전송을 검증한다.
 * deletionReason은 공백 제외 최소 10자, 최대 500자.
 */
describe('deleteProject API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('DELETE /api/v1/projects/{id} + deletionReason 호출', async () => {
    const { deleteProject } = await import('@/api/projects')
    const mockDelete = vi.fn().mockResolvedValue({ data: { success: true } })
    vi.mocked(apiClient).delete = mockDelete

    const result = await deleteProject(10, '프로젝트 운영 계획이 변경되어 삭제합니다.')

    expect(mockDelete).toHaveBeenCalledWith('/api/v1/projects/10', {
      data: { deletionReason: '프로젝트 운영 계획이 변경되어 삭제합니다.' },
    })
    expect(result.success).toBe(true)
  })
})
