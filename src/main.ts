import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './style.css'
import { useSettingsStore } from './stores/settings'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
// Terapkan tema sebelum aplikasi dirender agar default dark langsung terlihat.
useSettingsStore().loadSettings()
app.use(router)

app.mount('#app')
