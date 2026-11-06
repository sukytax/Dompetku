# 💰 Dompetku

Aplikasi web pencatat keuangan pribadi dengan **multi-user authentication** untuk melacak uang yang dimiliki, mencatat pemasukan dan pengeluaran, serta mengelola tujuan menabung.

## 🔐 Authentication

Aplikasi menggunakan **Firebase Authentication** untuk:
- ✅ Multi-user support - Setiap user punya data terpisah
- ✅ Email/Password authentication
- ✅ Data sync antar device (cloud-based)
- ✅ Secure & scalable

**📖 Setup Guide:** Lihat [FIREBASE_SETUP.md](FIREBASE_SETUP.md) untuk panduan lengkap setup Firebase dan deployment ke Vercel.

## ✨ Fitur Utama

### 📊 Dashboard
- Total saldo gabungan dari semua dompet
- Ringkasan bulan berjalan (pemasukan, pengeluaran, selisih)
- Grafik donat pengeluaran per kategori
- Grafik batang pemasukan vs pengeluaran 6 bulan terakhir
- 5 transaksi terbaru
- Ringkasan progress goals yang aktif

### 👛 Dompet / Akun
- Kelola multiple dompet (Tunai, BCA, GoPay, OVO, dll)
- Setiap dompet memiliki nama, ikon, warna, dan saldo awal
- Saldo dihitung otomatis dari saldo awal + transaksi
- Fitur transfer antar dompet

### 📝 Transaksi
- Tambah, edit, dan hapus transaksi
- Tipe transaksi: Pemasukan, Pengeluaran, Transfer, Tabungan
- Kategori pengeluaran: Makan & Minum, Transport, Belanja, Tagihan, Hiburan, Kesehatan, Pendidikan, Lainnya
- Kategori pemasukan: Gaji, Bonus, Freelance, Hadiah, Lainnya
- Kelola kategori sendiri (tambah/edit/hapus)
- Filter dan pencarian transaksi
- Pengelompokan transaksi per tanggal

### 🎯 Goals / Tujuan Menabung
- Buat goal dengan target nominal dan tenggat waktu
- Setor dana ke goal dari dompet tertentu
- Tarik dana dari goal (mengembalikan ke dompet)
- Progress bar dan estimasi tabungan per bulan
- Status: Aktif, Tercapai, Diarsipkan
- Riwayat setoran dan penarikan per goal

### 💰 Anggaran Bulanan
- Atur batas pengeluaran per kategori per bulan
- Progress bar dengan indikator warna
- Peringatan saat anggaran hampir habis (≥80%) atau sudah terlewati (≥100%)

### ⚙️ Pengaturan
- Mode terang/gelap
- Export data ke JSON (backup)
- Export transaksi ke CSV
- Import data dari JSON (restore)
- Muat data contoh untuk mencoba aplikasi
- Hapus semua data

## 🚀 Cara Instalasi

### Prerequisites
- Node.js versi 18 atau lebih baru
- npm atau yarn
- Akun Firebase (gratis) - untuk authentication

### Langkah Instalasi

1. Clone atau ekstrak proyek
```bash
cd dompetku
```

2. Install dependencies
```bash
npm install
```

3. **Setup Firebase** (WAJIB untuk development)
   - Ikuti panduan di [FIREBASE_SETUP.md](FIREBASE_SETUP.md) Step 1-2
   - Buat file `.env` dengan Firebase credentials
   - Tanpa Firebase, aplikasi tidak akan bisa login/register

4. Jalankan development server
```bash
npm run dev
```

5. Buka browser dan akses `http://localhost:5173`

### Build untuk Production

```bash
npm run build
```

File hasil build akan tersimpan di folder `dist/`.

### Deployment ke Vercel

Ikuti panduan lengkap di [FIREBASE_SETUP.md](FIREBASE_SETUP.md) untuk:
- Setup Firebase project
- Push ke GitHub
- Deploy ke Vercel dengan environment variables

### Preview Production Build

```bash
npm run preview
```

## 📱 Progressive Web App (PWA)

Aplikasi ini dapat diinstall di smartphone atau desktop sebagai aplikasi standalone:

1. Buka aplikasi di browser
2. Klik menu browser (⋮)
3. Pilih "Install app" atau "Add to Home Screen"
4. Aplikasi dapat digunakan offline setelah diinstall

## 🏗️ Struktur Folder

