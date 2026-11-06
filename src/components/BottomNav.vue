<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const navItems = [
  { name: 'Dashboard', icon: '🏠', route: '/' },
  { name: 'Dompet', icon: '👛', route: '/wallets' },
  { name: 'Transaksi', icon: '📝', route: '/transactions' },
  { name: 'Goals', icon: '🎯', route: '/goals' },
  { name: 'Bantuan', icon: '❓', route: '/cara-penggunaan' }
]

function isActive(route: string) {
  if (route === '/') {
    return router.currentRoute.value.path === '/'
  }
  return router.currentRoute.value.path.startsWith(route)
}
</script>

<template>
  <nav class="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t dark:border-gray-700 md:hidden z-30">
    <div class="grid grid-cols-5 h-16">
      <router-link
        v-for="item in navItems"
        :key="item.route"
        :to="item.route"
        :class="[
          'flex flex-col items-center justify-center gap-1 transition-colors',
          isActive(item.route)
            ? 'text-blue-500'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
        ]"
      >
        <span class="text-xl">{{ item.icon }}</span>
        <span class="text-xs font-medium">{{ item.name }}</span>
      </router-link>
    </div>
  </nav>
</template>
