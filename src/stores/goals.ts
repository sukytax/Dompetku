import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Goal } from '@/types'
import { generateId } from '@/utils/export'
import { useTransactionsStore } from './transactions'

export const useGoalsStore = defineStore('goals', () => {
  const goals = ref<Goal[]>([])

  // Load dari localStorage
  function loadGoals() {
    const saved = localStorage.getItem('dompetku-goals')
    if (saved) {
      goals.value = JSON.parse(saved)
    }
  }

  // Simpan ke localStorage
  function saveGoals() {
    localStorage.setItem('dompetku-goals', JSON.stringify(goals.value))
  }

  // Hitung total tabungan goal dari transaksi
  function getGoalSavings(goalId: string): number {
    const transactionsStore = useTransactionsStore()
    const savings = transactionsStore.transactions
      .filter(t => t.type === 'saving' && t.goalId === goalId)
      .reduce((sum, t) => sum + t.amount, 0)
    
    const withdrawals = transactionsStore.transactions
      .filter(t => t.type === 'withdrawal' && t.goalId === goalId)
      .reduce((sum, t) => sum + t.amount, 0)
    
    return savings - withdrawals
  }

  // Hitung progress goal
  function getGoalProgress(goalId: string) {
    const goal = goals.value.find(g => g.id === goalId)
    if (!goal) return null

    const saved = getGoalSavings(goalId)
    const percentage = (saved / goal.targetAmount) * 100
    const remaining = Math.max(0, goal.targetAmount - saved)

    // Hitung estimasi per bulan jika ada deadline
    let monthlyTarget = 0
    let monthsRemaining = 0
    if (goal.deadline) {
      const now = new Date()
      const deadline = new Date(goal.deadline)
      const diffTime = deadline.getTime() - now.getTime()
      const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30))
      monthsRemaining = Math.max(1, diffMonths)
      monthlyTarget = remaining / monthsRemaining
    }

    return {
      saved,
      percentage: Math.min(100, percentage),
      remaining,
      monthlyTarget,
      monthsRemaining
    }
  }

  // CRUD
  function addGoal(goal: Omit<Goal, 'id' | 'createdAt' | 'status'>) {
    const newGoal: Goal = {
      ...goal,
      id: generateId(),
      status: 'active',
      createdAt: new Date().toISOString()
    }
    goals.value.push(newGoal)
    saveGoals()
    return newGoal
  }

  function updateGoal(id: string, updates: Partial<Omit<Goal, 'id' | 'createdAt'>>) {
    const index = goals.value.findIndex(g => g.id === id)
    if (index !== -1) {
      goals.value[index] = { ...goals.value[index], ...updates }
      saveGoals()
    }
  }

  function deleteGoal(id: string) {
    const index = goals.value.findIndex(g => g.id === id)
    if (index !== -1) {
      goals.value.splice(index, 1)
      saveGoals()
    }
  }

  function getGoalById(id: string) {
    return goals.value.find(g => g.id === id)
  }

  // Update status goal (cek apakah sudah tercapai atau turun kembali)
  function checkGoalCompletion(goalId: string) {
    const goal = goals.value.find(g => g.id === goalId)
    if (!goal) return

    const progress = getGoalProgress(goalId)
    if (!progress) return
    
    // Jika progress >= 100% dan status masih active, ubah ke completed
    if (progress.percentage >= 100 && goal.status === 'active') {
      updateGoal(goalId, { status: 'completed' })
      return true // Untuk trigger konfeti
    }
    
    // Jika progress < 100% dan status completed, kembalikan ke active
    if (progress.percentage < 100 && goal.status === 'completed') {
      updateGoal(goalId, { status: 'active' })
    }
    
    return false
  }

  // Computed
  const activeGoals = computed(() => 
    goals.value.filter(g => g.status === 'active')
  )

  const completedGoals = computed(() => 
    goals.value.filter(g => g.status === 'completed')
  )

  const archivedGoals = computed(() => 
    goals.value.filter(g => g.status === 'archived')
  )

  // Riwayat setoran per goal
  function getGoalHistory(goalId: string) {
    const transactionsStore = useTransactionsStore()
    return transactionsStore.transactions
      .filter(t => (t.type === 'saving' || t.type === 'withdrawal') && t.goalId === goalId)
      .sort((a, b) => b.date.localeCompare(a.date))
  }

  // Init
  loadGoals()

  return {
    goals,
    activeGoals,
    completedGoals,
    archivedGoals,
    addGoal,
    updateGoal,
    deleteGoal,
    getGoalById,
    getGoalSavings,
    getGoalProgress,
    checkGoalCompletion,
    getGoalHistory,
    loadGoals,
    saveGoals
  }
})
