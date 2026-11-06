import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Wallet } from '@/types'
import { generateId } from '@/utils/export'

export const useWalletsStore = defineStore('wallets', () => {
  const wallets = ref<Wallet[]>([])

  // Load dari localStorage
  function loadWallets() {
    const saved = localStorage.getItem('dompetku-wallets')
    if (saved) {
      wallets.value = JSON.parse(saved)
    }
  }

  // Simpan ke localStorage
  function saveWallets() {
    localStorage.setItem('dompetku-wallets', JSON.stringify(wallets.value))
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
    totalWallets,
    addWallet,
    updateWallet,
    deleteWallet,
    getWalletById,
    loadWallets,
    saveWallets
  }
})
