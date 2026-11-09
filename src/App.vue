<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import Sidebar from '@/components/Sidebar.vue'
import BottomNav from '@/components/BottomNav.vue'
import Toast from '@/components/Toast.vue'

const toastRef = ref<InstanceType<typeof Toast>>()
const route = useRoute()

// Halaman login dan register tidak menggunakan layout aplikasi utama.
const isAuthPage = computed(() => route.meta.guest === true)

// Untuk diakses dari child components via provide/inject
function showToast(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') {
  toastRef.value?.addToast(message, type)
}

// Provide toast untuk child components
import { provide } from 'vue'
provide('toast', showToast)

</script>

<template>
  <div class="flex min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Sidebar Desktop -->
    <Sidebar v-if="!isAuthPage" />
    
    <!-- Main Content -->
    <main :class="['flex-1', !isAuthPage ? 'pb-16 md:pb-0' : '']">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>

      <footer v-if="!isAuthPage" class="border-t border-gray-200 dark:border-gray-700 px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
        Made By Bimo Bagas
      </footer>
    </main>
    
    <!-- Bottom Navigation Mobile -->
    <BottomNav v-if="!isAuthPage" />
    
    <!-- Toast Notifications -->
    <Toast ref="toastRef" />
    
    <!-- Add Transaction Modal (akan dibuat nanti) -->
    <!-- <TransactionModal v-model:show="showAddTransaction" /> -->
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
