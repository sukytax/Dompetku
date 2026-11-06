<script setup lang="ts">
import { ref, computed } from 'vue'
import { useBudgetsStore } from '@/stores/budgets'
import { useCategoriesStore } from '@/stores/categories'
import { formatCurrency } from '@/utils/currency'
import { toMonthString, formatDate, parseMonthString } from '@/utils/date'
import { useToast } from '@/composables/useToast'
import Modal from '@/components/Modal.vue'
import CurrencyInput from '@/components/CurrencyInput.vue'
import EmptyState from '@/components/EmptyState.vue'

const budgetsStore = useBudgetsStore()
const categoriesStore = useCategoriesStore()
const toast = useToast()

const showModal = ref(false)
const selectedMonth = ref(toMonthString())

const form = ref({
  categoryId: '',
  limit: 0
})

const formErrors = ref({
  categoryId: '',
  limit: ''
})

const monthBudgets = computed(() => {
  return budgetsStore.getMonthBudgets(selectedMonth.value)
})

const availableCategories = computed(() => {
  // Kategori yang belum diatur budgetnya di bulan ini
  const usedCategoryIds = monthBudgets.value.map(b => b.categoryId)
  return categoriesStore.expenseCategories.filter(
    c => !usedCategoryIds.includes(c.id)
  )
})

// Saat mengedit, kategori yang sedang dipakai tetap harus muncul di pilihan.
const formCategories = computed(() => {
  if (!form.value.categoryId || availableCategories.value.some(c => c.id === form.value.categoryId)) {
    return availableCategories.value
  }
  const current = categoriesStore.getCategoryById(form.value.categoryId)
  return current ? [current, ...availableCategories.value] : availableCategories.value
})

function openAddModal() {
  form.value = {
    categoryId: availableCategories.value[0]?.id || '',
    limit: 0
  }
  formErrors.value = { categoryId: '', limit: '' }
  showModal.value = true
}

function openEditModal(budget: any) {
  form.value = {
    categoryId: budget.categoryId,
    limit: budget.limit
  }
  formErrors.value = { categoryId: '', limit: '' }
  showModal.value = true
}

function validateForm() {
  let valid = true
  formErrors.value = { categoryId: '', limit: '' }

  if (!form.value.categoryId) {
    formErrors.value.categoryId = 'Kategori wajib dipilih'
    valid = false
  }

  if (form.value.limit <= 0) {
    formErrors.value.limit = 'Limit harus lebih dari 0'
    valid = false
  }

  return valid
}

function handleSubmit() {
  if (!validateForm()) return

  try {
    budgetsStore.setBudget(form.value.categoryId, selectedMonth.value, form.value.limit)
    toast.success('Anggaran berhasil disimpan')
    showModal.value = false
  } catch (error) {
    toast.error('Gagal menyimpan anggaran')
  }
}

function handleDelete(budgetId: string) {
  if (confirm('Yakin ingin menghapus anggaran ini?')) {
    budgetsStore.deleteBudget(budgetId)
    toast.success('Anggaran berhasil dihapus')
  }
}

function getCategoryName(categoryId: string) {
  return categoriesStore.getCategoryById(categoryId)?.name || 'Kategori'
}

function getCategoryIcon(categoryId: string) {
  return categoriesStore.getCategoryById(categoryId)?.icon || '📦'
}

function getStatusColor(status: string) {
  switch (status) {
    case 'danger': return 'text-red-500'
    case 'warning': return 'text-yellow-500'
    default: return 'text-green-500'
  }
}

