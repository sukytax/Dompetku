import { computed } from 'vue'
import { useTransactionsStore } from '@/stores/transactions'
import { useCategoriesStore } from '@/stores/categories'
import { formatDate } from '@/utils/date'

export function useChartData() {
  const transactionsStore = useTransactionsStore()
  const categoriesStore = useCategoriesStore()

  // Data untuk grafik donat pengeluaran per kategori
  const expensePieChartData = computed(() => {
    const expenses = transactionsStore.getExpensesByCategory()
    
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

  // Data untuk grafik batang pemasukan vs pengeluaran
  const monthlyBarChartData = computed(() => {
    const stats = transactionsStore.getMonthlyStats(6)
    
    const labels = stats.map(s => {
      const [year, month] = s.month.split('-')
      const date = new Date(parseInt(year), parseInt(month) - 1)
      return formatDate(date, 'monthYear')
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

  return {
    expensePieChartData,
    monthlyBarChartData
  }
}
