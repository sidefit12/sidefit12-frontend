/**
 * @fileoverview 애플리케이션 엔트리 포인트
 *
 * Vue 앱 인스턴스를 생성하고 플러그인(Pinia, Vue Router, TanStack Vue Query)을
 * 등록한 뒤 DOM에 마운트한다.
 */

import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import pinia from './stores'
import { setupQueryClient } from './plugins/queryClient'

const app = createApp(App)

app.use(pinia)
app.use(router)
setupQueryClient(app)

app.mount('#app')
