import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Category } from '@/types'
import { generateId } from '@/utils/export'

export const useCategoriesStore = defineStore('categories', () => {
  const categories = ref<Category[]>([])

  // Kategori default
  const defaultCategories: Omit<Category, 'id'>[] = [
    // Kategori Pengeluaran
    { name: 'Makan & Minum', type: 'expense', icon: '🍽️', color: '#EF4444' },
    { name: 'Transport', type: 'expense', icon: '🚗', color: '#F97316' },
    { name: 'Belanja', type: 'expense', icon: '🛒', color: '#F59E0B' },
    { name: 'Tagihan', type: 'expense', icon: '📄', color: '#10B981' },
    { name: 'Hiburan', type: 'expense', icon: '🎮', color: '#8B5CF6' },
    { name: 'Kesehatan', type: 'expense', icon: '🏥', color: '#EC4899' },
    { name: 'Pendidikan', type: 'expense', icon: '📚', color: '#3B82F6' },
    { name: 'Lainnya', type: 'expense', icon: '📦', color: '#6B7280' },
    // Kategori Pemasukan
    { name: 'Gaji', type: 'income', icon: '💰', color: '#10B981' },
    { name: 'Bonus', type: 'income', icon: '🎁', color: '#059669' },
    { name: 'Freelance', type: 'income', icon: '💼', color: '#14B8A6' },
    { name: 'Hadiah', type: 'income', icon: '🎉', color: '#06B6D4' },
    { name: 'Lainnya', type: 'income', icon: '💵', color: '#6B7280' },
  ]

  // Load dari localStorage
  function loadCategories() {
    const saved = localStorage.getItem('dompetku-categories')
    if (saved) {
      categories.value = JSON.parse(saved)
    } else {
      // Init dengan kategori default
      categories.value = defaultCategories.map(cat => ({
        ...cat,
        id: generateId()
      }))
      saveCategories()
    }
  }

  // Simpan ke localStorage
  function saveCategories() {
    localStorage.setItem('dompetku-categories', JSON.stringify(categories.value))
  }

  // Computed
  const expenseCategories = computed(() => 
    categories.value.filter(c => c.type === 'expense')
  )

  const incomeCategories = computed(() => 
    categories.value.filter(c => c.type === 'income')
  )

  // CRUD
  function addCategory(category: Omit<Category, 'id'>) {
    const newCategory: Category = {
      ...category,
      id: generateId()
    }
    categories.value.push(newCategory)
    saveCategories()
    return newCategory
  }

  function updateCategory(id: string, updates: Partial<Omit<Category, 'id'>>) {
    const index = categories.value.findIndex(c => c.id === id)
    if (index !== -1) {
      categories.value[index] = { ...categories.value[index], ...updates }
      saveCategories()
    }
  }

  function deleteCategory(id: string) {
    const index = categories.value.findIndex(c => c.id === id)
    if (index !== -1) {
      categories.value.splice(index, 1)
      saveCategories()
    }
  }

  function getCategoryById(id: string) {
    return categories.value.find(c => c.id === id)
  }

  // Init
  loadCategories()

  return {
    categories,
    expenseCategories,
    incomeCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    getCategoryById,
    loadCategories,
    saveCategories
  }
})
