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
import type { Goal } from '@/types'

const router = useRouter()
const goalsStore = useGoalsStore()
const toast = useToast()

const showModal = ref(false)
const editingId = ref<string | null>(null)
const activeTab = ref<'goals' | 'archived'>('goals')

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

function isGoalAchieved(goal: Goal): boolean {
  if (goal.status === 'completed') return true
  const saved = goalsStore.getGoalSavings(goal.id)
  return saved >= goal.targetAmount
}

function getGoalRemaining(goalId: string, targetAmount: number): number {
  const saved = goalsStore.getGoalSavings(goalId)
  return Math.max(0, targetAmount - saved)
}

const nonArchivedGoals = computed(() => {
  return goalsStore.goals.filter(g => g.status !== 'archived')
})

const ongoingGoals = computed(() => {
  return nonArchivedGoals.value.filter(g => !isGoalAchieved(g))
})

const completedGoalsList = computed(() => {
  return nonArchivedGoals.value.filter(g => isGoalAchieved(g))
})

const archivedGoalsList = computed(() => {
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
      goalsStore.checkGoalCompletion(editingId.value)
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

function handleUnarchive(goalId: string) {
  const goal = goalsStore.getGoalById(goalId)
  if (!goal) return

  goalsStore.updateGoal(goalId, { status: 'active' })
  goalsStore.checkGoalCompletion(goalId)
  toast.success('Goal berhasil diaktifkan kembali')
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
            class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium shadow-sm cursor-pointer"
          >
            + Tambah Goal
          </button>
        </div>

        <!-- Tabs: Goals (Aktif & Tercapai) dan Arsip -->
        <div class="flex gap-4">
          <button
            @click="activeTab = 'goals'"
            :class="[
              'pb-2 px-1 font-medium border-b-2 transition-colors flex items-center gap-2 cursor-pointer',
              activeTab === 'goals'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            ]"
          >
            <span>Goals</span>
            <span class="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-semibold">
              {{ nonArchivedGoals.length }}
            </span>
          </button>
          <button
            @click="activeTab = 'archived'"
            :class="[
              'pb-2 px-1 font-medium border-b-2 transition-colors flex items-center gap-2 cursor-pointer',
              activeTab === 'archived'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            ]"
          >
            <span>Arsip</span>
            <span class="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-semibold">
              {{ archivedGoalsList.length }}
            </span>
          </button>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="p-6 max-w-7xl mx-auto space-y-8">
      <!-- TAB GOALS -->
      <template v-if="activeTab === 'goals'">
        <div v-if="nonArchivedGoals.length > 0" class="space-y-8">
          <!-- 1. Goals Sedang Berjalan -->
          <div v-if="ongoingGoals.length > 0">
            <div class="flex items-center gap-2 mb-4" v-if="completedGoalsList.length > 0">
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <span>🎯</span> Sedang Berjalan
              </h2>
              <span class="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-semibold">
                {{ ongoingGoals.length }}
              </span>
            </div>

            <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div
                v-for="goal in ongoingGoals"
                :key="goal.id"
                class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                @click="goToDetail(goal.id)"
              >
                <div>
                  <div class="flex items-start justify-between mb-4">
                    <div class="flex items-center gap-3">
                      <div
                        class="w-12 h-12 rounded-full flex items-center justify-center text-2xl shrink-0"
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

                  <!-- Details / Metrics -->
                  <div class="space-y-2 mb-4">
                    <div class="flex justify-between text-sm">
                      <span class="text-gray-600 dark:text-gray-400">Terkumpul</span>
                      <span class="font-medium text-gray-900 dark:text-white">
                        {{ formatCurrency(goalsStore.getGoalSavings(goal.id)) }}
                      </span>
                    </div>
                    <div class="flex justify-between text-sm">
                      <span class="text-gray-600 dark:text-gray-400">Sisa yang harus dibayar</span>
                      <span class="font-semibold text-amber-600 dark:text-amber-400">
                        {{ formatCurrency(getGoalRemaining(goal.id, goal.targetAmount)) }}
                      </span>
                    </div>
                    <div class="flex justify-between text-sm">
                      <span class="text-gray-600 dark:text-gray-400">Target</span>
                      <span class="font-medium text-gray-900 dark:text-white">
                        {{ formatCurrency(goal.targetAmount) }}
                      </span>
                    </div>

                    <div class="pt-1">
                      <ProgressBar
                        :percentage="goalsStore.getGoalProgress(goal.id)?.percentage || 0"
                        :color="goal.color"
                        :show-label="true"
                      />
                    </div>
                  </div>
                </div>

                <div class="flex gap-2 pt-3 border-t border-gray-100 dark:border-gray-700/60" @click.stop>
                  <button
                    @click="openEditModal(goal.id)"
                    class="flex-1 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                  >
                    Edit
                  </button>
                  <button
                    @click="handleArchive(goal.id)"
                    class="flex-1 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                  >
                    Arsipkan
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 2. Goals Sudah Tercapai (Ditaruh di Bawah, Berwarna Hijau) -->
          <div v-if="completedGoalsList.length > 0">
            <div class="flex items-center gap-2 mb-4 pt-2">
              <h2 class="text-lg font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                <span>🎉</span> Sudah Tercapai
              </h2>
              <span class="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-semibold">
                {{ completedGoalsList.length }}
              </span>
            </div>

            <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div
                v-for="goal in completedGoalsList"
                :key="goal.id"
                class="bg-emerald-50/70 dark:bg-emerald-950/25 border-2 border-emerald-500/60 dark:border-emerald-500/40 rounded-xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer relative flex flex-col justify-between"
                @click="goToDetail(goal.id)"
              >
                <div>
                  <div class="flex items-start justify-between mb-4">
                    <div class="flex items-center gap-3">
                      <div class="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-2xl shrink-0">
                        {{ goal.icon }}
                      </div>
                      <div>
                        <h3 class="font-semibold text-gray-900 dark:text-white">
                          {{ goal.name }}
                        </h3>
                        <p v-if="goal.deadline" class="text-xs text-emerald-700/80 dark:text-emerald-400/80">
                          Target: {{ formatDate(goal.deadline, 'short') }}
                        </p>
                      </div>
                    </div>
                    <!-- Badge Tercapai -->
                    <span class="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white flex items-center gap-1 shadow-sm shrink-0">
                      ✓ Tercapai
                    </span>
                  </div>

                  <!-- Details / Metrics -->
                  <div class="space-y-2 mb-4">
                    <div class="flex justify-between text-sm">
                      <span class="text-gray-600 dark:text-gray-300">Terkumpul</span>
                      <span class="font-bold text-emerald-700 dark:text-emerald-300">
                        {{ formatCurrency(goalsStore.getGoalSavings(goal.id)) }}
                      </span>
                    </div>
                    <div class="flex justify-between text-sm">
                      <span class="text-gray-600 dark:text-gray-300">Sisa yang harus dibayar</span>
                      <span class="font-bold text-emerald-600 dark:text-emerald-400">
                        Rp 0 (Lunas 🎉)
                      </span>
                    </div>
                    <div class="flex justify-between text-sm">
                      <span class="text-gray-600 dark:text-gray-300">Target</span>
                      <span class="font-medium text-gray-700 dark:text-gray-300">
                        {{ formatCurrency(goal.targetAmount) }}
                      </span>
                    </div>

                    <div class="pt-1">
                      <ProgressBar
                        :percentage="100"
                        color="#10B981"
                        :show-label="true"
                      />
                    </div>
                  </div>
                </div>

                <div class="flex gap-2 pt-3 border-t border-emerald-200/60 dark:border-emerald-800/40" @click.stop>
                  <button
                    @click="openEditModal(goal.id)"
                    class="flex-1 px-3 py-2 text-sm bg-white/80 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-emerald-200 dark:border-emerald-800 rounded-lg hover:bg-white dark:hover:bg-gray-700 transition-colors cursor-pointer"
                  >
                    Edit
                  </button>
                  <button
                    @click="handleArchive(goal.id)"
                    class="flex-1 px-3 py-2 text-sm bg-white/80 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-emerald-200 dark:border-emerald-800 rounded-lg hover:bg-white dark:hover:bg-gray-700 transition-colors cursor-pointer"
                  >
                    Arsipkan
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <EmptyState
          v-else
          icon="🎯"
          title="Belum Ada Goal"
          description="Buat goal pertama Anda untuk mulai menabung"
          action-text="Tambah Goal"
          @action="openAddModal"
        />
      </template>

      <!-- TAB ARSIP -->
      <template v-else-if="activeTab === 'archived'">
        <div v-if="archivedGoalsList.length > 0" class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="goal in archivedGoalsList"
            :key="goal.id"
            class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer opacity-80 hover:opacity-100 flex flex-col justify-between"
            @click="goToDetail(goal.id)"
          >
            <div>
              <div class="flex items-start justify-between mb-4">
                <div class="flex items-center gap-3">
                  <div
                    class="w-12 h-12 rounded-full flex items-center justify-center text-2xl shrink-0"
                    :style="{ backgroundColor: goal.color + '20' }"
                  >
                    {{ goal.icon }}
                  </div>
                  <div>
                    <h3 class="font-semibold text-gray-900 dark:text-white">
                      {{ goal.name }}
                    </h3>
                    <p class="text-xs text-gray-500 dark:text-gray-400">
                      Diarsipkan
                    </p>
                  </div>
                </div>
                <span class="px-2 py-0.5 rounded text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 font-medium">
                  Arsip
                </span>
              </div>

              <!-- Details / Metrics -->
              <div class="space-y-2 mb-4">
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600 dark:text-gray-400">Terkumpul</span>
                  <span class="font-medium text-gray-900 dark:text-white">
                    {{ formatCurrency(goalsStore.getGoalSavings(goal.id)) }}
                  </span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600 dark:text-gray-400">Sisa yang harus dibayar</span>
                  <span
                    class="font-semibold"
                    :class="getGoalRemaining(goal.id, goal.targetAmount) > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'"
                  >
                    {{ getGoalRemaining(goal.id, goal.targetAmount) > 0 ? formatCurrency(getGoalRemaining(goal.id, goal.targetAmount)) : 'Rp 0 (Lunas)' }}
                  </span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600 dark:text-gray-400">Target</span>
                  <span class="font-medium text-gray-900 dark:text-white">
                    {{ formatCurrency(goal.targetAmount) }}
                  </span>
                </div>

                <div class="pt-1">
                  <ProgressBar
                    :percentage="goalsStore.getGoalProgress(goal.id)?.percentage || 0"
                    :color="goal.color"
                    :show-label="true"
                  />
                </div>
              </div>
            </div>

            <div class="flex gap-2 pt-3 border-t border-gray-100 dark:border-gray-700/60" @click.stop>
              <button
                @click="handleUnarchive(goal.id)"
                class="flex-1 px-3 py-2 text-sm bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors cursor-pointer"
              >
                Aktifkan
              </button>
              <button
                @click="handleDelete(goal.id)"
                class="flex-1 px-3 py-2 text-sm bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors cursor-pointer"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>

        <EmptyState
          v-else
          icon="📦"
          title="Belum Ada Goal Diarsipkan"
          description="Goal yang diarsipkan akan muncul di sini"
        />
      </template>
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
                'w-12 h-12 text-2xl rounded-lg border-2 transition-all cursor-pointer',
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
                'w-10 h-10 rounded-full border-2 transition-all cursor-pointer',
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
          class="mr-auto px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors cursor-pointer"
        >
          Hapus
        </button>
        <button
          type="button"
          @click="showModal = false"
          class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
        >
          Batal
        </button>
        <button
          type="button"
          @click="handleSubmit"
          class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors cursor-pointer"
        >
          {{ editingId ? 'Perbarui' : 'Simpan' }}
        </button>
      </template>
    </Modal>
  </div>
</template>
