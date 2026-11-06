<script setup lang="ts">
import { computed } from 'vue'
import { useTransactionsStore } from '@/stores/transactions'
import { useWalletsStore } from '@/stores/wallets'
import { useGoalsStore } from '@/stores/goals'
import { useCategoriesStore } from '@/stores/categories'
import { formatCurrency } from '@/utils/currency'
import { formatDate } from '@/utils/date'
import EmptyState from '@/components/EmptyState.vue'
import ProgressBar from '@/components/ProgressBar.vue'

// Chart.js imports
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js'
import { Doughnut, Bar } from 'vue-chartjs'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement)

const transactionsStore = useTransactionsStore()
const walletsStore = useWalletsStore()
const goalsStore = useGoalsStore()
const categoriesStore = useCategoriesStore()

const totalBalance = computed(() => transactionsStore.totalBalance)
const monthStats = computed(() => transactionsStore.currentMonthStats)
const recentTransactions = computed(() => transactionsStore.recentTransactions)
const activeGoals = computed(() => goalsStore.activeGoals)

// Chart data - Donat pengeluaran per kategori
const expenseChartData = computed(() => {
  const expenses = transactionsStore.getExpensesByCategory()
  
  if (expenses.length === 0) {
    return null
  }
  
  const labels: string[] = []
  const data: number[] = []
  const backgroundColor: string[] = []
  
  expenses.forEach(({ categoryId, amount }) => {
    const category = categoriesStore.getCategoryById(categoryId)
    if (category) {
      labels.push(category.name)
      data.push(amount)
      backgroundColor.push(category.color)
    }
  })
  
  return {
    labels,
    datasets: [{
      data,
      backgroundColor,
      borderWidth: 0
    }]
  }
})

