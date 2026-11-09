import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Transaction, TransactionType } from '@/types'
import { generateId } from '@/utils/export'
import { useWalletsStore } from './wallets'
import { toMonthString } from '@/utils/date'
import { saveUserDataToCloud, loadUserDataFromCloud } from '@/services/firestoreSync'

export const useTransactionsStore = defineStore('transactions', () => {
  const transactions = ref<Transaction[]>([])
  const isLoaded = ref(false)

  // Load dari localStorage
  function loadTransactions() {
    const saved = localStorage.getItem('dompetku-transactions')
    if (saved) {
      try {
        transactions.value = JSON.parse(saved)
      } catch {
        transactions.value = []
      }
    }
  }

  // Simpan ke localStorage & sinkronkan ke cloud
  function saveTransactions() {
    localStorage.setItem('dompetku-transactions', JSON.stringify(transactions.value))
    saveUserDataToCloud('transactions', transactions.value)
  }

  // Sinkronisasi dengan Firestore
  async function syncWithCloud(userId?: string) {
    const remote = await loadUserDataFromCloud<Transaction>('transactions', userId)
    if (remote !== null) {
      transactions.value = remote
      localStorage.setItem('dompetku-transactions', JSON.stringify(remote))
    } else if (transactions.value.length > 0) {
      saveUserDataToCloud('transactions', transactions.value, userId, true)
    }
    isLoaded.value = true
  }

  // Reset data di memori dan sesi lokal
  function reset() {
    transactions.value = []
    isLoaded.value = false
    localStorage.removeItem('dompetku-transactions')
  }

  // Hitung saldo dompet berdasarkan transaksi
  function getWalletBalance(walletId: string): number {
    const walletsStore = useWalletsStore()
    const wallet = walletsStore.getWalletById(walletId)
    if (!wallet) return 0

    let balance = wallet.initialBalance

    transactions.value.forEach(t => {
      if (t.type === 'income' && t.walletId === walletId) {
        balance += t.amount
      } else if (t.type === 'expense' && t.walletId === walletId) {
        balance -= t.amount
      } else if (t.type === 'saving' && t.walletId === walletId) {
        balance -= t.amount
      } else if (t.type === 'withdrawal' && t.walletId === walletId) {
        balance += t.amount
      } else if (t.type === 'transfer') {
        if (t.walletId === walletId) {
          balance -= t.amount
        } else if (t.toWalletId === walletId) {
          balance += t.amount
        }
      }
    })

    return balance
  }

  // Computed: Total saldo semua dompet
  const totalBalance = computed(() => {
    const walletsStore = useWalletsStore()
    return walletsStore.wallets.reduce((sum, wallet) => {
      return sum + getWalletBalance(wallet.id)
    }, 0)
  })

  // Validasi saldo sebelum transaksi
  function validateBalance(walletId: string, amount: number): boolean {
    const currentBalance = getWalletBalance(walletId)
    return currentBalance >= amount
  }

  // CRUD
  function addTransaction(transaction: Omit<Transaction, 'id' | 'createdAt'>) {
    // Validasi saldo untuk expense, transfer, dan saving
    if (transaction.type === 'expense' || transaction.type === 'transfer' || transaction.type === 'saving') {
      if (!validateBalance(transaction.walletId, transaction.amount)) {
        throw new Error('Saldo dompet tidak mencukupi')
      }
    }

    const newTransaction: Transaction = {
      ...transaction,
      id: generateId(),
      createdAt: new Date().toISOString()
    }
    transactions.value.unshift(newTransaction) // Tambah di awal
    saveTransactions()
    return newTransaction
  }

  function updateTransaction(id: string, updates: Partial<Omit<Transaction, 'id' | 'createdAt'>>) {
    const index = transactions.value.findIndex(t => t.id === id)
    if (index !== -1) {
      // Validasi saldo jika ada perubahan amount atau walletId
      const oldTx = transactions.value[index]
      const newAmount = updates.amount !== undefined ? updates.amount : oldTx.amount
      
      if (oldTx.type === 'expense' || oldTx.type === 'transfer' || oldTx.type === 'saving') {
        // Restore saldo lama
        const balanceWithoutOldTx = getWalletBalance(oldTx.walletId) + oldTx.amount
        // Cek saldo baru
        if (balanceWithoutOldTx < newAmount) {
          throw new Error('Saldo dompet tidak mencukupi')
        }
      }

      transactions.value[index] = { ...oldTx, ...updates }
      saveTransactions()
    }
  }

  function deleteTransaction(id: string) {
    const index = transactions.value.findIndex(t => t.id === id)
    if (index !== -1) {
      transactions.value.splice(index, 1)
      saveTransactions()
    }
  }

  function getTransactionById(id: string) {
    return transactions.value.find(t => t.id === id)
  }

  // Filter dan query
  function getTransactionsByWallet(walletId: string) {
    return transactions.value.filter(t => 
      t.walletId === walletId || t.toWalletId === walletId
    )
  }

  function getTransactionsByType(type: TransactionType) {
    return transactions.value.filter(t => t.type === type)
  }

  function getTransactionsByMonth(month: string) {
    return transactions.value.filter(t => {
      const txMonth = toMonthString(t.date)
      return txMonth === month
    })
  }

  function getTransactionsByDateRange(startDate: string, endDate: string) {
    return transactions.value.filter(t => {
      return t.date >= startDate && t.date <= endDate
    })
  }

  // Statistik bulan ini
  const currentMonthStats = computed(() => {
    const currentMonth = toMonthString(new Date())
    const monthTransactions = getTransactionsByMonth(currentMonth)
    
    const income = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
    
    const expense = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)
    
    return {
      income,
      expense,
      balance: income - expense
    }
  })

  // Transaksi terbaru
  const recentTransactions = computed(() => {
    return transactions.value.slice(0, 5)
  })

  // Pengeluaran per kategori bulan ini
  function getExpensesByCategory(month?: string) {
    const targetMonth = month || toMonthString(new Date())
    const monthTransactions = getTransactionsByMonth(targetMonth)
    
    const expenseMap = new Map<string, number>()
    
    monthTransactions
      .filter(t => t.type === 'expense' && t.categoryId)
      .forEach(t => {
        const current = expenseMap.get(t.categoryId!) || 0
        expenseMap.set(t.categoryId!, current + t.amount)
      })
    
    return Array.from(expenseMap.entries()).map(([categoryId, amount]) => ({
      categoryId,
      amount
    }))
  }

  // Pemasukan vs pengeluaran per bulan (untuk grafik)
  function getMonthlyStats(monthsCount: number = 6) {
    const stats: Array<{ month: string; income: number; expense: number }> = []
    const now = new Date()
    
    for (let i = monthsCount - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthStr = toMonthString(date)
      const monthTransactions = getTransactionsByMonth(monthStr)
      
      const income = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0)
      
      const expense = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0)
      
      stats.push({ month: monthStr, income, expense })
    }
    
    return stats
  }

  // Group transaksi per tanggal (untuk list)
  function getGroupedTransactions(txs?: Transaction[]) {
    const toGroup = txs || transactions.value
    const grouped = new Map<string, Transaction[]>()
    
    toGroup.forEach(t => {
      const date = t.date
      if (!grouped.has(date)) {
        grouped.set(date, [])
      }
      grouped.get(date)!.push(t)
    })
    
    return Array.from(grouped.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([date, txs]) => ({
        date,
        transactions: txs.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      }))
  }

  // Init
  loadTransactions()

  return {
    transactions,
    isLoaded,
    totalBalance,
    currentMonthStats,
    recentTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    getTransactionById,
    getTransactionsByWallet,
    getTransactionsByType,
    getTransactionsByMonth,
    getTransactionsByDateRange,
    getWalletBalance,
    validateBalance,
    getExpensesByCategory,
    getMonthlyStats,
    getGroupedTransactions,
    loadTransactions,
    saveTransactions,
    syncWithCloud,
    reset
  }
})
