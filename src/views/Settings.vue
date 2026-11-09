<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useSettingsStore } from '@/stores/settings'
import { useWalletsStore } from '@/stores/wallets'
import { useCategoriesStore } from '@/stores/categories'
import { useTransactionsStore } from '@/stores/transactions'
import { useGoalsStore } from '@/stores/goals'
import { useBudgetsStore } from '@/stores/budgets'
import { exportToJSON, exportTransactionsToCSV, importFromJSON } from '@/utils/export'
import { useToast } from '@/composables/useToast'
import { clearUserDataFromCloud } from '@/services/firestoreSync'

const router = useRouter()
const authStore = useAuthStore()
const settingsStore = useSettingsStore()
const walletsStore = useWalletsStore()
const categoriesStore = useCategoriesStore()
const transactionsStore = useTransactionsStore()
const goalsStore = useGoalsStore()
const budgetsStore = useBudgetsStore()
const toast = useToast()

const fileInput = ref<HTMLInputElement>()

function handleExportJSON() {
  try {
    const data = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      wallets: walletsStore.wallets,
      categories: categoriesStore.categories,
      transactions: transactionsStore.transactions,
      goals: goalsStore.goals,
      budgets: budgetsStore.budgets
    }
    exportToJSON(data)
    toast.success('Data berhasil diekspor')
  } catch (error) {
    toast.error('Gagal mengekspor data')
  }
}

function handleExportCSV() {
  try {
    exportTransactionsToCSV(
      transactionsStore.transactions,
      walletsStore.wallets,
      categoriesStore.categories,
      goalsStore.goals
    )
    toast.success('Transaksi berhasil diekspor ke CSV')
  } catch (error) {
    toast.error('Gagal mengekspor CSV')
  }
}

async function handleImportJSON() {
  fileInput.value?.click()
}

async function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  try {
    const data = await importFromJSON(file)
    
    if (confirm('Import data akan mengganti semua data yang ada. Lanjutkan?')) {
      // Clear existing data
      authStore.resetAllStores()
      
      // Import new data
      walletsStore.wallets.length = 0
      walletsStore.wallets.push(...data.wallets)
      walletsStore.saveWallets()
      
      categoriesStore.categories.length = 0
      categoriesStore.categories.push(...data.categories)
      categoriesStore.saveCategories()
      
      transactionsStore.transactions.length = 0
      transactionsStore.transactions.push(...data.transactions)
      transactionsStore.saveTransactions()
      
      goalsStore.goals.length = 0
      goalsStore.goals.push(...data.goals)
      goalsStore.saveGoals()
      
      budgetsStore.budgets.length = 0
      budgetsStore.budgets.push(...data.budgets)
      budgetsStore.saveBudgets()
      
      toast.success('Data berhasil diimpor')
      setTimeout(() => window.location.reload(), 1000)
    }
  } catch (error: any) {
    toast.error(error.message || 'Gagal mengimpor data')
  }
  
  // Reset input
  target.value = ''
}

async function handleDeleteAll() {
  if (confirm('Yakin ingin menghapus SEMUA data? Tindakan ini tidak dapat dibatalkan!')) {
    if (confirm('Konfirmasi sekali lagi: Hapus semua data?')) {
      await clearUserDataFromCloud()
      authStore.resetAllStores()
      toast.success('Semua data berhasil dihapus')
      setTimeout(() => window.location.reload(), 1000)
    }
  }
}

