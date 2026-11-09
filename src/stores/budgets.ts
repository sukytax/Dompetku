import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Budget } from '@/types'
import { generateId } from '@/utils/export'
import { useTransactionsStore } from './transactions'
import { toMonthString } from '@/utils/date'
import { saveUserDataToCloud, loadUserDataFromCloud } from '@/services/firestoreSync'

export const useBudgetsStore = defineStore('budgets', () => {
  const budgets = ref<Budget[]>([])
  const isLoaded = ref(false)

  // Load dari localStorage
  function loadBudgets() {
    const saved = localStorage.getItem('dompetku-budgets')
    if (saved) {
      try {
        budgets.value = JSON.parse(saved)
      } catch {
        budgets.value = []
      }
    }
  }

  // Simpan ke localStorage & sinkronkan ke cloud
  function saveBudgets() {
    localStorage.setItem('dompetku-budgets', JSON.stringify(budgets.value))
    saveUserDataToCloud('budgets', budgets.value)
  }

  // Sinkronisasi dengan Firestore
  async function syncWithCloud(userId?: string) {
    const remote = await loadUserDataFromCloud<Budget>('budgets', userId)
    if (remote !== null) {
      budgets.value = remote
      localStorage.setItem('dompetku-budgets', JSON.stringify(remote))
    } else if (budgets.value.length > 0) {
      saveUserDataToCloud('budgets', budgets.value, userId, true)
    }
    isLoaded.value = true
  }

  // Reset data di memori dan sesi lokal
  function reset() {
    budgets.value = []
    isLoaded.value = false
    localStorage.removeItem('dompetku-budgets')
  }

  // CRUD
  function setBudget(categoryId: string, month: string, limit: number) {
    const existing = budgets.value.find(
      b => b.categoryId === categoryId && b.month === month
    )

    if (existing) {
      existing.limit = limit
    } else {
      budgets.value.push({
        id: generateId(),
        categoryId,
        month,
        limit
      })
    }
    saveBudgets()
  }

  function deleteBudget(id: string) {
    const index = budgets.value.findIndex(b => b.id === id)
    if (index !== -1) {
      budgets.value.splice(index, 1)
      saveBudgets()
    }
  }

  function getBudget(categoryId: string, month: string) {
    return budgets.value.find(
      b => b.categoryId === categoryId && b.month === month
    )
  }

  // Hitung spending untuk kategori di bulan tertentu
  function getCategorySpending(categoryId: string, month: string): number {
    const transactionsStore = useTransactionsStore()
    const monthTransactions = transactionsStore.getTransactionsByMonth(month)
    
    return monthTransactions
      .filter(t => t.type === 'expense' && t.categoryId === categoryId)
      .reduce((sum, t) => sum + t.amount, 0)
  }

  // Budget progress untuk bulan tertentu
  function getBudgetProgress(categoryId: string, month: string) {
    const budget = getBudget(categoryId, month)
    if (!budget) return null

    const spent = getCategorySpending(categoryId, month)
    const percentage = (spent / budget.limit) * 100
    const remaining = Math.max(0, budget.limit - spent)

    let status: 'safe' | 'warning' | 'danger' = 'safe'
    if (percentage >= 100) {
      status = 'danger'
    } else if (percentage >= 80) {
      status = 'warning'
    }

    return {
      budget: budget.limit,
      spent,
      remaining,
      percentage: Math.min(100, percentage),
      status
    }
  }

  // Semua budget bulan ini dengan progress
  const currentMonthBudgets = computed(() => {
    const currentMonth = toMonthString(new Date())
    return budgets.value
      .filter(b => b.month === currentMonth)
      .map(b => ({
        ...b,
        progress: getBudgetProgress(b.categoryId, b.month)
      }))
  })

  // Budget untuk bulan tertentu
  function getMonthBudgets(month: string) {
    return budgets.value
      .filter(b => b.month === month)
      .map(b => ({
        ...b,
        progress: getBudgetProgress(b.categoryId, b.month)
      }))
  }

  // Init
  loadBudgets()

  return {
    budgets,
    isLoaded,
    currentMonthBudgets,
    setBudget,
    deleteBudget,
    getBudget,
    getCategorySpending,
    getBudgetProgress,
    getMonthBudgets,
    loadBudgets,
    saveBudgets,
    syncWithCloud,
    reset
  }
})
