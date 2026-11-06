<script setup lang="ts">
defineProps<{
  percentage: number
  color?: string
  showLabel?: boolean
  status?: 'safe' | 'warning' | 'danger'
}>()
</script>

<template>
  <div class="space-y-1">
    <div class="flex items-center justify-between text-sm" v-if="showLabel">
      <span class="text-gray-600 dark:text-gray-400">Progress</span>
      <span class="font-medium text-gray-900 dark:text-white">
        {{ Math.round(percentage) }}%
      </span>
    </div>
    <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
      <div
        :class="[
          'h-full rounded-full transition-all duration-300',
          color ? '' : status === 'danger' ? 'bg-red-500' : status === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
        ]"
        :style="{ 
          width: `${Math.min(100, percentage)}%`,
          backgroundColor: color || ''
        }"
      ></div>
    </div>
  </div>
</template>
