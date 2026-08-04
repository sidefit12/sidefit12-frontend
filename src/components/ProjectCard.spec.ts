/**
 * @fileoverview ProjectCard 컴포넌트 단위 테스트
 *
 * 프로젝트 카드의 각 요소(제목, 매치율, 조건, 토픽, 기술스택, 역할)가
 * 올바르게 렌더링되는지 검증한다.
 */
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ProjectCard from '@/components/ProjectCard.vue'

describe('ProjectCard', () => {
  const defaultProps = {
    title: '테스트 프로젝트',
    matchRate: 92,
    condition: '온라인 · 12주 · 8월 31일 마감',
    topic: '핀테크',
    techStacks: ['FastAPI', 'PostgreSQL'],
    roles: '백엔드 1/2 · 기획 1/1',
  }

  it('제목을 표시한다', () => {
    const wrapper = mount(ProjectCard, { props: defaultProps })
    expect(wrapper.text()).toContain('테스트 프로젝트')
  })

  it('매치율을 표시한다', () => {
    const wrapper = mount(ProjectCard, { props: defaultProps })
    expect(wrapper.text()).toContain('92%')
  })

  it('조건을 표시한다', () => {
    const wrapper = mount(ProjectCard, { props: defaultProps })
    expect(wrapper.text()).toContain('온라인 · 12주 · 8월 31일 마감')
  })

  it('토픽을 표시한다', () => {
    const wrapper = mount(ProjectCard, { props: defaultProps })
    expect(wrapper.text()).toContain('핀테크')
  })

  it('기술 스택을 표시한다', () => {
    const wrapper = mount(ProjectCard, { props: defaultProps })
    expect(wrapper.text()).toContain('FastAPI')
    expect(wrapper.text()).toContain('PostgreSQL')
  })

  it('모집 현황을 표시한다', () => {
    const wrapper = mount(ProjectCard, { props: defaultProps })
    expect(wrapper.text()).toContain('백엔드 1/2 · 기획 1/1')
  })
})
