<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const navItems = [
  { name: 'Dashboard', icon: '🏠', route: '/' },
  { name: 'Dompet', icon: '👛', route: '/wallets' },
  { name: 'Transaksi', icon: '📝', route: '/transactions' },
  { name: 'Anggaran', icon: '💰', route: '/budgets' },
  { name: 'Goals', icon: '🎯', route: '/goals' },
  { name: 'Cara Penggunaan', icon: '❓', route: '/cara-penggunaan' },
  { name: 'Pengaturan', icon: '⚙️', route: '/settings' }
]

function isActive(route: string) {
  if (route === '/') {
    return router.currentRoute.value.path === '/'
  }
  return router.currentRoute.value.path.startsWith(route)
}

async function handleLogout() {
  if (confirm('Yakin ingin keluar?')) {
    await authStore.logout()
    router.push('/login')
  }
}
</script>

<template>
  <aside class="hidden md:flex md:flex-col w-64 bg-white dark:bg-gray-800 border-r dark:border-gray-700 h-screen sticky top-0">
    <div class="p-6 border-b dark:border-gray-700">
      <h1 class="text-2xl font-bold text-blue-500">💰 Dompetku</h1>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Kelola Keuangan Anda</p>
    </div>
    
    <nav class="flex-1 p-4 space-y-1 overflow-y-auto">
      <router-link
        v-for="item in navItems"
        :key="item.route"
        :to="item.route"
        :class="[
          'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium',
          isActive(item.route)
            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
        ]"
      >
        <span class="text-xl">{{ item.icon }}</span>
        <span>{{ item.name }}</span>
      </router-link>
    </nav>

    <!-- User Info & Logout -->
    <div class="p-4 border-t dark:border-gray-700">
      <div class="flex items-center gap-3 mb-3">
        <div class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
          {{ authStore.user?.displayName?.charAt(0).toUpperCase() || 'U' }}
        </div>
        <div class="flex-1 min-w-0">
          <p class="font-medium text-gray-900 dark:text-white truncate">
            {{ authStore.user?.displayName || 'User' }}
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400 truncate">
            {{ authStore.user?.email }}
          </p>
        </div>
      </div>
      <button
        @click="handleLogout"
        class="w-full px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors font-medium text-sm"
      >
        🚪 Keluar
      </button>
    </div>
  </aside>
</template>
