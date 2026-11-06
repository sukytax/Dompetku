/**
 * Nama bulan dalam Bahasa Indonesia
 */
const monthNames = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

/**
 * Nama hari dalam Bahasa Indonesia
 */
const dayNames = [
  'Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'
]

/**
 * Format tanggal dalam Bahasa Indonesia
 * @param date - String ISO date atau Date object
 * @param format - Format output: 'long' | 'short' | 'monthYear'
 * @returns String tanggal terformat
 */
export function formatDate(date: string | Date, format: 'long' | 'short' | 'monthYear' = 'long'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  
  if (format === 'monthYear') {
    return `${monthNames[d.getMonth()]} ${d.getFullYear()}`
  }
  
  if (format === 'short') {
    return `${d.getDate()} ${monthNames[d.getMonth()].substring(0, 3)} ${d.getFullYear()}`
  }
  
  // format === 'long'
  return `${d.getDate()} ${monthNames[d.getMonth()]} ${d.getFullYear()}`
}

/**
 * Format tanggal dengan nama hari
 * @param date - String ISO date atau Date object
 * @returns String dengan nama hari, contoh: "Rabu, 6 November 2026"
 */
export function formatDateWithDay(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return `${dayNames[d.getDay()]}, ${formatDate(d, 'long')}`
}

/**
 * Dapatkan string tanggal untuk input type="date"
 * @param date - Date object atau string
 * @returns String format YYYY-MM-DD
 */
export function toInputDate(date?: string | Date): string {
  const d = date ? (typeof date === 'string' ? new Date(date) : date) : new Date()
  return d.toISOString().split('T')[0]
}

/**
 * Dapatkan string bulan untuk filter
 * @param date - Date object atau string
 * @returns String format YYYY-MM
 */
export function toMonthString(date?: string | Date): string {
  const d = date ? (typeof date === 'string' ? new Date(date) : date) : new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

/**
 * Parse string bulan menjadi Date
 * @param monthString - String format YYYY-MM
 * @returns Date object
 */
export function parseMonthString(monthString: string): Date {
  return new Date(monthString + '-01')
}

/**
 * Dapatkan label bulan untuk grouping transaksi
 * @param date - String ISO date
 * @returns String seperti "November 2026"
 */
export function getMonthLabel(date: string): string {
  return formatDate(date, 'monthYear')
}

/**
 * Cek apakah dua tanggal di bulan yang sama
 */
export function isSameMonth(date1: string | Date, date2: string | Date): boolean {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth()
}

/**
 * Hitung selisih hari antara dua tanggal
 */
export function daysDifference(date1: string | Date, date2: string | Date): number {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2
  const diff = d2.getTime() - d1.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}
