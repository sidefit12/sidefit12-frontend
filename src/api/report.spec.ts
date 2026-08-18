/**
 * @fileoverview 신고 API 단위 테스트
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { reportProject, reportUser } from '@/api/report'
import apiClient from '@/api/client'

vi.mock('@/api/client', () => ({
  default: {
    post: vi.fn(),
  },
}))

describe('report API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('reportProject: POST /api/v1/projects/:id/reports 호출', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: { success: true } })

    await reportProject(100, { reasonType: 'SPAM', detail: '광고입니다.' })

    expect(apiClient.post).toHaveBeenCalledWith('/api/v1/projects/100/reports', {
      reasonType: 'SPAM',
      detail: '광고입니다.',
    })
  })

  it('reportUser: POST /api/v1/users/:id/reports 호출', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: { success: true } })

    await reportUser(5, { reasonType: 'HARASSMENT' })

    expect(apiClient.post).toHaveBeenCalledWith('/api/v1/users/5/reports', {
      reasonType: 'HARASSMENT',
    })
  })
})
