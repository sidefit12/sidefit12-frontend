/**
 * @fileoverview DefaultAvatar 컴포넌트 단위 테스트
 *
 * 이미지 유무에 따른 렌더링 분기와 사이즈별 클래스 적용을 검증한다.
 */
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import DefaultAvatar from '@/components/DefaultAvatar.vue'

describe('DefaultAvatar', () => {
  it('이미지 없으면 기본 아바타 렌더링', () => {
    const wrapper = mount(DefaultAvatar, {
      props: { size: 40 },
    })
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.find('div').exists()).toBe(true)
  })

  it('이미지 있으면 img 태그 렌더링', () => {
    const wrapper = mount(DefaultAvatar, {
      props: { size: 40, imageUrl: 'https://example.com/avatar.png' },
    })
    const img = wrapper.find('img')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toBe('https://example.com/avatar.png')
  })

  it('size 40이면 size-10 클래스', () => {
    const wrapper = mount(DefaultAvatar, {
      props: { size: 40 },
    })
    expect(wrapper.find('div').classes()).toContain('size-10')
  })

  it('size 94이면 size-[94px] 클래스', () => {
    const wrapper = mount(DefaultAvatar, {
      props: { size: 94 },
    })
    expect(wrapper.find('div').classes()).toContain('size-[94px]')
  })
})
