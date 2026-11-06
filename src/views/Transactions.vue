<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTransactionsStore } from '@/stores/transactions'
import { useWalletsStore } from '@/stores/wallets'
import { useCategoriesStore } from '@/stores/categories'
import { useGoalsStore } from '@/stores/goals'
import { formatCurrency } from '@/utils/currency'
import { formatDate, toInputDate, toMonthString } from '@/utils/date'
import { useToast } from '@/composables/useToast'
import type { TransactionType } from '@/types'
import Modal from '@/components/Modal.vue'
import CurrencyInput from '@/components/CurrencyInput.vue'
import EmptyState from '@/components/EmptyState.vue'

const transactionsStore = useTransactionsStore()
const walletsStore = useWalletsStore()
const categoriesStore = useCategoriesStore()
const goalsStore = useGoalsStore()
const toast = useToast()

const showModal = ref(false)
const editingId = ref<string | null>(null)

const form = ref({
  type: 'expense' as TransactionType,
  amount: 0,
  walletId: '',
  toWalletId: '',
  categoryId: '',
  goalId: '',
  date: toInputDate(),
  note: ''
})

const formErrors = ref({
  amount: '',
  walletId: '',
  toWalletId: '',
  categoryId: ''
})

// Filters
const searchQuery = ref('')
const filterType = ref<TransactionType | 'all'>('all')
const filterCategory = ref('')
const filterWallet = ref('')
const filterMonth = ref(toMonthString())

const transactions = computed(() => {
  let filtered = transactionsStore.transactions

  // Filter by month
  if (filterMonth.value) {
    filtered = transactionsStore.getTransactionsByMonth(filterMonth.value)
  }

  // Filter by type
  if (filterType.value !== 'all') {
    filtered = filtered.filter(t => t.type === filterType.value)
  }

  // Filter by category
  if (filterCategory.value) {
    filtered = filtered.filter(t => t.categoryId === filterCategory.value)
  }

  // Filter by wallet
  if (filterWallet.value) {
    filtered = filtered.filter(t => 
      t.walletId === filterWallet.value || t.toWalletId === filterWallet.value
    )
  }

  // Search
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(t => {
      const note = t.note?.toLowerCase() || ''
      const wallet = walletsStore.getWalletById(t.walletId)?.name.toLowerCase() || ''
      const category = t.categoryId ? categoriesStore.getCategoryById(t.categoryId)?.name.toLowerCase() || '' : ''
      return note.includes(query) || wallet.includes(query) || category.includes(query)
    })
  }

  return filtered
})

const groupedTransactions = computed(() => {
  return transactionsStore.getGroupedTransactions(transactions.value)
})

const categories = computed(() => {
  if (form.value.type === 'income') {
    return categoriesStore.incomeCategories
  } else if (form.value.type === 'expense') {
    return categoriesStore.expenseCategories
  }
  return []
})

function openAddModal() {
  editingId.value = null
  form.value = {
    type: 'expense',
    amount: 0,
    walletId: walletsStore.wallets[0]?.id || '',
    toWalletId: '',
    categoryId: '',
    goalId: '',
    date: toInputDate(),
    note: ''
  }
  formErrors.value = { amount: '', walletId: '', toWalletId: '', categoryId: '' }
  showModal.value = true
}

function openEditModal(txId: string) {
  const tx = transactionsStore.getTransactionById(txId)
  if (!tx) return

  editingId.value = txId
  form.value = {
    type: tx.type,
    amount: tx.amount,
    walletId: tx.walletId,
    toWalletId: tx.toWalletId || '',
    categoryId: tx.categoryId || '',
    goalId: tx.goalId || '',
    date: tx.date,
    note: tx.note || ''
  }
  formErrors.value = { amount: '', walletId: '', toWalletId: '', categoryId: '' }
  showModal.value = true
}

function validateForm() {
  let valid = true
  formErrors.value = { amount: '', walletId: '', toWalletId: '', categoryId: '' }

  if (form.value.amount <= 0) {
    formErrors.value.amount = 'Nominal harus lebih dari 0'
    valid = false
  }

  if (!form.value.walletId) {
    formErrors.value.walletId = 'Dompet wajib dipilih'
    valid = false
  }

  if (form.value.type === 'transfer' && !form.value.toWalletId) {
    formErrors.value.toWalletId = 'Dompet tujuan wajib dipilih'
    valid = false
  }

  if ((form.value.type === 'income' || form.value.type === 'expense') && !form.value.categoryId) {
    formErrors.value.categoryId = 'Kategori wajib dipilih'
    valid = false
  }

  return valid
}

