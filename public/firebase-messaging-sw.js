/* eslint-disable no-undef */
/**
 * Firebase Cloud Messaging Service Worker
 * 백그라운드 푸시 알림 수신을 위한 서비스 워커
 */

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: 'AIzaSyBAWABzShMHpcsRlsOMjCbKcDxGeEnwG3g',
  authDomain: 'sidefit-a60bc.firebaseapp.com',
  projectId: 'sidefit-a60bc',
  storageBucket: 'sidefit-a60bc.firebasestorage.app',
  messagingSenderId: '362839269947',
  appId: '1:362839269947:web:845037b565288e3c60b21e',
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || '새 알림'
  const options = {
    body: payload.notification?.body || '',
    icon: '/logo-symbol.png',
    badge: '/logo-symbol.png',
  }
  self.registration.showNotification(title, options)
})
