import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Wallet } from '@/types'
import { generateId } from '@/utils/export'
import { saveUserDataToCloud, loadUserDataFromCloud } from '@/services/firestoreSync'

export const useWalletsStore = defineStore('wallets', () => {
  const wallets = ref<Wallet[]>([])
  const isLoaded = ref(false)

  // Load dari localStorage (inisialisasi instan)
  function loadWallets() {
    const saved = localStorage.getItem('dompetku-wallets')
    if (saved) {
      try {
        wallets.value = JSON.parse(saved)
      } catch {
        wallets.value = []
      }
    }
  }

  // Simpan ke localStorage & sinkronkan ke cloud
  function saveWallets() {
    localStorage.setItem('dompetku-wallets', JSON.stringify(wallets.value))
    saveUserDataToCloud('wallets', wallets.value)
  }

  // Sinkronisasi dengan Firestore
  async function syncWithCloud(userId?: string) {
    const remote = await loadUserDataFromCloud<Wallet>('wallets', userId)
    if (remote !== null) {
      wallets.value = remote
      localStorage.setItem('dompetku-wallets', JSON.stringify(remote))
    } else if (wallets.value.length > 0) {
      // Jika di cloud belum ada namun di lokal ada, upload data lokal ke cloud
      saveUserDataToCloud('wallets', wallets.value, userId, true)
    }
    isLoaded.value = true
  }

  // Reset data di memori dan sesi lokal
  function reset() {
    wallets.value = []
    isLoaded.value = false
    localStorage.removeItem('dompetku-wallets')
  }

  // CRUD
  function addWallet(wallet: Omit<Wallet, 'id' | 'createdAt'>) {
    const newWallet: Wallet = {
      ...wallet,
      id: generateId(),
      createdAt: new Date().toISOString()
    }
    wallets.value.push(newWallet)
    saveWallets()
    return newWallet
  }

  function updateWallet(id: string, updates: Partial<Omit<Wallet, 'id' | 'createdAt'>>) {
    const index = wallets.value.findIndex(w => w.id === id)
    if (index !== -1) {
      wallets.value[index] = { ...wallets.value[index], ...updates }
      saveWallets()
    }
  }

  function deleteWallet(id: string) {
    const index = wallets.value.findIndex(w => w.id === id)
    if (index !== -1) {
      wallets.value.splice(index, 1)
      saveWallets()
    }
  }

  function getWalletById(id: string) {
    return wallets.value.find(w => w.id === id)
  }

  // Computed
  const totalWallets = computed(() => wallets.value.length)

  // Init
  loadWallets()

  return {
    wallets,
    isLoaded,
    totalWallets,
    addWallet,
    updateWallet,
    deleteWallet,
    getWalletById,
    loadWallets,
    saveWallets,
    syncWithCloud,
    reset
  }
})
