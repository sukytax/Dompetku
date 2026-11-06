import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { Settings } from '@/types'

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<Settings>({
    // Mode awal aplikasi adalah mode gelap.
    theme: 'dark'
  })

  // Load dari localStorage
  function loadSettings() {
    const saved = localStorage.getItem('dompetku-settings')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed.theme === 'dark' || parsed.theme === 'light') {
          settings.value.theme = parsed.theme
        }
      } catch {
        localStorage.removeItem('dompetku-settings')
      }
    }
    applyTheme()
  }

  // Simpan ke localStorage
  function saveSettings() {
    localStorage.setItem('dompetku-settings', JSON.stringify(settings.value))
  }

  // Toggle tema
  function toggleTheme() {
    settings.value.theme = settings.value.theme === 'light' ? 'dark' : 'light'
    applyTheme()
    saveSettings()
  }

  // Apply tema ke DOM
  function applyTheme() {
    const isDark = settings.value.theme === 'dark'
    document.documentElement.classList.toggle('dark', isDark)
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light'
  }

  // Watch untuk auto-save
  watch(settings, saveSettings, { deep: true })

  // Init
  loadSettings()

  return {
    settings,
    toggleTheme,
    applyTheme,
    loadSettings
  }
})
