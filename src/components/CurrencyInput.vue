<script setup lang="ts">
import { ref, watch } from 'vue'
import { formatCurrencyInput, parseCurrency } from '@/utils/currency'

const props = defineProps<{
  modelValue: number
  label?: string
  placeholder?: string
  error?: string
  required?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const displayValue = ref('')

// Format tampilan saat komponen dimuat
watch(() => props.modelValue, (newValue) => {
  if (newValue > 0) {
    if (parseCurrency(displayValue.value) !== newValue) {
      displayValue.value = formatCurrencyInput(newValue.toString())
    }
  } else {
    displayValue.value = ''
  }
}, { immediate: true })

function handleInput(e: Event) {
  const target = e.target as HTMLInputElement
  const value = target.value
  
  // Format dengan pemisah ribuan
  displayValue.value = formatCurrencyInput(value)
  
  // Emit nilai numerik
  const numericValue = parseCurrency(value)
  emit('update:modelValue', numericValue)
}

function handleFocus(e: Event) {
  const target = e.target as HTMLInputElement
  target.select()
}
</script>

<template>
  <div class="space-y-1">
    <label v-if="label" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>
    <div class="relative">
      <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
        Rp
      </span>
      <input
        type="text"
        inputmode="numeric"
        :value="displayValue"
        :placeholder="placeholder"
        @input="handleInput"
        @focus="handleFocus"
        :class="[
          'w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent',
          error 
            ? 'border-red-500 dark:border-red-500' 
            : 'border-gray-300 dark:border-gray-600',
          'bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
        ]"
      />
    </div>
    <p v-if="error" class="text-sm text-red-500">
      {{ error }}
    </p>
  </div>
</template>