// Chart data - Batang pemasukan vs pengeluaran
const monthlyChartData = computed(() => {
  const stats = transactionsStore.getMonthlyStats(6)
  
  const labels = stats.map(s => {
    const [, month] = s.month.split('-')
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
    return monthNames[parseInt(month) - 1]
  })
  
  return {
    labels,
    datasets: [
      {
        label: 'Pemasukan',
        data: stats.map(s => s.income),
        backgroundColor: '#10B981',
      },
      {
        label: 'Pengeluaran',
        data: stats.map(s => s.expense),
        backgroundColor: '#EF4444',
      }
    ]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: {
      position: 'bottom' as const,
    }
  }
}

function getTransactionLabel(tx: any) {
  if (tx.type === 'income') {
    const category = categoriesStore.getCategoryById(tx.categoryId)
    return category?.name || 'Pemasukan'
  } else if (tx.type === 'expense') {
    const category = categoriesStore.getCategoryById(tx.categoryId)
    return category?.name || 'Pengeluaran'
  } else if (tx.type === 'transfer') {
    const fromWallet = walletsStore.getWalletById(tx.walletId)
    const toWallet = walletsStore.getWalletById(tx.toWalletId!)
    return `Transfer: ${fromWallet?.name} → ${toWallet?.name}`
  } else if (tx.type === 'saving') {
    const goal = goalsStore.getGoalById(tx.goalId!)
    return `Tabungan: ${goal?.name}`
  } else if (tx.type === 'withdrawal') {
    const goal = goalsStore.getGoalById(tx.goalId!)
    return `Tarik Dana: ${goal?.name}`
  }
  return 'Transaksi'
}

function getWalletName(walletId: string) {
  return walletsStore.getWalletById(walletId)?.name || 'Dompet'
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <div class="bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 text-white p-6 md:p-8">
      <h1 class="text-2xl font-bold mb-6">Dashboard</h1>
      
      <!-- Total Saldo -->
      <div class="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6">
        <p class="text-sm opacity-90 mb-2">Total Saldo</p>
        <p class="text-4xl font-bold">{{ formatCurrency(totalBalance) }}</p>
      </div>
      
      <!-- Ringkasan Bulan Ini -->
      <div class="grid grid-cols-3 gap-4">
        <div class="bg-white/10 backdrop-blur-sm rounded-xl p-4">
          <p class="text-xs opacity-75 mb-1">Pemasukan</p>
          <p class="text-lg font-semibold">{{ formatCurrency(monthStats.income) }}</p>
        </div>
        <div class="bg-white/10 backdrop-blur-sm rounded-xl p-4">
          <p class="text-xs opacity-75 mb-1">Pengeluaran</p>
          <p class="text-lg font-semibold">{{ formatCurrency(monthStats.expense) }}</p>
        </div>
        <div class="bg-white/10 backdrop-blur-sm rounded-xl p-4">
          <p class="text-xs opacity-75 mb-1">Selisih</p>
          <p :class="['text-lg font-semibold', monthStats.balance >= 0 ? 'text-green-300' : 'text-red-300']">
            {{ formatCurrency(monthStats.balance) }}
          </p>
        </div>
      </div>
    </div>
    
    <!-- Content -->
    <div class="p-6 space-y-6 max-w-7xl mx-auto">
      <!-- Grafik -->
      <div class="grid md:grid-cols-2 gap-6">
        <!-- Pengeluaran Per Kategori -->
        <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Pengeluaran Per Kategori
          </h2>
          <div v-if="expenseChartData && expenseChartData.datasets[0].data.length > 0" class="max-w-sm mx-auto">
            <Doughnut :data="expenseChartData" :options="chartOptions" />
          </div>
          <EmptyState
            v-else
            icon="📊"
            title="Belum Ada Data"
            description="Pengeluaran bulan ini akan ditampilkan di sini"
          />
        </div>
        
        <!-- Pemasukan vs Pengeluaran -->
        <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            6 Bulan Terakhir
          </h2>
          <div>
            <Bar :data="monthlyChartData" :options="chartOptions" />
          </div>
        </div>
      </div>
      
      <!-- Transaksi Terbaru -->
      <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
            Transaksi Terbaru
          </h2>
          <router-link
            to="/transactions"
            class="text-sm text-blue-500 hover:text-blue-600"
          >
            Lihat Semua
          </router-link>
        </div>
        
        <div v-if="recentTransactions.length > 0" class="space-y-3">
          <div
            v-for="tx in recentTransactions"
            :key="tx.id"
            class="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div class="flex-1">
              <p class="font-medium text-gray-900 dark:text-white">
                {{ getTransactionLabel(tx) }}
              </p>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ getWalletName(tx.walletId) }} • {{ formatDate(tx.date, 'short') }}
              </p>
            </div>
            <p :class="[
              'font-semibold',
              tx.type === 'income' || tx.type === 'withdrawal' ? 'text-green-500' : 'text-red-500'
            ]">
              {{ tx.type === 'income' || tx.type === 'withdrawal' ? '+' : '-' }}{{ formatCurrency(tx.amount) }}
            </p>
          </div>
        </div>
        
        <EmptyState
          v-else
          icon="📝"
          title="Belum Ada Transaksi"
          description="Mulai catat transaksi pertama Anda"
        />
      </div>
      
      <!-- Goals Progress -->
      <div v-if="activeGoals.length > 0" class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
            Progress Goals
          </h2>
          <router-link
            to="/goals"
            class="text-sm text-blue-500 hover:text-blue-600"
          >
            Lihat Semua
          </router-link>
        </div>
        
        <div class="space-y-4">
          <div
            v-for="goal in activeGoals.slice(0, 3)"
            :key="goal.id"
            class="p-4 rounded-lg bg-gray-50 dark:bg-gray-700"
          >
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2">
                <span class="text-2xl">{{ goal.icon }}</span>
                <span class="font-medium text-gray-900 dark:text-white">{{ goal.name }}</span>
              </div>
              <span class="text-sm font-medium text-gray-600 dark:text-gray-400">
                {{ formatCurrency(goalsStore.getGoalSavings(goal.id)) }} / {{ formatCurrency(goal.targetAmount) }}
              </span>
            </div>
            <ProgressBar
              :percentage="goalsStore.getGoalProgress(goal.id)?.percentage || 0"
              :color="goal.color"
              :show-label="true"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
