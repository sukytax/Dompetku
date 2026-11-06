import { inject } from 'vue'

export function useToast() {
  const toast = inject<(message: string, type?: 'success' | 'error' | 'warning' | 'info') => void>('toast')
  
  if (!toast) {
    console.warn('Toast not provided')
    return {
      success: (msg: string) => console.log('Success:', msg),
      error: (msg: string) => console.error('Error:', msg),
      warning: (msg: string) => console.warn('Warning:', msg),
      info: (msg: string) => console.info('Info:', msg)
    }
  }
  
  return {
    success: (message: string) => toast(message, 'success'),
    error: (message: string) => toast(message, 'error'),
    warning: (message: string) => toast(message, 'warning'),
    info: (message: string) => toast(message, 'info')
  }
}
