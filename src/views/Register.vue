<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const displayName = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const errorMessage = ref('')

async function handleRegister() {
  errorMessage.value = ''

  // Validasi
  if (!displayName.value || !email.value || !password.value || !confirmPassword.value) {
    errorMessage.value = 'Semua field wajib diisi'
    return
  }

  if (password.value.length < 6) {
    errorMessage.value = 'Password minimal 6 karakter'
    return
  }

  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'Password tidak cocok'
    return
  }

  loading.value = true

  const result = await authStore.register(email.value, password.value, displayName.value)

  if (result.success) {
    router.push('/')
  } else {
    errorMessage.value = result.error || 'Registrasi gagal'
  }

  loading.value = false
}

function goToLogin() {
  router.push('/login')
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <!-- Logo -->
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold text-white mb-2">💰 Dompetku</h1>
        <p class="text-green-100">Kelola Keuangan Anda</p>
      </div>

      <!-- Register Card -->
      <div class="bg-white rounded-2xl shadow-2xl p-8">
        <h2 class="text-2xl font-bold text-gray-900 mb-6 text-center">
          Buat Akun Baru
        </h2>

        <!-- Error Message -->
        <div
          v-if="errorMessage"
          class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm"
        >
          {{ errorMessage }}
        </div>

        <!-- Form -->
        <form @submit.prevent="handleRegister" class="space-y-4">
          <!-- Display Name -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Nama Lengkap
            </label>
            <input
              v-model="displayName"
              type="text"
              placeholder="Nama Anda"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              :disabled="loading"
            />
          </div>

          <!-- Email -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              v-model="email"
              type="email"
              placeholder="nama@email.com"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              :disabled="loading"
            />
          </div>

          <!-- Password -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              v-model="password"
              type="password"
              placeholder="Minimal 6 karakter"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              :disabled="loading"
            />
          </div>

          <!-- Confirm Password -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Konfirmasi Password
            </label>
            <input
              v-model="confirmPassword"
              type="password"
              placeholder="Ulangi password"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              :disabled="loading"
            />
          </div>

          <!-- Register Button -->
          <button
            type="submit"
            :disabled="loading"
            class="w-full py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ loading ? 'Memproses...' : 'Daftar' }}
          </button>
        </form>

        <!-- Divider -->
        <div class="relative my-6">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-300"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-2 bg-white text-gray-500">Sudah punya akun?</span>
          </div>
        </div>

        <!-- Login Link -->
        <button
          @click="goToLogin"
          type="button"
          class="w-full py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
        >
          Masuk
        </button>
      </div>

      <!-- Footer -->
      <p class="text-center text-green-100 text-sm mt-6">
        © 2026 Dompetku. All rights reserved.
      </p>
    </div>
  </div>
</template>
