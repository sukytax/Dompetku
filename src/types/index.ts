export type TransactionType = 'income' | 'expense' | 'transfer' | 'saving' | 'withdrawal'

export interface Wallet {
  id: string
  name: string
  icon: string
  color: string
  initialBalance: number
  createdAt: string
}

export interface Category {
  id: string
  name: string
  type: 'income' | 'expense'
  icon: string
  color: string
}

export interface Transaction {
  id: string
  type: TransactionType
  amount: number
  walletId: string
  toWalletId?: string   // untuk transfer
  categoryId?: string
  goalId?: string       // untuk tabungan
  date: string
  note?: string
  createdAt: string
}

export interface Goal {
  id: string
  name: string
  targetAmount: number
  deadline?: string
  icon: string
  color: string
  note?: string
  status: 'active' | 'completed' | 'archived'
  createdAt: string
}

export interface Budget {
  id: string
  categoryId: string
  month: string  // "YYYY-MM"
  limit: number
}

export interface Settings {
  theme: 'light' | 'dark'
}
