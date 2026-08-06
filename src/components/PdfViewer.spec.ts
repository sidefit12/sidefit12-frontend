/**
 * @fileoverview PdfViewer 컴포넌트 단위 테스트
 *
 * 컴포넌트 마운트 및 우클릭 방지를 검증한다.
 */
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import PdfViewer from '@/components/PdfViewer.vue'

// pdfjs-dist 모킹
vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: { workerSrc: '' },
  getDocument: vi.fn(() => ({
    promise: Promise.resolve({ numPages: 0 }),
  })),
  version: '4.9.155',
}))

describe('PdfViewer', () => {
  it('컴포넌트가 마운트된다', () => {
    const wrapper = mount(PdfViewer, { props: { url: 'https://example.com/test.pdf' } })
    expect(wrapper.exists()).toBe(true)
  })

  it('우클릭이 차단된다 (contextmenu 이벤트)', async () => {
    const wrapper = mount(PdfViewer, { props: { url: 'https://example.com/test.pdf' } })
    const event = new Event('contextmenu', { cancelable: true })
    const prevented = !wrapper.element.dispatchEvent(event)
    expect(prevented).toBe(true)
  })
})