function handleSubmit() {
  if (!validateForm()) return

  try {
    const txData: any = {
      type: form.value.type,
      amount: form.value.amount,
      walletId: form.value.walletId,
      date: form.value.date,
      note: form.value.note || undefined
    }

    if (form.value.type === 'transfer') {
      txData.toWalletId = form.value.toWalletId
    } else if (form.value.type === 'saving' || form.value.type === 'withdrawal') {
      txData.goalId = form.value.goalId
    } else {
      txData.categoryId = form.value.categoryId
    }

    if (editingId.value) {
      transactionsStore.updateTransaction(editingId.value, txData)
      
      // Cek status goal jika transaksi berhubungan dengan goal
      if (txData.goalId) {
        goalsStore.checkGoalCompletion(txData.goalId)
      }
      
      toast.success('Transaksi berhasil diperbarui')
    } else {
      transactionsStore.addTransaction(txData)
      
      // Cek status goal jika transaksi berhubungan dengan goal
      if (txData.goalId) {
        goalsStore.checkGoalCompletion(txData.goalId)
      }
      
      toast.success('Transaksi berhasil ditambahkan')
    }
    showModal.value = false
  } catch (error: any) {
    toast.error(error.message || 'Gagal menyimpan transaksi')
  }
}

function handleDelete(txId: string) {
  const tx = transactionsStore.getTransactionById(txId)
  
  if (confirm('Yakin ingin menghapus transaksi ini?')) {
    transactionsStore.deleteTransaction(txId)
    
    // Cek status goal jika transaksi berhubungan dengan goal
    if (tx && tx.goalId) {
      goalsStore.checkGoalCompletion(tx.goalId)
    }
    
    toast.success('Transaksi berhasil dihapus')
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
    const toWallet = walletsStore.getWalletById(tx.toWalletId!)
    return `Transfer ke ${toWallet?.name}`
  } else if (tx.type === 'saving') {
    const goal = goalsStore.getGoalById(tx.goalId!)
    return `Tabungan ${goal?.name}`
  } else if (tx.type === 'withdrawal') {
    const goal = goalsStore.getGoalById(tx.goalId!)
    return `Tarik Dana ${goal?.name}`
  }
  return 'Transaksi'
}

function getWalletName(walletId: string) {
  return walletsStore.getWalletById(walletId)?.name || 'Dompet'
}

