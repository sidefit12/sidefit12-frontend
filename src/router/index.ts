/**
 * @fileoverview Vue Router 설정
 *
 * 애플리케이션의 라우트 테이블을 정의하고
 * HTML5 History 모드의 라우터 인스턴스를 생성한다.
 */

import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

/**
 * 라우트 정의 배열
 *
 * 각 라우트는 lazy-loading 방식으로 컴포넌트를 불러온다.
 */
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/HomeView.vue'),
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/LoginView.vue'),
  },
  {
    path: '/signup',
    name: 'Signup',
    component: () => import('@/views/SignupView.vue'),
  },
  {
    path: '/onboarding',
    name: 'Onboarding',
    component: () => import('@/views/OnboardingView.vue'),
  },
  {
    path: '/projects',
    name: 'Projects',
    component: () => import('@/views/ProjectsView.vue'),
  },
  {
    path: '/projects/:id',
    name: 'ProjectDetail',
    component: () => import('@/views/ProjectDetailView.vue'),
  },
  {
    path: '/projects/:id/apply',
    name: 'ProjectApply',
    component: () => import('@/views/ProjectApplyView.vue'),
  },
]

/**
 * Vue Router 인스턴스
 *
 * HTML5 History API를 사용하며, `import.meta.env.BASE_URL`을 base path로 설정한다.
 */
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
