/**
 * @fileoverview LoginView 단위 테스트
 *
 * 로그인 폼 렌더링, 유효성 검사, 성공/실패 시나리오를 검증한다.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import LoginView from '@/views/LoginView.vue'

// Mock auth store
vi.mock('@/stores/useAuthStore', () => ({
  useAuthStore: vi.fn(() => ({
    login: vi.fn(),
    isLoggedIn: false,
  })),
}))

import { useAuthStore } from '@/stores/useAuthStore'

describe('LoginView', () => {
  let router: ReturnType<typeof createRouter>

  beforeEach(() => {
    setActivePinia(createPinia())
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: { template: '<div>Home</div>' } },
        { path: '/login', component: LoginView },
        { path: '/signup', component: { template: '<div>Signup</div>' } },
        { path: '/password-reset', component: { template: '<div>Reset</div>' } },
      ],
    })
    vi.clearAllMocks()
  })

  function mountLogin() {
    return mount(LoginView, {
      global: {
        plugins: [router],
      },
    })
  }

  it('이메일과 비밀번호 입력 필드 존재', () => {
    const wrapper = mountLogin()
    expect(wrapper.find('input[type="email"]').exists()).toBe(true)
    expect(wrapper.find('input[type="password"]').exists()).toBe(true)
  })

  it('로그인 버튼 존재', () => {
    const wrapper = mountLogin()
    expect(wrapper.find('button[type="submit"]').text()).toContain('로그인')
  })

  it('빈 폼 제출 시 에러 메시지', async () => {
    const wrapper = mountLogin()
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('이메일과 비밀번호를 입력해 주세요')
  })

  it('로그인 성공 시 홈으로 이동', async () => {
    const mockLogin = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useAuthStore).mockReturnValue({
      login: mockLogin,
      isLoggedIn: false,
    } as unknown as ReturnType<typeof useAuthStore>)

    const wrapper = mountLogin()

    await wrapper.find('input[type="email"]').setValue('test@test.com')
    await wrapper.find('input[type="password"]').setValue('password123')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(mockLogin).toHaveBeenCalledWith({
      email: 'test@test.com',
      password: 'password123',
      deviceInfo: expect.any(String),
    })
  })

  it('401 에러 시 에러 메시지 표시', async () => {
    const mockLogin = vi.fn().mockRejectedValue({ response: { status: 401 } })
    vi.mocked(useAuthStore).mockReturnValue({
      login: mockLogin,
      isLoggedIn: false,
    } as unknown as ReturnType<typeof useAuthStore>)

    const wrapper = mountLogin()

    await wrapper.find('input[type="email"]').setValue('test@test.com')
    await wrapper.find('input[type="password"]').setValue('wrong')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('이메일 또는 비밀번호를 확인해 주세요')
  })

  it('회원가입 링크 존재', () => {
    const wrapper = mountLogin()
    expect(wrapper.text()).toContain('회원가입')
  })
})