function handleLoadSampleData() {
  if (walletsStore.wallets.length > 0 || transactionsStore.transactions.length > 0) {
    if (!confirm('Data yang ada akan dihapus dan diganti dengan data contoh. Lanjutkan?')) {
      return
    }
  }

  try {
    // Clear existing stores
    authStore.resetAllStores()
    
    // Load categories (already have defaults)
    categoriesStore.loadCategories()
    
    // Create sample wallets
    const wallet1 = walletsStore.addWallet({
      name: 'BCA',
      icon: '🏦',
      color: '#3B82F6',
      initialBalance: 5000000
    })
    
    const wallet2 = walletsStore.addWallet({
      name: 'GoPay',
      icon: '💳',
      color: '#10B981',
      initialBalance: 500000
    })
    
    walletsStore.addWallet({
      name: 'Tunai',
      icon: '💵',
      color: '#F59E0B',
      initialBalance: 1000000
    })
    
    // Create sample transactions
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    
    // Transaksi bulan ini
    transactionsStore.addTransaction({
      type: 'income',
      amount: 8000000,
      walletId: wallet1.id,
      categoryId: categoriesStore.incomeCategories[0].id, // Gaji
      date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`,
      note: 'Gaji bulanan'
    })
    
    transactionsStore.addTransaction({
      type: 'expense',
      amount: 150000,
      walletId: wallet2.id,
      categoryId: categoriesStore.expenseCategories[0].id, // Makan & Minum
      date: today,
      note: 'Makan siang'
    })
    
    transactionsStore.addTransaction({
      type: 'expense',
      amount: 50000,
      walletId: wallet2.id,
      categoryId: categoriesStore.expenseCategories[1].id, // Transport
      date: today,
      note: 'Bensin'
    })
    
    transactionsStore.addTransaction({
      type: 'expense',
      amount: 500000,
      walletId: wallet1.id,
      categoryId: categoriesStore.expenseCategories[2].id, // Belanja
      date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-05`,
      note: 'Belanja bulanan'
    })
    
    transactionsStore.addTransaction({
      type: 'expense',
      amount: 200000,
      walletId: wallet1.id,
      categoryId: categoriesStore.expenseCategories[3].id, // Tagihan
      date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-10`,
      note: 'Listrik & air'
    })
    
    // Transfer
    transactionsStore.addTransaction({
      type: 'transfer',
      amount: 500000,
      walletId: wallet1.id,
      toWalletId: wallet2.id,
      date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-03`,
      note: 'Top up GoPay'
    })
    
    // Create sample goals
    const goal1 = goalsStore.addGoal({
      name: 'Beli Laptop',
      targetAmount: 15000000,
      deadline: `${now.getFullYear()}-12-31`,
      icon: '💻',
      color: '#8B5CF6',
      note: 'Laptop untuk kerja'
    })
    
    const goal2 = goalsStore.addGoal({
      name: 'Liburan Bali',
      targetAmount: 10000000,
      deadline: `${now.getFullYear() + 1}-06-30`,
      icon: '✈️',
      color: '#06B6D4',
      note: 'Liburan keluarga'
    })
    
    // Add savings to goals
    transactionsStore.addTransaction({
      type: 'saving',
      amount: 2000000,
      walletId: wallet1.id,
      goalId: goal1.id,
      date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`,
      note: 'Nabung pertama'
    })
    
    transactionsStore.addTransaction({
      type: 'saving',
      amount: 1000000,
      walletId: wallet1.id,
      goalId: goal2.id,
      date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-02`,
      note: 'Nabung liburan'
    })
    
    // Create sample budgets
    budgetsStore.setBudget(
      categoriesStore.expenseCategories[0].id, // Makan & Minum
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
      2000000
    )
    
    budgetsStore.setBudget(
      categoriesStore.expenseCategories[1].id, // Transport
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
      500000
    )
    
    budgetsStore.setBudget(
      categoriesStore.expenseCategories[2].id, // Belanja
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
      1500000
    )
    
    toast.success('Data contoh berhasil dimuat')
    setTimeout(() => window.location.reload(), 1000)
  } catch (error) {
    toast.error('Gagal memuat data contoh')
  }
}

