<script setup lang="ts">
import { ref, computed } from 'vue'
import { useWalletsStore } from '@/stores/wallets'
import { useTransactionsStore } from '@/stores/transactions'
import { formatCurrency } from '@/utils/currency'
import { useToast } from '@/composables/useToast'
import Modal from '@/components/Modal.vue'
import EmptyState from '@/components/EmptyState.vue'

const walletsStore = useWalletsStore()
const transactionsStore = useTransactionsStore()
const toast = useToast()

const showModal = ref(false)
const editingId = ref<string | null>(null)

const form = ref({
  name: '',
  icon: '👛',
  color: '#3B82F6',
  initialBalance: 0
})

const formErrors = ref({
  name: '',
  initialBalance: ''
})

const availableIcons = ['👛', '💳', '🏦', '💰', '💵', '💴', '💶', '💷', '🪙', '💸']
const availableColors = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // yellow
  '#EF4444', // red
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#F97316', // orange
]

const wallets = computed(() => walletsStore.wallets)

function openAddModal() {
  editingId.value = null
  form.value = {
    name: '',
    icon: '👛',
    color: '#3B82F6',
    initialBalance: 0
  }
  formErrors.value = { name: '', initialBalance: '' }
  showModal.value = true
}

function openEditModal(walletId: string) {
  const wallet = walletsStore.getWalletById(walletId)
  if (!wallet) return
  
  editingId.value = walletId
  form.value = {
    name: wallet.name,
    icon: wallet.icon,
    color: wallet.color,
    initialBalance: wallet.initialBalance
  }
  formErrors.value = { name: '', initialBalance: '' }
  showModal.value = true
}

function validateForm() {
  let valid = true
  formErrors.value = { name: '', initialBalance: '' }
  
  if (!form.value.name.trim()) {
    formErrors.value.name = 'Nama dompet wajib diisi'
    valid = false
  }
  
  if (form.value.initialBalance < 0) {
    formErrors.value.initialBalance = 'Saldo awal tidak boleh negatif'
    valid = false
  }
  
  return valid
}

function handleSubmit() {
  if (!validateForm()) return
  
  try {
    if (editingId.value) {
      walletsStore.updateWallet(editingId.value, {
        name: form.value.name,
        icon: form.value.icon,
        color: form.value.color,
        initialBalance: form.value.initialBalance
      })
      toast.success('Dompet berhasil diperbarui')
    } else {
      walletsStore.addWallet({
        name: form.value.name,
        icon: form.value.icon,
        color: form.value.color,
        initialBalance: form.value.initialBalance
      })
      toast.success('Dompet berhasil ditambahkan')
    }
    showModal.value = false
  } catch (error) {
    toast.error('Gagal menyimpan dompet')
  }
}

function handleDelete(walletId: string) {
  const wallet = walletsStore.getWalletById(walletId)
  if (!wallet) return
  
  // Cek apakah ada transaksi yang menggunakan dompet ini
  const transactions = transactionsStore.getTransactionsByWallet(walletId)
  if (transactions.length > 0) {
    toast.error('Tidak dapat menghapus dompet yang masih memiliki transaksi')
    return
  }
  
  if (confirm(`Yakin ingin menghapus dompet "${wallet.name}"?`)) {
    walletsStore.deleteWallet(walletId)
    toast.success('Dompet berhasil dihapus')
  }
}

function getWalletBalance(walletId: string) {
  return transactionsStore.getWalletBalance(walletId)
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <div class="bg-white dark:bg-gray-800 border-b dark:border-gray-700 p-6">
      <div class="max-w-7xl mx-auto flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Dompet</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Kelola dompet dan akun Anda
          </p>
        </div>
        <button
          @click="openAddModal"
          class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          + Tambah Dompet
        </button>
      </div>
    </div>
    
    <!-- Content -->
    <div class="p-6 max-w-7xl mx-auto">
      <div v-if="wallets.length > 0" class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="wallet in wallets"
          :key="wallet.id"
          class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <div class="flex items-start justify-between mb-4">
            <div class="flex items-center gap-3">
              <div
                class="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                :style="{ backgroundColor: wallet.color + '20' }"
              >
                {{ wallet.icon }}
              </div>
              <div>
                <h3 class="font-semibold text-gray-900 dark:text-white">
                  {{ wallet.name }}
                </h3>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  Saldo Awal: {{ formatCurrency(wallet.initialBalance) }}
                </p>
              </div>
            </div>
          </div>
          
          <div class="mb-4">
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">Saldo Saat Ini</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ formatCurrency(getWalletBalance(wallet.id)) }}
            </p>
          </div>
          
          <div class="flex gap-2">
            <button
              @click="openEditModal(wallet.id)"
              class="flex-1 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Edit
            </button>
            <button
              @click="handleDelete(wallet.id)"
              class="flex-1 px-3 py-2 text-sm bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
            >
              Hapus
            </button>
          </div>
        </div>
      </div>
      
      <EmptyState
        v-else
        icon="👛"
        title="Belum Ada Dompet"
        description="Tambahkan dompet pertama Anda untuk mulai mencatat transaksi"
        action-text="Tambah Dompet"
        @action="openAddModal"
      />
    </div>
    
    <!-- Modal Form -->
    <Modal
      :show="showModal"
      :title="editingId ? 'Edit Dompet' : 'Tambah Dompet'"
      @close="showModal = false"
    >
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <!-- Nama -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Nama Dompet <span class="text-red-500">*</span>
          </label>
          <input
            v-model="form.name"
            type="text"
            placeholder="Contoh: BCA, GoPay, Tunai"
            class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            :class="formErrors.name ? 'border-red-500' : 'border-gray-300'"
          />
          <p v-if="formErrors.name" class="text-sm text-red-500 mt-1">
            {{ formErrors.name }}
          </p>
        </div>
        
        <!-- Icon -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Ikon
          </label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="icon in availableIcons"
              :key="icon"
              type="button"
              @click="form.icon = icon"
              :class="[
                'w-12 h-12 text-2xl rounded-lg border-2 transition-all',
                form.icon === icon
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
              ]"
            >
              {{ icon }}
            </button>
          </div>
        </div>
        
        <!-- Color -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Warna
          </label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="color in availableColors"
              :key="color"
              type="button"
              @click="form.color = color"
              :class="[
                'w-10 h-10 rounded-full border-2 transition-all',
                form.color === color
                  ? 'border-gray-900 dark:border-white scale-110'
                  : 'border-transparent'
              ]"
              :style="{ backgroundColor: color }"
            ></button>
          </div>
        </div>
        
        <!-- Saldo Awal -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Saldo Awal
          </label>
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">Rp</span>
            <input
              v-model.number="form.initialBalance"
              type="number"
              min="0"
              placeholder="0"
              class="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              :class="formErrors.initialBalance ? 'border-red-500' : 'border-gray-300'"
            />
          </div>
          <p v-if="formErrors.initialBalance" class="text-sm text-red-500 mt-1">
            {{ formErrors.initialBalance }}
          </p>
        </div>
      </form>
      
      <template #footer>
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
