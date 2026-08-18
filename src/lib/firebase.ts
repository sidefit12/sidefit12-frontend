/**
 * @fileoverview Firebase 초기화 및 FCM 메시징 설정
 */

import { initializeApp } from 'firebase/app'
import { getMessaging, getToken, onMessage, type Messaging } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: 'AIzaSyBAWABzShMHpcsRlsOMjCbKcDxGeEnwG3g',
  authDomain: 'sidefit-a60bc.firebaseapp.com',
  projectId: 'sidefit-a60bc',
  storageBucket: 'sidefit-a60bc.firebasestorage.app',
  messagingSenderId: '362839269947',
  appId: '1:362839269947:web:845037b565288e3c60b21e',
  measurementId: 'G-1DH1DK6J80',
}

const VAPID_KEY =
  'BGOe5KkJNksECoeUbz0CNMuc9aWmCYXAR-p4GjRzbjczstmSZcalcxy_aL6zp0FlJXuNCrXbRPy99xPe0_CYSDw'

const app = initializeApp(firebaseConfig)

let messaging: Messaging | null = null

/** 브라우저가 알림을 지원하는 경우에만 messaging 초기화 */
if (typeof window !== 'undefined' && 'Notification' in window) {
  messaging = getMessaging(app)
}

/**
 * FCM 등록 토큰을 발급받는다.
 * 사용자가 알림 권한을 허용해야 토큰이 발급된다.
 */
export async function requestFcmToken(): Promise<string | null> {
  if (!messaging) return null

  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return null

    const token = await getToken(messaging, { vapidKey: VAPID_KEY })
    return token
  } catch {
    return null
  }
}

/**
 * 포그라운드에서 메시지 수신 시 콜백 등록
 */
export function onForegroundMessage(callback: (payload: unknown) => void) {
  if (!messaging) return
  onMessage(messaging, (payload) => {
    callback(payload)
  })
}

export { messaging }
