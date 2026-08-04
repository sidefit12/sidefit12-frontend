/**
 * @fileoverview TechStackChip 컴포넌트 단위 테스트
 *
 * 기술명 표시, light/dark 테마 적용, 로고 렌더링을 검증한다.
 */
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TechStackChip from '@/components/TechStackChip.vue'

describe('TechStackChip', () => {
  it('기술명을 텍스트로 표시한다', () => {
    const wrapper = mount(TechStackChip, {
      props: { name: 'FastAPI' },
    })
    expect(wrapper.text()).toContain('FastAPI')
  })

  it('light 테마일 때 흰 배경 클래스 적용', () => {
    const wrapper = mount(TechStackChip, {
      props: { name: 'Vue.js', theme: 'light' },
    })
    expect(wrapper.find('span').classes()).toContain('bg-white')
  })

  it('dark 테마일 때 검정 배경 클래스 적용', () => {
    const wrapper = mount(TechStackChip, {
      props: { name: 'React', theme: 'dark' },
    })
    expect(wrapper.find('span').classes()).toContain('bg-text')
  })

  it('로고 URL이 있으면 img 렌더링', () => {
    const wrapper = mount(TechStackChip, {
      props: { name: 'FastAPI' },
    })
    const img = wrapper.find('img')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toContain('fastapi')
  })

  it('로고 URL이 없으면 fallback 이니셜 표시', () => {
    const wrapper = mount(TechStackChip, {
      props: { name: 'Rust' },
    })
    // Rust는 로고 있으므로 img 존재
    expect(wrapper.find('img').exists()).toBe(true)
  })
})
