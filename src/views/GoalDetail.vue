<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGoalsStore } from '@/stores/goals'
import { useTransactionsStore } from '@/stores/transactions'
import { useWalletsStore } from '@/stores/wallets'
import { formatCurrency } from '@/utils/currency'
import { formatDate } from '@/utils/date'
import { useToast } from '@/composables/useToast'
import Modal from '@/components/Modal.vue'
import CurrencyInput from '@/components/CurrencyInput.vue'
import ProgressBar from '@/components/ProgressBar.vue'

const route = useRoute()
const router = useRouter()
const goalsStore = useGoalsStore()
const transactionsStore = useTransactionsStore()
const walletsStore = useWalletsStore()
const toast = useToast()

const goalId = route.params.id as string
const goal = computed(() => goalsStore.getGoalById(goalId))
const progress = computed(() => goalsStore.getGoalProgress(goalId))
const history = computed(() => goalsStore.getGoalHistory(goalId))

const showDepositModal = ref(false)
const showWithdrawModal = ref(false)

const depositForm = ref({
  amount: 0,
  walletId: '',
  note: ''
})

const depositErrors = ref({
  amount: '',
  walletId: ''
})

// Redirect jika goal tidak ditemukan
if (!goal.value) {
  router.push('/goals')
}

function openDepositModal() {
  depositForm.value = {
    amount: 0,
    walletId: walletsStore.wallets[0]?.id || '',
    note: ''
  }
  depositErrors.value = { amount: '', walletId: '' }
  showDepositModal.value = true
}

function openWithdrawModal() {
  depositForm.value = {
    amount: 0,
    walletId: walletsStore.wallets[0]?.id || '',
    note: ''
  }
  depositErrors.value = { amount: '', walletId: '' }
  showWithdrawModal.value = true
}

function validateDepositForm() {
  let valid = true
  depositErrors.value = { amount: '', walletId: '' }

  if (depositForm.value.amount <= 0) {
    depositErrors.value.amount = 'Nominal harus lebih dari 0'
    valid = false
  }

  if (!depositForm.value.walletId) {
    depositErrors.value.walletId = 'Dompet wajib dipilih'
    valid = false
  }

  return valid
}

function handleDeposit() {
  if (!validateDepositForm()) return

  try {
    // Validasi saldo
    if (!transactionsStore.validateBalance(depositForm.value.walletId, depositForm.value.amount)) {
      toast.error('Saldo dompet tidak mencukupi')
      return
    }

    // Tambah transaksi tabungan
    transactionsStore.addTransaction({
      type: 'saving',
      amount: depositForm.value.amount,
      walletId: depositForm.value.walletId,
      goalId: goalId,
      date: new Date().toISOString().split('T')[0],
      note: depositForm.value.note || undefined
    })

    // Cek apakah goal sudah tercapai
    const completed = goalsStore.checkGoalCompletion(goalId)
    
    if (completed) {
      toast.success('🎉 Selamat! Goal Anda telah tercapai!')
    } else {
      toast.success('Tabungan berhasil ditambahkan')
    }

    showDepositModal.value = false
  } catch (error: any) {
    toast.error(error.message || 'Gagal menambah tabungan')
  }
}

function handleWithdraw() {
  if (!validateDepositForm()) return

  if (!goal.value) return

  const currentSavings = goalsStore.getGoalSavings(goalId)
  
  if (depositForm.value.amount > currentSavings) {
    toast.error('Nominal melebihi tabungan yang tersedia')
    return
  }

  try {
    // Tambah transaksi withdrawal untuk mencatat penarikan dari goal
    transactionsStore.addTransaction({
      type: 'withdrawal',
      amount: depositForm.value.amount,
      walletId: depositForm.value.walletId,
      goalId: goalId,
      date: new Date().toISOString().split('T')[0],
      note: depositForm.value.note || `Tarik dana dari goal: ${goal.value.name}`
    })

    // Cek apakah goal perlu kembali ke status active
    goalsStore.checkGoalCompletion(goalId)

    toast.success('Dana berhasil ditarik')
    showWithdrawModal.value = false
  } catch (error: any) {
    toast.error(error.message || 'Gagal menarik dana')
  }
}

function getWalletName(walletId: string) {
  return walletsStore.getWalletById(walletId)?.name || 'Dompet'
}
</script>

