<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const navItems = [
  { name: 'Dashboard', icon: '🏠', route: '/' },
  { name: 'Dompet', icon: '👛', route: '/wallets' },
  { name: 'Transaksi', icon: '📝', route: '/transactions' },
  { name: 'Anggaran', icon: '💰', route: '/budgets' },
  { name: 'Goals', icon: '🎯', route: '/goals' },
  { name: 'Pengaturan', icon: '⚙️', route: '/settings' }
]

function isActive(route: string) {
  if (route === '/') {
    return router.currentRoute.value.path === '/'
  }
  return router.currentRoute.value.path.startsWith(route)
}
</script>

<template>
  <nav class="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 md:hidden z-30 shadow-lg">
    <div class="grid grid-cols-6 h-16 items-center px-1">
      <router-link
        v-for="item in navItems"
        :key="item.route"
        :to="item.route"
        :class="[
          'flex flex-col items-center justify-center gap-0.5 py-1 px-0.5 rounded-lg transition-colors',
          isActive(item.route)
            ? 'text-blue-600 dark:text-blue-400 font-semibold'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
        ]"
      >
        <span class="text-lg leading-none">{{ item.icon }}</span>
        <span class="text-[10px] leading-tight truncate max-w-full text-center">{{ item.name }}</span>
      </router-link>
    </div>
  </nav>
</template>
