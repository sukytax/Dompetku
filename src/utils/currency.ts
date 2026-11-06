/**
 * Format angka menjadi format Rupiah
 * @param amount - Nominal dalam Rupiah (integer)
 * @returns String format Rupiah, contoh: "Rp 1.500.000"
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Parse string Rupiah menjadi angka
 * @param value - String input (bisa dengan pemisah ribuan atau tidak)
 * @returns Angka integer
 */
export function parseCurrency(value: string): number {
  const cleaned = value.replace(/[^\d]/g, '')
  return parseInt(cleaned) || 0
}

/**
 * Format input untuk currency (tambah pemisah ribuan saat mengetik)
 * @param value - String input
 * @returns String dengan pemisah ribuan
 */
export function formatCurrencyInput(value: string): string {
  const num = parseCurrency(value)
  if (num === 0) return ''
  return new Intl.NumberFormat('id-ID').format(num)
}