<template>
  <div v-if="goal" class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <div 
      class="p-6 md:p-8 text-white"
      :style="{ background: `linear-gradient(135deg, ${goal.color} 0%, ${goal.color}dd 100%)` }"
    >
      <div class="max-w-4xl mx-auto">
        <button
          @click="router.back()"
          class="mb-4 text-white/80 hover:text-white flex items-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          Kembali
        </button>

        <div class="flex items-start gap-4 mb-6">
          <div class="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-4xl">
            {{ goal.icon }}
          </div>
          <div class="flex-1">
            <h1 class="text-3xl font-bold mb-2">{{ goal.name }}</h1>
            <p v-if="goal.deadline" class="text-white/80">
              Target: {{ formatDate(goal.deadline, 'long') }}
            </p>
            <p v-if="goal.note" class="text-white/80 mt-1">
              {{ goal.note }}
            </p>
          </div>
        </div>

        <!-- Progress Card -->
        <div class="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
          <div class="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p class="text-sm text-white/70 mb-1">Terkumpul</p>
              <p class="text-2xl font-bold">{{ formatCurrency(progress?.saved || 0) }}</p>
            </div>
            <div>
              <p class="text-sm text-white/70 mb-1">Target</p>
              <p class="text-2xl font-bold">{{ formatCurrency(goal.targetAmount) }}</p>
            </div>
          </div>

          <ProgressBar
            :percentage="progress?.percentage || 0"
            color="white"
            :show-label="true"
          />

          <div class="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p class="text-white/70">Sisa</p>
              <p class="font-semibold">{{ formatCurrency(progress?.remaining || 0) }}</p>
            </div>
            <div v-if="progress?.monthlyTarget && goal.deadline">
              <p class="text-white/70">Per Bulan</p>
              <p class="font-semibold">{{ formatCurrency(progress.monthlyTarget) }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="p-6 max-w-4xl mx-auto">
      <div class="grid grid-cols-2 gap-4 mb-6">
        <button
          @click="openDepositModal"
          class="px-6 py-4 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium"
        >
          💰 Tambah Tabungan
        </button>
        <button
          @click="openWithdrawModal"
          class="px-6 py-4 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
        >
          💸 Tarik Dana
        </button>
      </div>

      <!-- History -->
      <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Riwayat Setoran
        </h2>

        <div v-if="history.length > 0" class="space-y-3">
          <div
            v-for="tx in history"
            :key="tx.id"
            class="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700"
          >
            <div>
              <p class="font-medium text-gray-900 dark:text-white">
                {{ getWalletName(tx.walletId) }}
                <span v-if="tx.type === 'withdrawal'" class="text-xs text-red-500 ml-2">
                  (Tarik Dana)
                </span>
              </p>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ formatDate(tx.date, 'long') }}
                <span v-if="tx.note"> • {{ tx.note }}</span>
              </p>
            </div>
            <p :class="[
              'text-lg font-semibold',
              tx.type === 'withdrawal' ? 'text-red-500' : 'text-green-500'
            ]">
              {{ tx.type === 'withdrawal' ? '-' : '+' }}{{ formatCurrency(tx.amount) }}
            </p>
          </div>
        </div>

        <div v-else class="text-center py-8 text-gray-500 dark:text-gray-400">
          Belum ada setoran
        </div>
      </div>
    </div>

    <!-- Deposit Modal -->
    <Modal
      :show="showDepositModal"
      title="Tambah Tabungan"
      @close="showDepositModal = false"
    >
      <form @submit.prevent="handleDeposit" class="space-y-4">
        <CurrencyInput
          v-model="depositForm.amount"
          label="Nominal"
          :required="true"
          :error="depositErrors.amount"
        />

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Dari Dompet <span class="text-red-500">*</span>
          </label>
          <select
            v-model="depositForm.walletId"
            class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            :class="depositErrors.walletId ? 'border-red-500' : 'border-gray-300'"
          >
            <option value="">Pilih dompet</option>
            <option v-for="wallet in walletsStore.wallets" :key="wallet.id" :value="wallet.id">
              {{ wallet.icon }} {{ wallet.name }} ({{ formatCurrency(transactionsStore.getWalletBalance(wallet.id)) }})
            </option>
          </select>
          <p v-if="depositErrors.walletId" class="text-sm text-red-500 mt-1">
            {{ depositErrors.walletId }}
          </p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Catatan (Opsional)
          </label>
          <input
            v-model="depositForm.note"
            type="text"
            placeholder="Tambahkan catatan..."
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
      </form>

      <template #footer>
        <button
          type="button"
          @click="showDepositModal = false"
          class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          Batal
        </button>
        <button
          type="button"
          @click="handleDeposit"
          class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Simpan
        </button>
      </template>
    </Modal>

    <!-- Withdraw Modal -->
    <Modal
      :show="showWithdrawModal"
      title="Tarik Dana"
      @close="showWithdrawModal = false"
    >
      <div class="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <p class="text-sm text-yellow-800 dark:text-yellow-200">
          Dana yang ditarik akan dikembalikan ke dompet yang dipilih
        </p>
      </div>

      <form @submit.prevent="handleWithdraw" class="space-y-4">
        <CurrencyInput
          v-model="depositForm.amount"
          label="Nominal"
          :required="true"
          :error="depositErrors.amount"
        />

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Ke Dompet <span class="text-red-500">*</span>
          </label>
          <select
            v-model="depositForm.walletId"
            class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            :class="depositErrors.walletId ? 'border-red-500' : 'border-gray-300'"
          >
            <option value="">Pilih dompet</option>
            <option v-for="wallet in walletsStore.wallets" :key="wallet.id" :value="wallet.id">
              {{ wallet.icon }} {{ wallet.name }}
            </option>
          </select>
          <p v-if="depositErrors.walletId" class="text-sm text-red-500 mt-1">
            {{ depositErrors.walletId }}
          </p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Catatan (Opsional)
          </label>
          <input
            v-model="depositForm.note"
            type="text"
            placeholder="Tambahkan catatan..."
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
      </form>

      <template #footer>
        <button
          type="button"
          @click="showWithdrawModal = false"
          class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          Batal
        </button>
        <button
          type="button"
          @click="handleWithdraw"
          class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Tarik Dana
        </button>
      </template>
    </Modal>
  </div>
</template>