```
dompetku/
├── src/
│   ├── assets/          # Asset statis (gambar, font, dll)
│   ├── components/      # Komponen Vue reusable
│   │   ├── Modal.vue
│   │   ├── CurrencyInput.vue
│   │   ├── ProgressBar.vue
│   │   ├── Toast.vue
│   │   ├── EmptyState.vue
│   │   ├── FAB.vue
│   │   ├── BottomNav.vue
│   │   └── Sidebar.vue
│   ├── views/           # Halaman utama aplikasi
│   │   ├── Dashboard.vue
│   │   ├── Wallets.vue
│   │   ├── Transactions.vue
│   │   ├── Goals.vue
│   │   ├── GoalDetail.vue
│   │   ├── Budgets.vue
│   │   └── Settings.vue
│   ├── stores/          # Pinia stores untuk state management
│   │   ├── settings.ts
│   │   ├── wallets.ts
│   │   ├── categories.ts
│   │   ├── transactions.ts
│   │   ├── goals.ts
│   │   └── budgets.ts
│   ├── composables/     # Vue composables
│   │   ├── useToast.ts
│   │   └── useChartData.ts
│   ├── utils/           # Helper functions
│   │   ├── currency.ts
│   │   ├── date.ts
│   │   └── export.ts
│   ├── types/           # TypeScript type definitions
│   │   └── index.ts
│   ├── router/          # Vue Router configuration
│   │   └── index.ts
│   ├── App.vue          # Root component
│   ├── main.ts          # Entry point
│   └── style.css        # Global styles (Tailwind)
├── public/              # File publik (favicon, icons)
├── index.html           # HTML template
├── vite.config.ts       # Vite configuration
├── tailwind.config.js   # Tailwind CSS configuration
├── tsconfig.json        # TypeScript configuration
└── package.json         # Project dependencies
```

## 🛠️ Tech Stack

- **Vue 3** - Framework JavaScript dengan Composition API dan `<script setup>`
- **TypeScript** - Type safety
- **Vite** - Build tool yang cepat
- **Pinia** - State management
- **Vue Router** - Routing/navigasi
- **Tailwind CSS** - Utility-first CSS framework
- **Chart.js + vue-chartjs** - Library grafik
- **Firebase Authentication** - User authentication
- **Firebase Firestore** - Cloud database (coming soon)
- **vite-plugin-pwa** - PWA support
- **localStorage** - Penyimpanan data lokal (akan diganti dengan Firestore)

## 💾 Penyimpanan Data

### Current: Local Storage + Firebase Auth
- **Authentication**: Firebase Authentication (cloud-based, multi-device)
- **Data**: localStorage per browser (sementara)
- Setiap user terautentikasi, tapi data masih lokal per device

### Coming Soon: Full Cloud Sync
- Data akan disimpan di Firebase Firestore
- Sync otomatis antar device
- Backup otomatis di cloud

### Keuntungan:
- ✅ Multi-user dengan authentication secure
- ✅ Data private per user
- ✅ Tidak perlu server backend sendiri
- ✅ Gratis untuk personal use (Firebase free tier)
- ⚠️ Data lokal bisa hilang jika clear browser (gunakan Export untuk backup)

**💡 Tip:** Gunakan fitur Export di Settings untuk backup data secara regular

## 📋 Aturan Bisnis Penting

1. **Saldo Dompet**: Saldo tidak boleh negatif saat melakukan transfer atau setor tabungan
2. **Hapus Dompet/Kategori**: Tidak bisa menghapus jika masih digunakan oleh transaksi
3. **Sinkronisasi**: Semua perubahan transaksi langsung memperbarui saldo, grafik, dan progress goal
4. **Goal Tercapai**: Goal otomatis berstatus "Tercapai" saat total tabungan ≥ target

## 🎨 Fitur UI/UX

- Mobile-first dan responsive design
- Dark mode support
- Format Rupiah dengan pemisah ribuan
- Format tanggal dan bulan dalam Bahasa Indonesia
- Color coding: Hijau (pemasukan), Merah (pengeluaran), Biru/Ungu (goals)
- Empty state yang informatif
- Validasi form dan konfirmasi sebelum menghapus
- Toast notifications untuk feedback
- Floating Action Button (FAB) untuk akses cepat tambah transaksi

## 📱 Navigasi

- **Desktop**: Sidebar di sisi kiri
- **Mobile**: Bottom navigation dengan 5 menu utama

## 🎲 Data Contoh

Aplikasi menyediakan fitur "Muat Data Contoh" di halaman Pengaturan untuk mencoba aplikasi dengan data demo yang sudah terisi.

## 🐛 Troubleshooting

### Build Error
Jika terjadi error saat build, pastikan:
- Node.js versi 18 atau lebih baru
- Semua dependencies sudah terinstall dengan benar
- Tidak ada typo di path import

### Data Hilang
- Pastikan tidak membersihkan localStorage browser
- Lakukan export data secara berkala untuk backup
- Import kembali data dari file backup JSON

## 📄 License

Proyek ini dibuat untuk keperluan pembelajaran dan portfolio.

## 👨‍💻 Pengembangan

Aplikasi ini dibuat dengan fokus pada:
- Clean code dan best practices
- Type safety dengan TypeScript
- Component reusability
- State management yang terstruktur
- User experience yang intuitif

---

**Selamat mencatat keuangan! 💰**
