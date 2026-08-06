/**
 * @fileoverview 북마크 API 단위 테스트
 *
 * 프로젝트 북마크 등록/해제 함수를 검증한다.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { addBookmark, removeBookmark } from '@/api/bookmark'
import apiClient from '@/api/client'

vi.mock('@/api/client', () => ({
  default: {
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('bookmark API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // 북마크 등록
  it('addBookmark: PUT /api/v1/projects/{id}/bookmark 호출', async () => {
    vi.mocked(apiClient.put).mockResolvedValue({
      data: { success: true, data: { projectId: 100, bookmarked: true } },
    })

    const result = await addBookmark(100)

    expect(apiClient.put).toHaveBeenCalledWith('/api/v1/projects/100/bookmark')
    expect(result.data.bookmarked).toBe(true)
  })

  // 북마크 해제
  it('removeBookmark: DELETE /api/v1/projects/{id}/bookmark 호출', async () => {
    vi.mocked(apiClient.delete).mockResolvedValue({
      data: { success: true, data: { projectId: 100, bookmarked: false } },
    })

    const result = await removeBookmark(100)

    expect(apiClient.delete).toHaveBeenCalledWith('/api/v1/projects/100/bookmark')
    expect(result.data.bookmarked).toBe(false)
  })
})
