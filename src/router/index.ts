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
    meta: { requiresAuth: true },
  },
  {
    path: '/landing',
    name: 'Landing',
    component: () => import('@/views/LandingView.vue'),
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
  {
    path: '/projects/:id/applicants',
    name: 'ApplicantManage',
    component: () => import('@/views/ApplicantManageView.vue'),
  },
  {
    path: '/projects/:id/applicants/:applicationId',
    name: 'ApplicantDetail',
    component: () => import('@/views/ApplicantDetailView.vue'),
  },
  {
    path: '/projects/:id/edit',
    name: 'ProjectEdit',
    component: () => import('@/views/ProjectEditView.vue'),
  },
  {
    path: '/write',
    name: 'ProjectWrite',
    component: () => import('@/views/ProjectWriteView.vue'),
  },
  {
    path: '/mypage',
    name: 'MyPage',
    component: () => import('@/views/MyPageView.vue'),
  },
  {
    path: '/mypage/applications',
    name: 'MyApplications',
    component: () => import('@/views/MyApplicationsView.vue'),
  },
  {
    path: '/mypage/projects',
    name: 'MyProjects',
    component: () => import('@/views/MyProjectsView.vue'),
  },
  {
    path: '/mypage/bookmarks',
    name: 'MyBookmarks',
    component: () => import('@/views/MyBookmarksView.vue'),
  },
  {
    path: '/profile/edit',
    name: 'ProfileEdit',
    component: () => import('@/views/ProfileEditView.vue'),
  },
  {
    path: '/projects/:id/members',
    name: 'MemberManage',
    component: () => import('@/views/MemberManageView.vue'),
  },
  {
    path: '/recommendations',
    name: 'Recommendations',
    component: () => import('@/views/RecommendationsView.vue'),
  },
  {
    path: '/password-reset',
    name: 'PasswordResetRequest',
    component: () => import('@/views/PasswordResetRequestView.vue'),
  },
  {
    path: '/password-reset/confirm',
    name: 'PasswordResetConfirm',
    component: () => import('@/views/PasswordResetConfirmView.vue'),
  },
  {
    path: '/notifications',
    name: 'Notifications',
    component: () => import('@/views/NotificationsView.vue'),
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/views/SettingsView.vue'),
  },
  {
    path: '/users/:id',
    name: 'PublicProfile',
    component: () => import('@/views/PublicProfileView.vue'),
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFoundView.vue'),
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

/** 비로그인 유저가 인증 필요 페이지 접근 시 랜딩으로 리다이렉트 */
router.beforeEach((to) => {
  if (to.meta.requiresAuth) {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      return { name: 'Landing' }
    }
  }
})

export default router
