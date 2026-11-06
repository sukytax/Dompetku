<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGoalsStore } from '@/stores/goals'
import { formatCurrency } from '@/utils/currency'
import { formatDate } from '@/utils/date'
import { useToast } from '@/composables/useToast'
import Modal from '@/components/Modal.vue'
import CurrencyInput from '@/components/CurrencyInput.vue'
import ProgressBar from '@/components/ProgressBar.vue'
import EmptyState from '@/components/EmptyState.vue'

const router = useRouter()
const goalsStore = useGoalsStore()
const toast = useToast()

const showModal = ref(false)
const editingId = ref<string | null>(null)
const activeTab = ref<'active' | 'completed' | 'archived'>('active')

const form = ref({
  name: '',
  targetAmount: 0,
  deadline: '',
  icon: '🎯',
  color: '#3B82F6',
  note: ''
})

const formErrors = ref({
  name: '',
  targetAmount: ''
})

const availableIcons = ['🎯', '💰', '🏠', '🚗', '✈️', '📱', '💻', '🎓', '💍', '🎉']
const availableColors = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
  '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'
]

const filteredGoals = computed(() => {
  if (activeTab.value === 'active') return goalsStore.activeGoals
  if (activeTab.value === 'completed') return goalsStore.completedGoals
  return goalsStore.archivedGoals
})

function openAddModal() {
  editingId.value = null
  form.value = {
    name: '',
    targetAmount: 0,
    deadline: '',
    icon: '🎯',
    color: '#3B82F6',
    note: ''
  }
  formErrors.value = { name: '', targetAmount: '' }
  showModal.value = true
}

function openEditModal(goalId: string) {
  const goal = goalsStore.getGoalById(goalId)
  if (!goal) return

  editingId.value = goalId
  form.value = {
    name: goal.name,
    targetAmount: goal.targetAmount,
    deadline: goal.deadline || '',
    icon: goal.icon,
    color: goal.color,
    note: goal.note || ''
  }
  formErrors.value = { name: '', targetAmount: '' }
  showModal.value = true
}

function validateForm() {
  let valid = true
  formErrors.value = { name: '', targetAmount: '' }

  if (!form.value.name.trim()) {
    formErrors.value.name = 'Nama goal wajib diisi'
    valid = false
  }

  if (form.value.targetAmount <= 0) {
    formErrors.value.targetAmount = 'Target harus lebih dari 0'
    valid = false
  }

  return valid
}

function handleSubmit() {
  if (!validateForm()) return

  try {
    if (editingId.value) {
      goalsStore.updateGoal(editingId.value, {
        name: form.value.name,
        targetAmount: form.value.targetAmount,
        deadline: form.value.deadline || undefined,
        icon: form.value.icon,
        color: form.value.color,
        note: form.value.note || undefined
      })
      toast.success('Goal berhasil diperbarui')
    } else {
      goalsStore.addGoal({
        name: form.value.name,
        targetAmount: form.value.targetAmount,
        deadline: form.value.deadline || undefined,
        icon: form.value.icon,
        color: form.value.color,
        note: form.value.note || undefined
      })
      toast.success('Goal berhasil ditambahkan')
    }
    showModal.value = false
  } catch (error) {
    toast.error('Gagal menyimpan goal')
  }
}

function handleArchive(goalId: string) {
  const goal = goalsStore.getGoalById(goalId)
  if (!goal) return

  if (confirm(`Arsipkan goal "${goal.name}"?`)) {
    goalsStore.updateGoal(goalId, { status: 'archived' })
    toast.success('Goal berhasil diarsipkan')
  }
}

function handleDelete(goalId: string) {
  const goal = goalsStore.getGoalById(goalId)
  if (!goal) return

  if (confirm(`Yakin ingin menghapus goal "${goal.name}"? Riwayat tabungan akan tetap ada.`)) {
    goalsStore.deleteGoal(goalId)
    toast.success('Goal berhasil dihapus')
  }
}

