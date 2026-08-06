/**
 * @fileoverview 프로젝트 북마크 API
 *
 * PUT /api/v1/projects/{projectId}/bookmark — 북마크 등록
 * DELETE /api/v1/projects/{projectId}/bookmark — 북마크 해제
 */

import apiClient from '@/api/client'

export interface BookmarkStateResponse {
  success: boolean
  data: {
    projectId: number
    bookmarked: boolean
  }
}

/** 북마크 등록 */
export async function addBookmark(projectId: number): Promise<BookmarkStateResponse> {
  const { data } = await apiClient.put<BookmarkStateResponse>(
    `/api/v1/projects/${projectId}/bookmark`,
  )
  return data
}

/** 북마크 해제 */
export async function removeBookmark(projectId: number): Promise<BookmarkStateResponse> {
  const { data } = await apiClient.delete<BookmarkStateResponse>(
    `/api/v1/projects/${projectId}/bookmark`,
  )
  return data
}