async function handleLogout() {
  if (confirm('Yakin ingin keluar dari akun Anda?')) {
    await authStore.logout()
    router.push('/login')
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <div class="bg-white dark:bg-gray-800 border-b dark:border-gray-700 p-6">
      <div class="max-w-4xl mx-auto">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Pengaturan</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Kelola preferensi dan data aplikasi
        </p>
      </div>
    </div>

    <!-- Content -->
    <div class="p-6 max-w-4xl mx-auto space-y-6">
      <!-- Account Info -->
      <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Akun
        </h2>
        
        <div class="space-y-4">
          <div class="flex items-center gap-4">
            <div class="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {{ authStore.user?.displayName?.charAt(0).toUpperCase() || 'U' }}
            </div>
            <div>
              <p class="font-medium text-gray-900 dark:text-white">
                {{ authStore.user?.displayName || 'User' }}
              </p>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ authStore.user?.email }}
              </p>
            </div>
          </div>

          <button
            @click="handleLogout"
            class="w-full flex items-center justify-between p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
          >
            <div class="flex items-center gap-3">
              <span class="text-2xl">🚪</span>
              <div class="text-left">
                <p class="font-medium">Keluar</p>
                <p class="text-sm opacity-75">Logout dari akun Anda</p>
              </div>
            </div>
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Appearance -->
      <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Tampilan
        </h2>
        
        <div class="flex items-center justify-between">
          <div>
            <p class="font-medium text-gray-900 dark:text-white">Mode Gelap</p>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Aktifkan tema gelap untuk kenyamanan mata
            </p>
          </div>
          <button
            @click="settingsStore.toggleTheme()"
            :class="[
              'relative inline-flex h-8 w-14 items-center rounded-full transition-colors',
              settingsStore.settings.theme === 'dark' ? 'bg-blue-500' : 'bg-gray-300'
            ]"
          >
            <span
              :class="[
                'inline-block h-6 w-6 transform rounded-full bg-white transition-transform',
                settingsStore.settings.theme === 'dark' ? 'translate-x-7' : 'translate-x-1'
              ]"
            />
          </button>
        </div>
      </div>

      <!-- Data Management -->
      <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Kelola Data
        </h2>
        
        <div class="space-y-3">
          <button
            @click="handleExportJSON"
            class="w-full flex items-center justify-between p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
          >
            <div class="flex items-center gap-3">
              <span class="text-2xl">📤</span>
              <div class="text-left">
                <p class="font-medium">Export ke JSON</p>
                <p class="text-sm opacity-75">Cadangkan semua data</p>
              </div>
            </div>
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <button
            @click="handleExportCSV"
            class="w-full flex items-center justify-between p-4 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
          >
            <div class="flex items-center gap-3">
              <span class="text-2xl">📊</span>
              <div class="text-left">
                <p class="font-medium">Export Transaksi ke CSV</p>
                <p class="text-sm opacity-75">Untuk analisis di Excel</p>
              </div>
            </div>
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <button
            @click="handleImportJSON"
            class="w-full flex items-center justify-between p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
          >
            <div class="flex items-center gap-3">
              <span class="text-2xl">📥</span>
              <div class="text-left">
                <p class="font-medium">Import dari JSON</p>
                <p class="text-sm opacity-75">Pulihkan data cadangan</p>
              </div>
            </div>
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <input
            ref="fileInput"
            type="file"
            accept=".json"
            @change="handleFileSelect"
            class="hidden"
          />

          <button
            @click="handleLoadSampleData"
            class="w-full flex items-center justify-between p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors"
          >
            <div class="flex items-center gap-3">
              <span class="text-2xl">🎲</span>
              <div class="text-left">
                <p class="font-medium">Muat Data Contoh</p>
                <p class="text-sm opacity-75">Coba aplikasi dengan data demo</p>
              </div>
            </div>
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Danger Zone -->
      <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border-2 border-red-200 dark:border-red-900">
        <h2 class="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">
          Zona Berbahaya
        </h2>
        
        <button
          @click="handleDeleteAll"
          class="w-full flex items-center justify-between p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
        >
          <div class="flex items-center gap-3">
            <span class="text-2xl">🗑️</span>
            <div class="text-left">
              <p class="font-medium">Hapus Semua Data</p>
              <p class="text-sm opacity-75">Tindakan ini tidak dapat dibatalkan</p>
            </div>
          </div>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <!-- App Info -->
      <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Tentang Aplikasi
        </h2>
        <div class="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <p><strong>Dompetku</strong> v1.0</p>
          <p>Aplikasi pencatat keuangan pribadi</p>
          <p class="pt-2">Data disimpan lokal di browser Anda</p>
        </div>
      </div>
    </div>
  </div>
</template>