function goToDetail(goalId: string) {
  router.push(`/goals/${goalId}`)
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <div class="bg-white dark:bg-gray-800 border-b dark:border-gray-700 p-6">
      <div class="max-w-7xl mx-auto">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Goals</h1>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Tujuan menabung Anda
            </p>
          </div>
          <button
            @click="openAddModal"
            class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            + Tambah Goal
          </button>
        </div>

        <!-- Tabs -->
        <div class="flex gap-4">
          <button
            @click="activeTab = 'active'"
            :class="[
              'pb-2 px-1 font-medium border-b-2 transition-colors',
              activeTab === 'active'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            ]"
          >
            Aktif ({{ goalsStore.activeGoals.length }})
          </button>
          <button
            @click="activeTab = 'completed'"
            :class="[
              'pb-2 px-1 font-medium border-b-2 transition-colors',
              activeTab === 'completed'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            ]"
          >
            Tercapai ({{ goalsStore.completedGoals.length }})
          </button>
          <button
            @click="activeTab = 'archived'"
            :class="[
              'pb-2 px-1 font-medium border-b-2 transition-colors',
              activeTab === 'archived'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            ]"
          >
            Arsip ({{ goalsStore.archivedGoals.length }})
          </button>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="p-6 max-w-7xl mx-auto">
      <div v-if="filteredGoals.length > 0" class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="goal in filteredGoals"
          :key="goal.id"
          class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
          @click="goToDetail(goal.id)"
        >
          <div class="flex items-start justify-between mb-4">
            <div class="flex items-center gap-3">
              <div
                class="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                :style="{ backgroundColor: goal.color + '20' }"
              >
                {{ goal.icon }}
              </div>
              <div>
                <h3 class="font-semibold text-gray-900 dark:text-white">
                  {{ goal.name }}
                </h3>
                <p v-if="goal.deadline" class="text-xs text-gray-500 dark:text-gray-400">
                  Target: {{ formatDate(goal.deadline, 'short') }}
                </p>
              </div>
            </div>
          </div>

          <div class="mb-4">
            <div class="flex justify-between text-sm mb-2">
              <span class="text-gray-600 dark:text-gray-400">Terkumpul</span>
              <span class="font-medium text-gray-900 dark:text-white">
                {{ formatCurrency(goalsStore.getGoalSavings(goal.id)) }}
              </span>
            </div>
            <div class="flex justify-between text-sm mb-3">
              <span class="text-gray-600 dark:text-gray-400">Target</span>
              <span class="font-medium text-gray-900 dark:text-white">
                {{ formatCurrency(goal.targetAmount) }}
              </span>
            </div>
            <ProgressBar
              :percentage="goalsStore.getGoalProgress(goal.id)?.percentage || 0"
              :color="goal.color"
              :show-label="true"
            />
          </div>

          <div class="flex gap-2" @click.stop>
            <button
              @click="openEditModal(goal.id)"
              class="flex-1 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Edit
            </button>
            <button
              v-if="goal.status === 'active'"
              @click="handleArchive(goal.id)"
              class="flex-1 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Arsipkan
            </button>
          </div>
        </div>
      </div>

      <EmptyState
        v-else
        icon="🎯"
        :title="`Belum Ada Goal ${activeTab === 'completed' ? 'Tercapai' : activeTab === 'archived' ? 'Diarsipkan' : ''}`"
        :description="activeTab === 'active' ? 'Buat goal pertama Anda untuk mulai menabung' : 'Tidak ada goal di kategori ini'"
        :action-text="activeTab === 'active' ? 'Tambah Goal' : undefined"
        @action="openAddModal"
      />
    </div>

    <!-- Modal Form -->
    <Modal
      :show="showModal"
      :title="editingId ? 'Edit Goal' : 'Tambah Goal'"
      @close="showModal = false"
    >
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <!-- Nama -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Nama Goal <span class="text-red-500">*</span>
          </label>
          <input
            v-model="form.name"
            type="text"
            placeholder="Contoh: Beli Laptop, Liburan Bali"
            class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            :class="formErrors.name ? 'border-red-500' : 'border-gray-300'"
          />
          <p v-if="formErrors.name" class="text-sm text-red-500 mt-1">
            {{ formErrors.name }}
          </p>
        </div>

        <!-- Target Amount -->
        <CurrencyInput
          v-model="form.targetAmount"
          label="Target Nominal"
          :required="true"
          :error="formErrors.targetAmount"
        />

        <!-- Deadline -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tenggat (Opsional)
          </label>
          <input
            v-model="form.deadline"
            type="date"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
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

        <!-- Note -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Catatan (Opsional)
          </label>
          <textarea
            v-model="form.note"
            rows="3"
            placeholder="Tambahkan catatan tentang goal ini..."
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          ></textarea>
        </div>
      </form>

      <template #footer>
        <button
          v-if="editingId"
          type="button"
          @click="handleDelete(editingId); showModal = false"
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
