# 🔥 Firebase Setup & Deployment Guide

Panduan lengkap untuk setup Firebase Authentication dan deploy ke Vercel.

## 📋 Prerequisites

- Akun Google (untuk Firebase)
- Akun GitHub (untuk repository)
- Akun Vercel (gratis, sign up dengan GitHub)

---

## 🔥 Step 1: Setup Firebase Project

### 1.1 Buat Firebase Project

1. Buka [Firebase Console](https://console.firebase.google.com/)
2. Klik **"Add project"** atau **"Tambah project"**
3. Beri nama project: `dompetku` (atau nama lain)
4. Matikan Google Analytics (tidak wajib untuk project ini)
5. Klik **"Create project"**

### 1.2 Setup Authentication

1. Di Firebase Console, klik **"Authentication"** di menu kiri
2. Klik **"Get started"**
3. Pilih **"Email/Password"** sebagai Sign-in provider
4. Toggle **"Email/Password"** menjadi **Enabled**
5. Klik **"Save"**

### 1.3 Setup Firestore Database

1. Di Firebase Console, klik **"Firestore Database"** di menu kiri
2. Klik **"Create database"**
3. Pilih **"Start in production mode"** (kita akan set rules nanti)
4. Pilih lokasi server terdekat (misalnya: `asia-southeast1` untuk Indonesia)
5. Klik **"Enable"**

### 1.4 Set Firestore Security Rules

1. Di Firestore Database, klik tab **"Rules"**
2. Copy paste rules berikut:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User hanya bisa akses data mereka sendiri
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

3. Klik **"Publish"**

### 1.5 Dapatkan Firebase Config

1. Klik **⚙️ (Settings)** di samping "Project Overview"
2. Pilih **"Project settings"**
3. Scroll ke bawah ke bagian **"Your apps"**
4. Klik icon **</>** (Web)
5. Beri nama app: `Dompetku Web`
6. **Jangan** centang "Also set up Firebase Hosting"
7. Klik **"Register app"**
8. Copy nilai-nilai berikut (akan dipakai di Step 2):
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `storageBucket`
   - `messagingSenderId`
   - `appId`

---

## 💻 Step 2: Setup Environment Variables (Local Development)

### 2.1 Buat file `.env`

Di root folder project `dompetku`, buat file `.env`:

```bash
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=dompetku-xxxxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=dompetku-xxxxx
VITE_FIREBASE_STORAGE_BUCKET=dompetku-xxxxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:xxxxxxxxxxxxxxxx
```

**⚠️ PENTING:** 
- Ganti semua nilai dengan nilai dari Firebase Console (Step 1.5)
- File `.env` sudah ada di `.gitignore`, jadi **tidak akan** ter-commit ke GitHub

### 2.2 Test Local

```bash
npm run dev
```

Buka `http://localhost:5173`, seharusnya muncul halaman login.

---

## 🚀 Step 3: Push ke GitHub

### 3.1 Initialize Git (jika belum)

```bash
cd dompetku
git init
git add .
git commit -m "Initial commit with Firebase auth"
```

### 3.2 Buat Repository di GitHub

1. Buka [GitHub](https://github.com)
2. Klik **"+"** → **"New repository"**
3. Nama repository: `dompetku`
4. **Jangan** centang "Initialize with README" (sudah ada)
5. Klik **"Create repository"**

### 3.3 Push ke GitHub

```bash
git remote add origin https://github.com/USERNAME/dompetku.git
git branch -M main
git push -u origin main
```

**Ganti `USERNAME` dengan username GitHub Anda**

---

## ▲ Step 4: Deploy ke Vercel

### 4.1 Import Project ke Vercel

1. Buka [Vercel](https://vercel.com)
2. Login dengan GitHub
3. Klik **"Add New"** → **"Project"**
4. Pilih repository **"dompetku"**
5. Klik **"Import"**

### 4.2 Configure Project

Di halaman **"Configure Project"**:

1. **Framework Preset**: Vite (akan terdeteksi otomatis)
2. **Root Directory**: `./` (default)
3. **Build Command**: `npm run build` (default)
4. **Output Directory**: `dist` (default)

### 4.3 Set Environment Variables di Vercel ⚙️

**INI BAGIAN PENTING!**

1. Klik **"Environment Variables"**
2. Tambahkan satu per satu (total 6 variables):

| Name | Value |
|------|-------|
| `VITE_FIREBASE_API_KEY` | (copy dari `.env` lokal) |
| `VITE_FIREBASE_AUTH_DOMAIN` | (copy dari `.env` lokal) |
| `VITE_FIREBASE_PROJECT_ID` | (copy dari `.env` lokal) |
| `VITE_FIREBASE_STORAGE_BUCKET` | (copy dari `.env` lokal) |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | (copy dari `.env` lokal) |
| `VITE_FIREBASE_APP_ID` | (copy dari `.env` lokal) |

**Untuk setiap variable:**
- Ketik **Name** (misalnya: `VITE_FIREBASE_API_KEY`)
- Paste **Value** dari file `.env` lokal Anda
- Pastikan **Environment** diset ke **Production**, **Preview**, dan **Development**
- Klik **"Add"**

### 4.4 Deploy!

1. Setelah semua environment variables diset, klik **"Deploy"**
2. Tunggu 1-2 menit (Vercel akan build dan deploy)
3. Setelah selesai, klik **"Visit"** untuk buka aplikasi

🎉 **Aplikasi sudah live!** URL: `https://dompetku-xxxxx.vercel.app`

---

## 🔄 Update Aplikasi (Auto-Deploy)

Setelah setup awal, setiap push ke GitHub akan otomatis trigger deploy di Vercel:

```bash
# Edit code Anda
git add .
git commit -m "Update feature"
git push

# Vercel otomatis deploy! ✨
```

---

## ✅ Verifikasi Setup

### Cek Firebase

1. **Buka aplikasi** di Vercel URL
2. **Register** akun baru
3. Buka Firebase Console → **Authentication** → **Users**
4. User baru harusnya muncul di list ✓

### Cek Firestore (nanti setelah implement sync)

1. Login ke aplikasi
2. Tambah transaksi/dompet
3. Buka Firebase Console → **Firestore Database**
4. Data harusnya muncul di collection `users/{userId}` ✓

---

## 🐛 Troubleshooting

### 1. "Firebase: Error (auth/configuration-not-found)"

**Masalah:** Environment variables belum diset di Vercel

**Solusi:** 
- Cek **Vercel Dashboard** → Project → **Settings** → **Environment Variables**
- Pastikan semua 6 variables sudah ada
- **Redeploy:** Vercel Dashboard → **Deployments** → klik **...** → **Redeploy**

### 2. "Akses ditolak ke Firestore"

**Masalah:** Firestore rules belum diset

**Solusi:**
- Buka Firebase Console → **Firestore Database** → **Rules**
- Pastikan rules sudah sesuai (lihat Step 1.4)

### 3. Build gagal di Vercel

**Masalah:** Conflict dependencies atau error TypeScript

**Solusi:**
```bash
# Test build lokal dulu
npm run build

# Fix error, lalu push lagi
git add .
git commit -m "Fix build error"
git push
```

---

## 📝 Catatan Penting

1. **API Keys aman untuk public**: Firebase API keys di frontend aman karena security diatur lewat Firestore Rules
2. **Free Tier**: Firebase free tier cukup untuk 50K users/month
3. **Vercel Free**: Unlimited deployments, bandwidth 100GB/month
4. **Custom Domain**: Bisa tambah domain sendiri di Vercel (gratis)

---

## 🎯 Next Steps

Setelah deployment berhasil, Anda bisa:

1. ✅ Tambahkan custom domain di Vercel
2. ✅ Setup Google Analytics (opsional)
3. ✅ Implementasi Firestore sync untuk data (coming next)
4. ✅ Setup PWA untuk install di HP

---

## 📞 Butuh Bantuan?

- **Firebase Docs**: https://firebase.google.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **Vite Env Variables**: https://vitejs.dev/guide/env-and-mode.html

Selamat! Aplikasi Dompetku sekarang sudah live dan bisa diakses dari mana saja! 🎉
