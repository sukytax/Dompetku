import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db, auth, firebaseConfigured } from '@/firebase/config'

export type SyncKey = 'wallets' | 'transactions' | 'goals' | 'budgets' | 'categories'

const debounceTimers: Partial<Record<SyncKey, ReturnType<typeof setTimeout>>> = {}

/**
 * Menyimpan data koleksi tertentu ke Firestore dan cache lokal pengguna.
 */
export async function saveUserDataToCloud(
  key: SyncKey,
  data: any,
  userId?: string,
  immediate = false
): Promise<void> {
  const targetUid = userId || auth?.currentUser?.uid

  // Simpan ke cache lokal berdasar ID pengguna
  if (targetUid) {
    try {
      localStorage.setItem(`dompetku_${targetUid}_${key}`, JSON.stringify(data))
    } catch {
      // Abaikan jika kuota penuh
    }
  }

  const firestore = db
  if (!firestore || !firebaseConfigured || !targetUid) return

  const executeSave = async () => {
    try {
      const docRef = doc(firestore, 'users', targetUid, 'data', key)
      const cleanData = JSON.parse(JSON.stringify(data))
      await setDoc(docRef, {
        items: cleanData,
        updatedAt: new Date().toISOString()
      })
    } catch (err) {
      console.warn(`[FirestoreSync] Gagal menyimpan ${key} ke cloud:`, err)
    }
  }

  if (immediate) {
    if (debounceTimers[key]) {
      clearTimeout(debounceTimers[key])
      delete debounceTimers[key]
    }
    await executeSave()
    return
  }

  if (debounceTimers[key]) {
    clearTimeout(debounceTimers[key])
  }

  debounceTimers[key] = setTimeout(() => {
    delete debounceTimers[key]
    executeSave()
  }, 300)
}

/**
 * Memuat data koleksi tertentu dari Firestore.
 */
export async function loadUserDataFromCloud<T = any>(
  key: SyncKey,
  userId?: string
): Promise<T[] | null> {
  const targetUid = userId || auth?.currentUser?.uid
  const firestore = db
  if (!firestore || !firebaseConfigured || !targetUid) return null

  try {
    const docRef = doc(firestore, 'users', targetUid, 'data', key)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      const data = docSnap.data()
      const items = (data?.items as T[]) || []
      try {
        localStorage.setItem(`dompetku_${targetUid}_${key}`, JSON.stringify(items))
        localStorage.setItem(`dompetku-${key}`, JSON.stringify(items))
      } catch {
        // Abaikan
      }
      return items
    }
    return null
  } catch (err) {
    console.warn(`[FirestoreSync] Gagal memuat ${key} dari cloud:`, err)
    return null
  }
}

/**
 * Menghapus semua data koleksi di Firestore untuk pengguna saat ini.
 */
export async function clearUserDataFromCloud(userId?: string): Promise<void> {
  const targetUid = userId || auth?.currentUser?.uid
  const firestore = db
  if (!firestore || !firebaseConfigured || !targetUid) return

  const keys: SyncKey[] = ['wallets', 'transactions', 'goals', 'budgets', 'categories']
  await Promise.all(
    keys.map(async (key) => {
      try {
        const docRef = doc(firestore, 'users', targetUid, 'data', key)
        await setDoc(docRef, { items: [], updatedAt: new Date().toISOString() })
        localStorage.removeItem(`dompetku_${targetUid}_${key}`)
      } catch (err) {
        console.warn(`[FirestoreSync] Gagal mereset ${key} di cloud:`, err)
      }
    })
  )
}
