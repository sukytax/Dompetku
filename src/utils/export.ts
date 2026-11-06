import type { Wallet, Category, Transaction, Goal, Budget } from '@/types'

export interface ExportData {
  version: string
  exportDate: string
  wallets: Wallet[]
  categories: Category[]
  transactions: Transaction[]
  goals: Goal[]
  budgets: Budget[]
}

/**
 * Export semua data ke JSON
 */
export function exportToJSON(data: ExportData): void {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `dompetku-backup-${new Date().toISOString().split('T')[0]}.json`
  link.click()
  URL.revokeObjectURL(url)
}

/**
 * Import data dari JSON
 */
export async function importFromJSON(file: File): Promise<ExportData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string) as ExportData
        // Validasi struktur data
        if (!data.wallets || !data.categories || !data.transactions) {
          throw new Error('Format data tidak valid')
        }
        resolve(data)
      } catch (error) {
        reject(error)
      }
    }
    reader.onerror = () => reject(new Error('Gagal membaca file'))
    reader.readAsText(file)
  })
}

/**
 * Export transaksi ke CSV
 */
export function exportTransactionsToCSV(
  transactions: Transaction[],
  wallets: Wallet[],
  categories: Category[],
  goals: Goal[]
): void {
  const headers = ['Tanggal', 'Tipe', 'Nominal', 'Dompet', 'Kategori', 'Catatan']
  
  const rows = transactions.map(t => {
    const wallet = wallets.find(w => w.id === t.walletId)
    const category = t.categoryId ? categories.find(c => c.id === t.categoryId) : null
    const goal = t.goalId ? goals.find(g => g.id === t.goalId) : null
    
    let typeLabel = ''
    switch (t.type) {
      case 'income': typeLabel = 'Pemasukan'; break
      case 'expense': typeLabel = 'Pengeluaran'; break
      case 'transfer': typeLabel = 'Transfer'; break
      case 'saving': typeLabel = 'Tabungan'; break
    }
    
    return [
      t.date,
      typeLabel,
      t.amount.toString(),
      wallet?.name || '',
      category?.name || goal?.name || '',
      t.note || ''
    ]
  })
  
  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n')
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `dompetku-transaksi-${new Date().toISOString().split('T')[0]}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

/**
 * Generate ID unik
 */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2)
}
