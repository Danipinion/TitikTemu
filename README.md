# TitikTemu 📸✨
> **A Real-Time Multiplayer Photo & Deep-Journaling Web App for HIMA TRPL Bonding Events.**

**TitikTemu** (meaning *Meeting Point / Common Ground*) is a full-stack real-time bonding application built to bridge the gap between students, organization members, and divisions in HIMA TRPL. Designed with a mobile-first, moody Gen-Z dark-mode journaling aesthetic (featuring custom glassmorphism and soft neon glows), it allows a Host to orchestrate photographic challenges while players capture candid moments and write deep, honest reflections in real time.

---

## 🚀 Fitur Utama (Core Mechanics)

1. **Sistem Join Cepat**: Host dapat membuka ruangan baru dan secara instan mendapatkan PIN acak 4-digit. Peserta dapat masuk dari HP masing-masing cukup dengan memasukkan PIN dan nama panggilan mereka.
2. **Sinkronisasi Real-Time**: Ketika Host menekan tombol **"Lanjut Tantangan"**, semua layar perangkat peserta yang terhubung akan beralih secara otomatis dan serentak ke tantangan berikutnya.
3. **Kamera Viewfinder Terbuka & Terbalik (Mirrored)**: Halaman peserta menggunakan HTML5 MediaDevices API untuk mengambil gambar melalui kamera depan dengan efek mirror dinamis (agar lebih natural saat selfie bersama).
4. **10 Tantangan Spesifik HIMA TRPL**: Dilengkapi dengan 10 misi foto HIMA TRPL dan 10 pertanyaan refleksi mendalam (seperti "Capek Proker", "Air Mata HIMA", "Tuker Jaket", dll.) yang sudah tersimpan di database.
5. **Dinding Polaroid Host**: Setiap submisi foto dan jawaban peserta akan dikirim langsung via WebSocket dan tersusun secara estetik di konsol Host berupa galeri polaroid masonry yang interaktif.

---

## 🛠️ Tech Stack

* **Framework**: [TanStack Start](https://tanstack.com/start) (React 19 + Vite 8 + SSR) untuk kecepatan performa server-side rendering & full-stack routing.
* **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) dengan skema CSS-first `@theme` untuk palet warna gelap kustom dan font premium (Outfit & Playfair Display).
* **Real-time Engine**: Node.js WebSocket (`ws` package) server untuk manajemen sinkronisasi state ruangan, pemain, dan transmisi jawaban.
* **Database**: PostgreSQL (DDL skema & data benih awal ada di `schema.sql`).

---

## 📂 Struktur Folder Proyek

```bash
├── public/                 # File aset statis (Favicon kustom, manifest, dll)
├── src/
│   ├── components/         # Komponen UI utama
│   │   ├── CameraCapture.tsx     # Viewfinder kamera depan dengan efek mirror & canvas export
│   │   ├── HostView.tsx          # Panel kontrol host, player list, & polaroid masonry wall
│   │   └── PlayerView.tsx        # Tampilan mobile pemain, form entri, & status upload
│   ├── hooks/
│   │   └── useWebsocket.ts       # Hook koneksi WebSocket (aman dari reconnect loop & state wipe)
│   ├── routes/             # File-based routing TanStack Router
│   │   ├── __root.tsx            # Layout utama (font, HTML shell, meta title TitikTemu)
│   │   ├── index.tsx             # Halaman lobby utama pemilihan peran
│   │   ├── host.tsx              # Halaman Konsol Host
│   │   └── player.tsx            # Halaman Peserta Mobile
│   └── styles.css          # Setup Tailwind v4 & Custom CSS variables
├── server.ts               # Node.js WebSocket Server (TypeScript)
├── schema.sql              # Skema tabel (rooms, players, challenges, submissions)
├── package.json            # Daftar dependencies & scripts run
└── tsconfig.json           # Konfigurasi TypeScript compiler
```

---

## ⚙️ Cara Menjalankan Aplikasi Lokal

Ikuti langkah-langkah di bawah ini untuk menjalankan TitikTemu di mesin lokal Anda:

### 1. Instalasi Dependencies
```bash
npm install
```

### 2. Nyalakan WebSocket Real-Time Server
```bash
npm run dev:server
```
Server sinkronisasi real-time akan berjalan di `ws://localhost:8080`.

### 3. Nyalakan Frontend Client (TanStack Start)
```bash
npm run dev
```
Aplikasi frontend akan menyala di [http://localhost:3000](http://localhost:3000).

### 4. Setup Database Postgres (Opsional)
Jalankan file SQL `schema.sql` pada database PostgreSQL lokal Anda untuk mengimpor skema tabel beserta benih data 10 tantangan bawaan HIMA TRPL.

---

## 🧪 Pengujian Sesi Multiplayer
1. Buka [http://localhost:3000](http://localhost:3000) lalu klik **"Buka Layar Host"**.
2. Catat **Room PIN** yang tertera (contoh: `4829`) dan klik **"Buka Lobby Sekarang"**.
3. Buka tab browser baru (atau gunakan browser mobile/mode responsif), kunjungi [http://localhost:3000](http://localhost:3000) lalu klik **"Masuk sebagai Peserta"**.
4. Masukkan **Room PIN** tadi dan nama Anda, kemudian klik **"Masuk Kamar"**.
5. Pada layar Host, Anda akan melihat nama pemain bertambah di daftar peserta secara langsung.
6. Klik **"Mulai Sesi Bonding"** pada layar Host untuk memandu tantangan ke semua peserta serentak!

---

## 🐳 Deployment Docker (Proxmox / Cloud VM)

Aplikasi **TitikTemu** dikonfigurasikan agar dapat dibundel dalam satu container Docker yang sangat ringkas dan ringan. Kontainer ini akan mem-build frontend SPA secara otomatis, mengompilasi backend server ke JavaScript murni, dan melayani keduanya secara bersamaan di port **8080** (termasuk penyimpanan file foto lokal yang persisten).

### 1. Penyimpanan Foto & File Persisten
Semua foto profil peserta dan foto submisi tantangan disimpan sebagai file `.jpg` langsung di folder `./uploads/` pada harddisk server (menggantikan penyimpanan Base64 di memori RAM).

Saat dideploy di Docker/Proxmox, folder ini terhubung sebagai **Named Volume** (`titiktemu-uploads`), sehingga data foto Anda tidak akan hilang meskipun kontainer di-restart atau di-update.

### 2. Cara Build & Run dengan Docker Compose
Pastikan Docker dan Docker Compose telah terpasang di Proxmox LXC Container / VM Anda. Jalankan perintah berikut di folder proyek:

```bash
# Build image dan jalankan container di background
docker compose up -d --build
```

Setelah berjalan, Anda dapat mengakses TitikTemu secara penuh melalui satu port saja:
- **Web App UI (Host & Player)**: `http://<IP_PROXMOX>:8080`
- **WebSocket Connection**: Otomatis tersambung di `ws://<IP_PROXMOX>:8080`
- **Momen Foto Terunggah**: Dapat diakses langsung di `http://<IP_PROXMOX>:8080/uploads/...`

### 3. Konfigurasi Reverse Proxy (Nginx / Cloudflare Tunnel)
Jika ingin menggunakan domain HTTPS, Anda cukup mengarahkan reverse proxy ke port `8080` di Proxmox Anda. Jangan lupa mengaktifkan dukungan WebSocket (`Upgrade` & `Connection` headers).
