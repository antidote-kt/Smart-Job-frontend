import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/dashboard'
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/auth/LoginView.vue')
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/auth/RegisterView.vue')
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('../views/DashboardView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/interview/create',
      name: 'interview-create',
      component: () => import('../views/interview/InterviewCreateView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/interview/:id',
      name: 'interview-room',
      component: () => import('../views/interview/InterviewRoomView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/interview/:id/report',
      name: 'interview-report',
      component: () => import('../views/interview/InterviewReportView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/history',
      name: 'history',
      component: () => import('../views/HistoryView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('../views/ProfileView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/positions',
      name: 'positions',
      component: () => import('../views/PositionsView.vue'),
      meta: { requiresAuth: true }
    }
  ],
})

// Navigation guard for authentication
router.beforeEach((to, from, next) => {
  const isAuthenticated = localStorage.getItem('token') // Simple check, can be improved
  
  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login')
  } else if ((to.name === 'login' || to.name === 'register') && isAuthenticated) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router
