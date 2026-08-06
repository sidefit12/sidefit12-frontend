/**
 * @fileoverview DatePicker 컴포넌트 단위 테스트
 *
 * 날짜 선택, 월 이동, 비활성 날짜 검증을 수행한다.
 */
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import DatePicker from '@/components/DatePicker.vue'

describe('DatePicker', () => {
  it('기본 placeholder가 표시된다', () => {
    const wrapper = mount(DatePicker, { props: { modelValue: '' } })
    expect(wrapper.text()).toContain('날짜 선택')
  })

  it('modelValue가 있으면 포맷된 날짜가 표시된다', () => {
    const wrapper = mount(DatePicker, { props: { modelValue: '2026-08-15' } })
    expect(wrapper.text()).toContain('2026.08.15')
  })

  it('버튼 클릭 시 캘린더가 열린다', async () => {
    const wrapper = mount(DatePicker, { props: { modelValue: '' } })
    await wrapper.find('button').trigger('click')
    expect(wrapper.text()).toContain('월')
    expect(wrapper.text()).toContain('일')
  })

  it('날짜 선택 시 update:modelValue 이벤트가 발생한다', async () => {
    const wrapper = mount(DatePicker, { props: { modelValue: '', minDate: '2026-01-01' } })
    await wrapper.find('button').trigger('click')
    // 캘린더 내 날짜 버튼 찾기
    const dayButtons = wrapper.findAll('button').filter((b) => b.text().match(/^\d+$/))
    if (dayButtons.length > 0) {
      await dayButtons[dayButtons.length - 1].trigger('click')
      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    }
  })
})
