/**
 * @fileoverview 알림 API
 *
 * GET /api/v1/notifications — 알림 목록 조회
 * GET /api/v1/notifications/unread-count — 미읽음 알림 수 조회
 * PATCH /api/v1/notifications/:id/read — 알림 읽음 처리
 * PATCH /api/v1/notifications/read-all — 알림 전체 읽음 처리
 */

import apiClient from '@/api/client'

/* ────── 타입 ────── */

export interface NotificationItem {
  notificationId: number
  notificationType: string
  title: string
  content: string
  referenceType: string | null
  referenceId: number | null
  isRead: boolean
  readAt: string | null
  createdAt: string
}

export interface NotificationPageData {
  items: NotificationItem[]
  unreadCount: number
}

export interface PageMeta {
  page: number
  size: number
  totalElements: number
  totalPages: number
  hasNext: boolean
}

export interface NotificationPageResponse {
  success: boolean
  data: NotificationPageData
  meta: PageMeta
}

export interface UnreadCountResponse {
  success: boolean
  data: { unreadCount: number }
}

/* ────── 알림 목록 조회 ────── */

export interface FetchNotificationsParams {
  page?: number
  size?: number
  isRead?: boolean
  notificationType?: string
}

export async function fetchNotifications(
  params?: FetchNotificationsParams,
): Promise<NotificationPageResponse> {
  const { data } = await apiClient.get<NotificationPageResponse>('/api/v1/notifications', {
    params,
  })
  return data
}

/* ────── 미읽음 알림 수 조회 ────── */

export async function fetchUnreadCount(): Promise<UnreadCountResponse> {
  const { data } = await apiClient.get<UnreadCountResponse>('/api/v1/notifications/unread-count')
  return data
}

/* ────── 알림 읽음 처리 ────── */

export async function markAsRead(notificationId: number) {
  const { data } = await apiClient.patch(`/api/v1/notifications/${notificationId}/read`)
  return data
}

/* ────── 알림 전체 읽음 처리 ────── */

export async function markAllAsRead() {
  const { data } = await apiClient.patch('/api/v1/notifications/read-all', {})
  return data
}

/* ────── 푸시 기기 등록 ────── */

export async function registerPushDevice(registrationToken: string) {
  const { data } = await apiClient.post('/api/v1/users/me/push-devices', {
    registrationToken,
    platform: 'WEB',
    deviceName: navigator.userAgent.slice(0, 100),
  })
  return data
}

/* ────── 푸시 기기 삭제 ────── */

export async function deletePushDevice(registrationToken: string) {
  const { data } = await apiClient.delete('/api/v1/users/me/push-devices', {
    data: { registrationToken },
  })
  return data
}
