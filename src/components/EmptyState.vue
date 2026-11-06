<script setup lang="ts">
defineProps<{
  icon: string
  title: string
  description: string
  actionText?: string
}>()

const emit = defineEmits<{
  action: []
}>()
</script>

<template>
  <div class="flex flex-col items-center justify-center py-12 px-4 text-center">
    <div class="text-6xl mb-4">{{ icon }}</div>
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
      {{ title }}
    </h3>
    <p class="text-gray-600 dark:text-gray-400 mb-6 max-w-sm">
      {{ description }}
    </p>
    <button
      v-if="actionText"
      @click="emit('action')"
      class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
    >
      {{ actionText }}
    </button>
  </div>
</template>
