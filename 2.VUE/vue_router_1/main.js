import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import 'bootstrap/dist/js/bootstrap.js'

import { createApp } from 'vue'
import App from './App.vue'

import router from '@/router'

// use(router) 이걸 사용함으로써
// 모든 자식 컴포넌트에서는 router, route 같은 객체 사용이 가능하다.
// router는 페이지 이동 가능한 것
// route : 현재 페이지 컴포넌트의 정보

createApp(App).use(router).mount('#app')