function getStatusText(status: string) {
  switch (status) {
    case 'danger': return 'Melebihi anggaran'
    case 'warning': return 'Hampir habis'
    default: return 'Aman'
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <div class="bg-white dark:bg-gray-800 border-b dark:border-gray-700 p-6">
      <div class="max-w-7xl mx-auto">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Anggaran Bulanan</h1>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Atur batas pengeluaran per kategori
            </p>
          </div>
          <button
            @click="openAddModal"
            :disabled="availableCategories.length === 0"
            class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            + Tambah Anggaran
          </button>
        </div>

        <!-- Month Selector -->
        <div class="flex items-center gap-3">
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
            Bulan:
          </label>
          <input
            v-model="selectedMonth"
            type="month"
            class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="p-6 max-w-7xl mx-auto">
      <div v-if="monthBudgets.length > 0" class="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead class="bg-gray-50 dark:bg-gray-700/50 border-b dark:border-gray-700">
              <tr>
                <th class="px-6 py-4 text-xs font-semibold uppercase text-gray-500 dark:text-gray-300">Pengeluaran tetap</th>
                <th class="px-6 py-4 text-xs font-semibold uppercase text-gray-500 dark:text-gray-300">Anggaran</th>
                <th class="px-6 py-4 text-xs font-semibold uppercase text-gray-500 dark:text-gray-300">Terpakai</th>
                <th class="px-6 py-4 text-xs font-semibold uppercase text-gray-500 dark:text-gray-300">Sisa</th>
                <th class="px-6 py-4 text-xs font-semibold uppercase text-gray-500 dark:text-gray-300">Status</th>
                <th class="px-6 py-4 text-right text-xs font-semibold uppercase text-gray-500 dark:text-gray-300">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y dark:divide-gray-700">
              <tr v-for="budget in monthBudgets" :key="budget.id" class="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <span class="text-2xl">{{ getCategoryIcon(budget.categoryId) }}</span>
                    <span class="font-medium text-gray-900 dark:text-white">{{ getCategoryName(budget.categoryId) }}</span>
                  </div>
                </td>
                <td class="px-6 py-4 font-medium text-gray-900 dark:text-white">{{ formatCurrency(budget.limit) }}</td>
                <td class="px-6 py-4 text-gray-600 dark:text-gray-300">{{ formatCurrency(budget.progress?.spent || 0) }}</td>
                <td :class="['px-6 py-4 font-semibold', (budget.progress?.remaining || 0) > 0 ? 'text-green-500' : 'text-red-500']">
                  {{ formatCurrency(budget.progress?.remaining || 0) }}
                </td>
                <td :class="['px-6 py-4 text-sm font-medium', getStatusColor(budget.progress?.status || 'safe')]">
                  {{ getStatusText(budget.progress?.status || 'safe') }}
                </td>
                <td class="px-6 py-4 text-right whitespace-nowrap">
                  <button @click="openEditModal(budget)" class="text-blue-500 hover:text-blue-700 mr-3">Edit</button>
                  <button @click="handleDelete(budget.id)" class="text-red-500 hover:text-red-700">Hapus</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <EmptyState
        v-else
        icon="💰"
        title="Belum Ada Anggaran"
        description="Mulai atur anggaran bulanan untuk mengontrol pengeluaran Anda"
        action-text="Tambah Anggaran"
        @action="openAddModal"
      />
    </div>

    <!-- Modal Form -->
    <Modal
      :show="showModal"
      title="Atur Anggaran"
      @close="showModal = false"
    >
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <!-- Kategori -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Kategori <span class="text-red-500">*</span>
          </label>
          <select
            v-model="form.categoryId"
            :disabled="availableCategories.length === 0"
            class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50"
            :class="formErrors.categoryId ? 'border-red-500' : 'border-gray-300'"
          >
            <option value="">Pilih kategori</option>
            <option v-for="category in formCategories" :key="category.id" :value="category.id">
              {{ category.icon }} {{ category.name }}
            </option>
          </select>
          <p v-if="formErrors.categoryId" class="text-sm text-red-500 mt-1">
            {{ formErrors.categoryId }}
          </p>
          <p v-if="availableCategories.length === 0" class="text-sm text-gray-500 mt-1">
            Semua kategori sudah diatur anggarannya
          </p>
        </div>

        <!-- Limit -->
        <CurrencyInput
          v-model="form.limit"
          label="Batas Anggaran"
          :required="true"
          :error="formErrors.limit"
          placeholder="Masukkan batas anggaran"
        />

        <div class="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p class="text-sm text-blue-800 dark:text-blue-200">
            💡 Anggaran ini berlaku untuk bulan {{ formatDate(parseMonthString(selectedMonth), 'monthYear') }}
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
          Simpan
        </button>
      </template>
    </Modal>
  </div>
</template>
