import { defineStore } from 'pinia'
import { ref } from 'vue'
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
  updateProfile
} from 'firebase/auth'
import { auth, firebaseConfigured } from '@/firebase/config'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const loading = ref(true)
  const error = ref<string | null>(null)

  // Initialize auth state listener
  function initAuthListener() {
    if (!auth) {
      loading.value = false
      return
    }

    onAuthStateChanged(auth, (firebaseUser) => {
      user.value = firebaseUser
      loading.value = false
    })
  }

  // Register new user
  async function register(email: string, password: string, displayName: string) {
    if (!auth || !firebaseConfigured) {
      error.value = 'Konfigurasi Firebase belum diisi di file .env'
      return { success: false, error: error.value }
    }

    try {
      error.value = null
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      
      // Update profile dengan display name
      await updateProfile(userCredential.user, {
        displayName: displayName
      })
      
      user.value = userCredential.user
      return { success: true }
    } catch (err: any) {
      error.value = getErrorMessage(err.code)
      return { success: false, error: error.value }
    }
  }

  // Login existing user
  async function login(email: string, password: string) {
    if (!auth || !firebaseConfigured) {
      error.value = 'Konfigurasi Firebase belum diisi di file .env'
      return { success: false, error: error.value }
    }

    try {
      error.value = null
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      user.value = userCredential.user
      return { success: true }
    } catch (err: any) {
      error.value = getErrorMessage(err.code)
      return { success: false, error: error.value }
    }
  }

  // Logout
  async function logout() {
    if (!auth) {
      user.value = null
      return { success: true }
    }

    try {
      await signOut(auth)
      user.value = null
      
      // Clear all local data
      localStorage.clear()
      
      return { success: true }
    } catch (err: any) {
      error.value = 'Gagal logout'
      return { success: false, error: error.value }
    }
  }

  // Error message helper
  function getErrorMessage(code: string): string {
    switch (code) {
      case 'auth/email-already-in-use':
        return 'Email sudah terdaftar'
      case 'auth/invalid-email':
        return 'Format email tidak valid'
      case 'auth/operation-not-allowed':
        return 'Operasi tidak diizinkan'
      case 'auth/weak-password':
        return 'Password terlalu lemah (minimal 6 karakter)'
      case 'auth/user-disabled':
        return 'Akun ini telah dinonaktifkan'
      case 'auth/user-not-found':
        return 'Email tidak terdaftar'
      case 'auth/wrong-password':
        return 'Password salah'
      case 'auth/invalid-credential':
        return 'Email atau password salah'
      case 'auth/too-many-requests':
        return 'Terlalu banyak percobaan, coba lagi nanti'
      default:
        return 'Terjadi kesalahan, silakan coba lagi'
    }
  }

  // Init listener saat store dibuat
  initAuthListener()

  return {
    user,
    loading,
    error,
    register,
    login,
    logout
  }
})
