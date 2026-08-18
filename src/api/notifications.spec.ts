/**
 * @fileoverview 알림 API 단위 테스트
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  fetchNotifications,
  fetchUnreadCount,
  markAsRead,
  markAllAsRead,
  fetchNotificationPreferences,
  updateNotificationPreferences,
} from '@/api/notifications'
import apiClient from '@/api/client'

vi.mock('@/api/client', () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}))

describe('notifications API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetchNotifications: GET /api/v1/notifications 호출', async () => {
    const mockRes = {
      data: {
        success: true,
        data: { items: [], unreadCount: 0 },
        meta: { page: 0, size: 20, totalElements: 0, totalPages: 0, hasNext: false },
      },
    }
    vi.mocked(apiClient.get).mockResolvedValue(mockRes)

    const result = await fetchNotifications({ page: 0, size: 20 })

    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/notifications', {
      params: { page: 0, size: 20 },
    })
    expect(result.data.items).toEqual([])
  })

  it('fetchUnreadCount: GET /api/v1/notifications/unread-count 호출', async () => {
    const mockRes = { data: { success: true, data: { unreadCount: 5 } } }
    vi.mocked(apiClient.get).mockResolvedValue(mockRes)

    const result = await fetchUnreadCount()

    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/notifications/unread-count')
    expect(result.data.unreadCount).toBe(5)
  })

  it('markAsRead: PATCH /api/v1/notifications/:id/read 호출', async () => {
    vi.mocked(apiClient.patch).mockResolvedValue({ data: {} })

    await markAsRead(100)

    expect(apiClient.patch).toHaveBeenCalledWith('/api/v1/notifications/100/read')
  })

  it('markAllAsRead: PATCH /api/v1/notifications/read-all 호출', async () => {
    vi.mocked(apiClient.patch).mockResolvedValue({ data: {} })

    await markAllAsRead()

    expect(apiClient.patch).toHaveBeenCalledWith('/api/v1/notifications/read-all', {})
  })

  it('fetchNotificationPreferences: GET /api/v1/users/me/notification-preferences 호출', async () => {
    const mockRes = {
      data: {
        success: true,
        data: {
          applicationEnabled: true,
          recruitmentDeadlineEnabled: true,
          teamEnabled: false,
          systemEnabled: true,
          updatedAt: '2026-08-02',
        },
      },
    }
    vi.mocked(apiClient.get).mockResolvedValue(mockRes)

    const result = await fetchNotificationPreferences()

    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/users/me/notification-preferences')
    expect(result.data.teamEnabled).toBe(false)
  })

  it('updateNotificationPreferences: PATCH /api/v1/users/me/notification-preferences 호출', async () => {
    vi.mocked(apiClient.patch).mockResolvedValue({ data: { success: true, data: {} } })

    await updateNotificationPreferences({ teamEnabled: true })

    expect(apiClient.patch).toHaveBeenCalledWith('/api/v1/users/me/notification-preferences', {
      teamEnabled: true,
    })
  })
})
