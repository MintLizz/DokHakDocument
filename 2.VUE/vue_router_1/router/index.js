// 이런 라우트 정보를 담고 있는 객체를 생성한다.
// createRouter, createWebHistory 이거 두개 함수임
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import AboutView from '@/views/AboutView.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomeView,
  },
  {
    path: '/about',
    name: 'About',
    component: AboutView,
  },
]

const router = createRouter({
  // 함수에서의 반환값이라고 한다.
  history: createWebHistory('/'),
  routes: routes,
})

// 외부에서 사용 가능하게 export 선언함
export default router
