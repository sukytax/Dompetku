import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/Login.vue'),
      meta: { guest: true }
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/Register.vue'),
      meta: { guest: true }
    },
    {
      path: '/',
      name: 'dashboard',
      component: () => import('@/views/Dashboard.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/wallets',
      name: 'wallets',
      component: () => import('@/views/Wallets.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/transactions',
      name: 'transactions',
      component: () => import('@/views/Transactions.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/goals',
      name: 'goals',
      component: () => import('@/views/Goals.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/goals/:id',
      name: 'goal-detail',
      component: () => import('@/views/GoalDetail.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/budgets',
      name: 'budgets',
      component: () => import('@/views/Budgets.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/Settings.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/cara-penggunaan',
      name: 'cara-penggunaan',
      component: () => import('@/views/HowToUse.vue'),
      meta: { requiresAuth: true }
    }
  ]
})

// Navigation guard untuk protected routes
router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore()
  
  // Tunggu auth selesai loading (hanya di first load)
  if (authStore.loading) {
    // Tunggu maksimal 2 detik untuk auth check
    await new Promise(resolve => {
      const checkAuth = setInterval(() => {
        if (!authStore.loading) {
          clearInterval(checkAuth)
          resolve(true)
        }
      }, 100)
      
      // Timeout setelah 2 detik
      setTimeout(() => {
        clearInterval(checkAuth)
        resolve(false)
      }, 2000)
    })
  }
  
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const isGuest = to.matched.some(record => record.meta.guest)
  const isAuthenticated = !!authStore.user
  
  if (requiresAuth && !isAuthenticated) {
    // Route membutuhkan auth tapi user belum login
    next('/login')
  } else if (isGuest && isAuthenticated) {
    // User sudah login tapi akses halaman guest (login/register)
    next('/')
  } else {
    next()
  }
})

export default router
