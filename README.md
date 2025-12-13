<div align="center">

# Website Dashboard Mutu Pelayanan Rumah Sakit Jawa Timur

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
<!-- ![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB) -->
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![PHP](https://img.shields.io/badge/PHP-777BB4?style=for-the-badge&logo=php&logoColor=white)
![Laravel](https://img.shields.io/badge/Laravel-FF2D20?style=for-the-badge&logo=laravel&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwind-css&logoColor=white)

---

## 📚 Daftar Isi

1. [Ikhtisar Proyek](#-ikhtisar-proyek)
2. [Fitur Utama](#-fitur-utama)
3. [Arsitektur Sistem](#-arsitektur-sistem)
4. [Teknologi & Modul](#-teknologi--modul)
5. [Struktur Direktori](#-struktur-direktori)
6. [Kebutuhan Sistem](#-kebutuhan-sistem)
7. [Environment & Variabel](#-environment--variabel)
8. [Langkah Instalasi](#-langkah-instalasi)
9. [Menjalankan Aplikasi](#-menjalankan-aplikasi)
10. [Workflows Penting](#-workflows-penting)
11. [Panduan Deployment](#-panduan-deployment)
12. [Referensi API](#-referensi-api)
13. [Skema Database](#-skema-database-singkat)
14. [Keamanan & CORS](#-keamanan--cors)
15. [Troubleshooting](#-troubleshooting)
16. [Roadmap Pengembangan](#-roadmap-pengembangan)
17. [Lisensi & Kontak](#-lisensi--kontak)

---

## 🧭 Ikhtisar Proyek

| Aspek | Detail |
| --- | --- |
| Sasaran | Dashboard mutu rumah sakit dengan fokus akreditasi & dokumen publik. |
| Pengguna | Admin Dinkes, operator RS, masyarakat umum. |
| Mode | SPA (Single Page Application) dengan fallback offline & auto-sync dokumen. |
| Bahasa | Bahasa Indonesia. |

---

## 🚀 Fitur Utama

### Dashboard Admin
- Tab Akreditasi, Indikator, Dokumen, Pengguna, dan Profil dengan pengalaman UX konsisten.
- Upload dokumen dan foto profil; metadata tersimpan di tabel `documents`, URL publik otomatis dibuat.
- Log aktivitas administrasi untuk audit dengan `ActivityLogger`.

### Pengalaman Publik
- Landing page informatif, grafik akreditasi, serta daftar dokumen yang tersaring (foto profil tidak muncul di publik).
- Widget pengunjung minimizable, menampilkan _active users_ dan _unique visitors_ dengan refresh 10 detik.
- Banner cookie consent global yang persisten di seluruh halaman.

### Ketahanan & Observabilitas
- Fallback Base64 ketika upload gagal; sinkronisasi ulang otomatis ketika server kembali tersedia.
- Token autentikasi kustom (`auth_tokens`) dengan masa berlaku 7 hari dan pencabutan otomatis saat login baru.
- CORS dikonfigurasi untuk domain resmi, sehingga akses API lebih aman.

---

## 🏗 Arsitektur Sistem

```bash
┌────────────┐        HTTPS         ┌────────────────────┐        ┌──────────────┐
│  Browser   │ ──────────────────▶ │   Laravel REST API   │ ─────▶ │   MySQL DB   │
└────┬───────┘                     └─────────┬───────────┘        └────┬─────────┘
     │                                      │                         │
     │  Context API / LocalStorage          │  Storage Disk (public)  │
     ▼                                      ▼                         ▼
┌────────────┐                      ┌───────────────┐        ┌────────────────┐
│ React SPA  │ ◀─ polling summary ─ │ Analytics svc │ ◀────▶ │ Activity Logs  │
└────────────┘                      └───────────────┘        └────────────────┘
```

- Frontend React 18 + Vite: state global dikelola `AppContext`, modul API di `services/api.js`.
- Backend Laravel 11: middleware `auth.token`, validasi request, DocumentController dengan route download publik.
- Storage disk `public` terhubung via `storage:link`, menghasilkan URL permanen untuk dokumen.
- Analytics service men-track session visitor, dirangkum untuk widget real-time.

---

## 🧰 Teknologi & Modul

| Kategori | Teknologi | Fungsi |
| --- | --- | --- |
| UI & Styling | React 18, Tailwind CSS, Headless UI | Komponen responsif & aksesibilitas. |
| Visualisasi | Chart.js + react-chartjs-2 | Grafik akreditasi (pie, bar horizontal). |
| State Global | Context API & custom hooks | Sinkronisasi user, dokumen, analytics, theme, cookie. |
| HTTP Client | Fetch API wrapper (`services/api.js`) | Menambahkan header token, error handling, parse JSON. |
| Backend | Laravel 11, PHP 8.2 | REST API, validasi, log, middleware token. |
| Database | MySQL/MariaDB | Menyimpan user, documents, analytics, logs. |
| Tooling | Vite, PNPM, Composer, Artisan CLI | Build, instal dependency, migrasi, optimasi. |

---

## 📁 Struktur Direktori

```bash
web-mutu/
├── README.md
├── src/
│   ├── App.jsx
│   ├── components/
│   │   ├── Admin/
│   │   ├── Landing/
│   │   └── VisitorWidget.jsx
│   ├── context/AppContext.jsx
│   └── services/api.js
├── backend/
│   ├── app/Http/Controllers/
│   │   ├── DocumentController.php
│   │   ├── ProfileController.php
│   │   └── VisitorAnalyticsController.php
│   ├── app/Http/Middleware/AuthTokenMiddleware.php
│   ├── config/cors.php
│   ├── database/migrations/
│   │   ├── *_create_documents_table.php
│   │   ├── *_add_category_to_documents_table.php
│   │   └── *_create_auth_tables.php
│   └── routes/api.php
└── dist/ (hasil build frontend)
```

---

## 💻 Kebutuhan Sistem

- Node.js >= 18 & PNPM 8 (alternatif: npm/yarn).
- PHP >= 8.2 dengan ekstensi OpenSSL, PDO, Mbstring, Tokenizer, GD, Fileinfo.
- Composer 2.x.
- MySQL/MariaDB 10.x.
- Git & akses shell untuk menjalankan Artisan.

---

## 🔐 Environment & Variabel

### Frontend (`.env`)

| Variabel | Contoh | Keterangan |
| --- | --- | --- |
| `VITE_USE_API` | `"true"` | Aktifkan mode API; jika `false`, aplikasi berjalan offline demo. |
| `VITE_API_URL` | `https://api.[domain.com]/api` | URL dasar API (harus ada `/api`). |

### Backend (`backend/.env`)

| Variabel | Contoh | Keterangan |
| --- | --- | --- |
| `APP_URL` | `https://api.[something].[domain.com]` | Digunakan untuk generate link dokumen publik. |
| `FRONTEND_URL` | `https://[domain.com]` | Domain asal yang diizinkan (CORS). |
| `FILESYSTEM_DISK` | `public` | Disk penyimpanan dokumen & foto. |
| `DB_DATABASE` | `mutu` | Nama database produksi. |
| `ADMIN_CODE` | `[code]` | (Opsional) kode verifikasi admin. |

> Jalankan `php artisan config:clear` & `php artisan cache:clear` setelah mengubah `.env` agar konfigurasi tersinkron.

---

## 🧰 Langkah Instalasi

1. **Clone repo**
   ```bash
   git clone https://github.com/dextryayers/rujukan-jatim.git
   cd web-mutu
   ```
2. **Salin berkas environment**
   ```bash
   cp .env.example .env
   cp backend/.env.example backend/.env
   ```
3. **Konfigurasikan variabel** di `.env` dan `backend/.env`.
4. **Install dependency frontend**
   ```bash
   pnpm install   # atau npm install / yarn install
   ```
5. **Install dependency backend**
   ```bash
   cd backend
   composer install
   php artisan key:generate
   ```
6. **Migrasi & seed database**
   ```bash
   php artisan migrate --seed
   ```
7. **Buat symlink storage**
   ```bash
   php artisan storage:link
   ```

---

## ▶️ Menjalankan Aplikasi

### Mode Pengembangan (Hot Reload)

```bash
# Frontend
pnpm run dev -- --host 0.0.0.0 --port 5173

# Backend
cd backend
php artisan serve --host=0.0.0.0 --port=8000
```

### Build & Preview Produksi

```bash
pnpm run build
pnpm run preview

cd backend
php artisan optimize
php artisan config:cache
php artisan route:cache
```

Pastikan `VITE_API_URL` mengarah ke domain API yang telah mengizinkan CORS.

---

## 🔁 Workflows Penting

### Upload Dokumen & Foto Profil
1. Admin memilih file, lalu frontend mengirim `FormData` ke `POST /documents`.
2. Backend menyimpan file pada disk publik, membuat entri `documents`, dan mengembalikan `file_url`.
3. Untuk foto profil, frontend memanggil `PUT /profile` dengan `photoUrl` agar tersimpan di `users.photo_url`.
4. Jika jaringan gagal, file disimpan Base64 dan disinkronkan ulang ketika server siap.

### Visitor Analytics
- `trackVisitor()` merekam session & optional view.
- `refreshVisitorSummary()` berjalan setiap 10 detik, menyediakan data untuk widget minimize.
- Statistik historis tersedia via `/analytics/stats`.

### Sinkronisasi Offline
- Dokumen offline diberi flag `offlineFallback` dan akan disinkronkan melalui `syncOfflineDocument` saat koneksi pulih.

---

## 🚀 Panduan Deployment

1. Build frontend (`pnpm run build`), unggah isi folder `dist/` ke server statis.
2. Deploy backend ke server PHP (Nginx/Apache) dan jalankan `composer install --no-dev`.
3. Jalankan `php artisan migrate --force`, `php artisan optimize`, dan buat symlink storage.
4. Pastikan `storage/` & `bootstrap/cache/` writable.
5. Konfigurasi web server untuk memisahkan domain publik & API.
6. Aktifkan HTTPS dan perbarui konfigurasi CORS bila domain berubah.
7. Monitor log `storage/logs/laravel.log` & siapkan backup database.

---

## 📡 Referensi API

| Method | Endpoint | Headers | Payload | Catatan |
| --- | --- | --- | --- | --- |
| POST | `/auth/login` | `Content-Type: application/json` | `{ email, password, recaptcha_token? }` | Mengembalikan `{ token, user }`. |
| POST | `/auth/logout` | `Authorization: Bearer` | – | Menonaktifkan token aktif. |
| GET | `/auth/me` | `Authorization: Bearer` | – | Mengambil profil user saat ini. |
| PUT | `/profile` | `Authorization: Bearer`, JSON | `{ name?, email?, phone?, city?, institution?, photoUrl? }` | Perbarui profil; password otomatis di-hash jika dikirim. |
| GET | `/documents` | Opsional | `?include_profile=true` | Daftar dokumen publik; foto profil dikeluarkan secara default. |
| POST | `/documents` | `Authorization`, multipart | `title`, `description?`, `file`, `category?` | Upload dokumen, kembalikan metadata & `file_url`. |
| POST | `/documents/{id}` | `Authorization`, multipart | Field opsional | Memperbarui metadata atau mengganti file. |
| DELETE | `/documents/{id}` | `Authorization` | – | Menghapus dokumen & file. |
| GET | `/documents/{id}/download` | – | – | Route publik untuk unduhan. |
| POST | `/analytics/track` | JSON | `{ count_view?: bool }` | Mencatat session, mengembalikan `session_id`. |
| GET | `/analytics/summary` | – | – | Ringkasan visitor real time. |
| GET | `/analytics/stats` | – | `?days=14` | Statistik historis pengunjung. |
| GET | `/akreditasi` | – | – | Data grafik akreditasi. |
| GET | `/indikators` | – | – | Data indikator mutu. |
| CRUD | `/admin/users` | `Authorization: Bearer` (role admin) | Sesuai method | Manajemen pengguna. |

---

## 🗄 Skema Database Singkat

| Tabel | Kolom Kunci | Keterangan |
| --- | --- | --- |
| `users` | `name`, `username`, `email`, `photo_url`, `role` | Data pengguna dan foto profil. |
| `auth_tokens` | `user_id`, `token`, `expires_at` | Token autentikasi, valid 7 hari. |
| `documents` | `title`, `description`, `category`, `file_path`, `file_url`, `file_name`, `mime_type`, `file_size` | Repository dokumen & foto profil. |
| `visitor_sessions`* | `session_id`, `views`, `last_seen` | Menyimpan sesi visitor. |
| `visitor_daily_stats`* | `date`, `views`, `unique_visitors` | Ringkasan harian. |
| `activity_logs` | `type`, `description`, `metadata`, `user_id` | Audit aktivitas admin. |

(*Nama tabel mengikuti migrasi asli.)

---

## 🔒 Keamanan & CORS

- `config/cors.php` mengizinkan domain `[domain.com]` dan subdomainnya (regex). Tambahkan domain baru sesuai kebutuhan.
- Middleware `auth.token` memastikan endpoint sensitif hanya diakses dengan token valid.
- Token login tunggal: login di perangkat baru otomatis mencabut token lama, mengurangi risiko penyalahgunaan.
- Gunakan HTTPS untuk menghindari _mixed content_ saat memuat file publik.

---

## 🛠 Troubleshooting

| Gejala | Diagnosa | Solusi |
| --- | --- | --- |
| `photo_url` tetap `NULL` | Request `PUT /profile` gagal atau token kadaluarsa | Login ulang, pastikan payload `photoUrl`, cek log backend. |
| File publik 403 | Symlink storage tidak ada / permission salah | `php artisan storage:link`, pastikan folder writable. |
| CORS preflight error | Origin belum diizinkan | Update `config/cors.php`, jalankan `php artisan optimize:clear`. |
| Token sering expire | Login multi-device | Gunakan satu sesi atau modifikasi middleware multi-token. |
| Widget visitor tidak update | API analytics down | Cek respons `/analytics/summary` & status cron. |
| Upload gagal (timeout) | Limit ukuran request kecil | Atur `upload_max_filesize`, `post_max_size`, dan timeout server. |

---

## 🗺 Roadmap Pengembangan

- Migrasi storage ke CDN (S3/Wasabi) untuk akses dokumen lebih cepat.
- Penambahan dashboard multi-role dengan granular permission.
- Laporan analytics lanjutan & ekspor CSV.
- Test otomatis (Jest/RTL & Pest/PHPUnit) dan pipeline CI/CD.
- Monitoring uptime & alerting (Grafana/Prometheus).

---

## 📄 Lisensi & Kontak

Proyek adalah aset internal Dinas Kesehatan Jawa Timur. Penggunaan eksternal memerlukan persetujuan resmi.

- **Kontak teknis**: bidang IT Dinkes Jatim — it-support@dinkesjatim.go.id
- **Kontak administrasi**: Sekretariat Dinkes Jatim — admin@dinkesjatim.go.id

---

> Dokumentasi diperbarui terakhir pada **Desember 2025**. Mohon perbarui README setiap kali ada perubahan signifikan pada infrastruktur, dependensi, atau alur kerja.