function clearFilters() {
  searchQuery.value = ''
  filterType.value = 'all'
  filterCategory.value = ''
  filterWallet.value = ''
  filterMonth.value = toMonthString()
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <div class="bg-white dark:bg-gray-800 border-b dark:border-gray-700 p-6">
      <div class="max-w-7xl mx-auto">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Transaksi</h1>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {{ transactions.length }} transaksi
            </p>
          </div>
          <button
            @click="openAddModal"
            class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            + Tambah
          </button>
        </div>

        <!-- Filters -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
          <!-- Search -->
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Cari transaksi..."
            class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />

          <!-- Filter Tipe -->
          <select
            v-model="filterType"
            class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="all">Semua Tipe</option>
            <option value="income">Pemasukan</option>
            <option value="expense">Pengeluaran</option>
            <option value="transfer">Transfer</option>
            <option value="saving">Tabungan</option>
            <option value="withdrawal">Tarik Dana</option>
          </select>

          <!-- Filter Dompet -->
          <select
            v-model="filterWallet"
            class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="">Semua Dompet</option>
            <option v-for="wallet in walletsStore.wallets" :key="wallet.id" :value="wallet.id">
              {{ wallet.icon }} {{ wallet.name }}
            </option>
          </select>

          <!-- Filter Bulan -->
          <input
            v-model="filterMonth"
            type="month"
            class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <button
          v-if="searchQuery || filterType !== 'all' || filterCategory || filterWallet"
          @click="clearFilters"
          class="mt-3 text-sm text-blue-500 hover:text-blue-600"
        >
          Reset Filter
        </button>
      </div>
    </div>

    <!-- Content -->
    <div class="p-6 max-w-7xl mx-auto">
      <div v-if="groupedTransactions.length > 0" class="space-y-6">
        <div v-for="group in groupedTransactions" :key="group.date" class="space-y-3">
          <h3 class="text-sm font-semibold text-gray-500 dark:text-gray-400 sticky top-0 bg-gray-50 dark:bg-gray-900 py-2">
            {{ formatDate(group.date, 'long') }}
          </h3>

          <div class="bg-white dark:bg-gray-800 rounded-xl divide-y dark:divide-gray-700 shadow-sm">
            <div
              v-for="tx in group.transactions"
              :key="tx.id"
              class="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
              @click="openEditModal(tx.id)"
            >
              <div class="flex items-center justify-between">
                <div class="flex-1">
                  <p class="font-medium text-gray-900 dark:text-white">
                    {{ getTransactionLabel(tx) }}
                  </p>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    {{ getWalletName(tx.walletId) }}
                    <span v-if="tx.note"> • {{ tx.note }}</span>
                  </p>
                </div>
                <p :class="[
                  'font-semibold text-lg',
                  tx.type === 'income' || tx.type === 'withdrawal' ? 'text-green-500' : 'text-red-500'
                ]">
                  {{ tx.type === 'income' || tx.type === 'withdrawal' ? '+' : '-' }}{{ formatCurrency(tx.amount) }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <EmptyState
        v-else
        icon="📝"
        title="Tidak Ada Transaksi"
        description="Belum ada transaksi yang sesuai dengan filter"
        action-text="Tambah Transaksi"
        @action="openAddModal"
      />
    </div>

    <!-- Modal Form -->
    <Modal
      :show="showModal"
      :title="editingId ? 'Edit Transaksi' : 'Tambah Transaksi'"
      size="lg"
      @close="showModal = false"
    >
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <!-- Tipe Transaksi -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tipe Transaksi
          </label>
          <div class="grid grid-cols-5 gap-2">
            <button
              type="button"
              @click="form.type = 'expense'"
              :class="[
                'px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all',
                form.type === 'expense'
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
              ]"
            >
              Pengeluaran
            </button>
            <button
              type="button"
              @click="form.type = 'income'"
              :class="[
                'px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all',
                form.type === 'income'
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
              ]"
            >
              Pemasukan
            </button>
            <button
              type="button"
              @click="form.type = 'transfer'"
              :class="[
                'px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all',
                form.type === 'transfer'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
              ]"
            >
              Transfer
            </button>
            <button
              type="button"
              @click="form.type = 'saving'"
              :class="[
                'px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all',
                form.type === 'saving'
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
              ]"
            >
              Tabungan
            </button>
            <button
              type="button"
              @click="form.type = 'withdrawal'"
              :class="[
                'px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all',
                form.type === 'withdrawal'
                  ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
              ]"
            >
              Tarik Dana
            </button>
          </div>
        </div>

        <!-- Nominal -->
        <CurrencyInput
          v-model="form.amount"
          label="Nominal"
          :required="true"
          :error="formErrors.amount"
        />

        <!-- Dompet -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {{ form.type === 'transfer' ? 'Dari Dompet' : 'Dompet' }} <span class="text-red-500">*</span>
          </label>
          <select
            v-model="form.walletId"
            class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            :class="formErrors.walletId ? 'border-red-500' : 'border-gray-300'"
          >
            <option value="">Pilih dompet</option>
            <option v-for="wallet in walletsStore.wallets" :key="wallet.id" :value="wallet.id">
              {{ wallet.icon }} {{ wallet.name }} ({{ formatCurrency(transactionsStore.getWalletBalance(wallet.id)) }})
            </option>
          </select>
          <p v-if="formErrors.walletId" class="text-sm text-red-500 mt-1">
            {{ formErrors.walletId }}
          </p>
        </div>

        <!-- Ke Dompet (untuk transfer) -->
        <div v-if="form.type === 'transfer'">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Ke Dompet <span class="text-red-500">*</span>
          </label>
          <select
            v-model="form.toWalletId"
            class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            :class="formErrors.toWalletId ? 'border-red-500' : 'border-gray-300'"
          >
            <option value="">Pilih dompet tujuan</option>
            <option 
              v-for="wallet in walletsStore.wallets" 
              :key="wallet.id" 
              :value="wallet.id"
              :disabled="wallet.id === form.walletId"
            >
              {{ wallet.icon }} {{ wallet.name }}
            </option>
          </select>
          <p v-if="formErrors.toWalletId" class="text-sm text-red-500 mt-1">
            {{ formErrors.toWalletId }}
          </p>
        </div>

        <!-- Kategori (untuk income/expense) -->
        <div v-if="form.type === 'income' || form.type === 'expense'">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Kategori <span class="text-red-500">*</span>
          </label>
          <select
            v-model="form.categoryId"
            class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            :class="formErrors.categoryId ? 'border-red-500' : 'border-gray-300'"
          >
            <option value="">Pilih kategori</option>
            <option v-for="category in categories" :key="category.id" :value="category.id">
              {{ category.icon }} {{ category.name }}
            </option>
          </select>
          <p v-if="formErrors.categoryId" class="text-sm text-red-500 mt-1">
            {{ formErrors.categoryId }}
          </p>
        </div>

        <!-- Goal (untuk saving dan withdrawal) -->
        <div v-if="form.type === 'saving' || form.type === 'withdrawal'">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {{ form.type === 'saving' ? 'Tujuan Tabungan' : 'Tarik Dana dari Goal' }} <span class="text-red-500">*</span>
          </label>
          <select
            v-model="form.goalId"
            class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="">Pilih goal</option>
            <option v-for="goal in goalsStore.activeGoals" :key="goal.id" :value="goal.id">
              {{ goal.icon }} {{ goal.name }}
            </option>
          </select>
        </div>

        <!-- Tanggal -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tanggal
          </label>
          <input
            v-model="form.date"
            type="date"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <!-- Catatan -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Catatan (Opsional)
          </label>
          <textarea
            v-model="form.note"
            rows="3"
            placeholder="Tambahkan catatan..."
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          ></textarea>
        </div>
      </form>

      <template #footer>
        <button
          v-if="editingId"
          type="button"
          @click="handleDelete(editingId)"
          class="mr-auto px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          Hapus
        </button>
        <button
          type="button"
          @click="showModal = false"
          class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          Batal
        </button>
        <button
          type="button"
          @click="handleSubmit"
          class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          {{ editingId ? 'Perbarui' : 'Simpan' }}
        </button>
      </template>
    </Modal>
  </div>
</template>
