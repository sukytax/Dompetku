<script setup lang="ts">
defineProps<{
  onClick: () => void
}>()
</script>

<template>
  <button
    @click="onClick"
    class="fixed bottom-20 right-4 md:bottom-6 md:right-6 w-14 h-14 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 z-40"
    aria-label="Tambah Transaksi"
  >
    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
    </svg>
  </button>
</template>
