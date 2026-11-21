# Chatify

**Chatify** adalah aplikasi web perpesanan (*real-time chat*) modern yang dibangun dengan arsitektur **hypermedia-driven** di atas **Bun**, **Elysia**, **PostgreSQL**, **Drizzle ORM**, **HTMX v4**, dan **Tailwind CSS v4 + DaisyUI v5**.

Proyek ini dirancang untuk menghadirkan pengalaman komunikasi *real-time* berlatensi rendah (pesan langsung, obrolan grup, status *online*, indikator mengetik, dan berbagi file) tanpa kompleksitas *client-side SPA bundle* yang berat—seluruh UI dirender langsung dari server menggunakan JSX (`@kitajs/html`) dengan validasi ketat menggunakan **Zod**.

---

## Fitur Utama

- **Real-Time Messaging (WebSocket)**: Pengiriman dan penerimaan pesan instan 1-on-1 (*Direct Message*) maupun *Group Chat* menggunakan ekstensi WebSocket HTMX v4 (`hx-ws`).
- **Presence & Interaksi Langsung**: Indikator status *online/offline*, indikator *sedang mengetik* (*typing indicator*), notifikasi toast untuk pesan masuk di room lain, dan penghitung pesan belum dibaca (*unread badge*).
- **Berbagi Gambar & Dokumen**: Unggah lampiran gambar (`JPG`, `PNG`, `GIF`, `WEBP`) maupun dokumen (`PDF`, `TXT`, `ZIP`) hingga 5 MB langsung di ruang obrolan, lengkap dengan kontrol akses berbasis keanggotaan room.
- **Manajemen Grup & Peran**: Buat grup dengan banyak anggota awal, lihat daftar anggota pada *slide-over drawer*, tambah anggota dari daftar kontak, serta kelola izin berbasis peran (*Pemilik*, *Admin*, *Anggota*).
- **Sistem Pertemanan & Undangan**: Cari pengguna berdasarkan username (minimal 3 karakter) atau ID 6 digit, kirim/terima/tolak/batalkan permintaan pertemanan, bagikan tautan undangan pribadi (`/contact/invite/:id`), serta blokir/buka blokir pengguna.
- **Profil & Avatar Pengguna**: Unggah, ganti, atau hapus foto profil (maks. 2 MB) yang ditampilkan secara konsisten di daftar obrolan, header chat, kontak, dan anggota grup.
- **UI Modern & Adaptif**: Desain *Dark/Light Mode* (`chatify-dark` & `chatify-light`) dengan tata letak responsif 3-panel (*navigation rail*, daftar percakapan, ruang kerja obrolan).

---

## Sorotan Teknis & Arsitektur

Bagian ini merangkum prinsip rekayasa perangkat lunak yang diterapkan dalam proyek:

1. **Feature-Based Modular Architecture**
   - Setiap domain bisnis dikapsulasi di `src/modules/<feature>/` (`auth`, `chat`) dengan pemisahan tanggung jawab yang jelas: `routes/` (HTTP & WebSocket handler tipis), `services/` (logika bisnis & query Drizzle ORM), `views/` (komponen JSX & partial HTMX), dan `model.ts` (skema validasi Zod & inferensi tipe TypeScript).
   - Lapisan `src/shared/` hanya menampung komponen lintas-fitur (`db.ts`, `logger.ts`, `idGenerator.ts`, `Layout`, `UserAvatar`, `DesktopNavigation`).
2. **Keamanan Aplikasi (*Security by Design*)**
   - **Autentikasi**: Hashing kata sandi menggunakan `Bun.password` (Argon2id) serta manajemen sesi berbasis *signed cookie* (`httpOnly`, `sameSite: 'strict'`, dan `secure` pada mode produksi).
   - **Anti-IDOR (*Insecure Direct Object Reference*)**: Validasi keanggotaan *room* dan status pemblokiran pada setiap akses riwayat pesan, pengiriman pesan WebSocket, manajemen anggota grup, hingga pengunduhan lampiran (`/uploads/:filename`).
   - **Perlindungan Input & File**: Validasi seluruh payload HTTP/WebSocket dan environment variable dengan **Zod**, *parameterized queries* via Drizzle ORM, sanitasi nama file & pencegahan *path traversal* menggunakan `path.basename()`.
3. **Hypermedia-Driven UI (HTMX v4 + Alpine.js)**
   - Memanfaatkan kemampuan native HTMX v4 (*out-of-band swaps*, `hx-status:*`, `hx-ws`, partial rendering) dan hanya menggunakan Alpine.js untuk state UI lokal (pencarian sidebar, tab, tema, dan *drawer*).
4. **Teruji Secara Otomatis**
   - Dilengkapi *unit & integration test* menggunakan `bun test` terhadap PostgreSQL terisolasi untuk memverifikasi validasi skema Zod, alur autentikasi & avatar, layanan pertemanan/grup, serta regresi keamanan Anti-IDOR.

---

## Tech Stack

| Lapisan | Teknologi |
| :--- | :--- |
| **Runtime** | [Bun](https://bun.sh/) |
| **Web Framework** | [Elysia](https://elysiajs.com/) (`^1.4.29`), `@elysiajs/html`, `@elysia/static` |
| **Database & ORM** | PostgreSQL 17, [Drizzle ORM](https://orm.drizzle.team/) (`^0.45.2`), `drizzle-kit` |
| **Validasi & Konfigurasi** | [Zod](https://zod.dev/) (`^4.4.3`) |
| **Frontend & Hypermedia** | [HTMX v4](https://four.htmx.org/) (`4.0.2`), [Alpine.js](https://alpinejs.dev/) (`^3.17.5`), `@kitajs/html` (JSX) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) (`^4.3.3`), [DaisyUI v5](https://daisyui.com/) (`^5.7.9`) |

---

## Struktur Proyek

```text
chatify/
├── drizzle/                      # File migrasi SQL & snapshot Drizzle ORM
├── public/                       # Aset statis, input.css, style.css (hasil build), & client JS
├── src/
│   ├── app.ts                    # Konfigurasi Elysia app, static assets, & registrasi modul
│   ├── config.ts                 # Validasi environment variables menggunakan Zod
│   ├── index.ts                  # Entrypoint server
│   ├── shared/                   # Koneksi DB, logger, generator ID, layout, & komponen UI bersama
│   └── modules/
│       ├── auth/                 # Autentikasi, sesi, profil, & manajemen avatar
│       │   ├── routes/           # auth.routes.ts, profile.routes.ts
│       │   ├── views/            # auth-pages.tsx, profile-page.tsx
│       │   ├── index.ts, model.ts, service.ts, views.tsx, auth.test.ts
│       └── chat/                 # Obrolan real-time, grup, lampiran, & kontak
│           ├── routes/           # room.routes.ts, contact.routes.ts, ws.routes.ts
│           ├── services/         # contact.service.ts, room.service.ts, message.service.ts
│           ├── views/            # chat-workspace.tsx, chat-panel.tsx, contacts.tsx, invite-and-group.tsx
│           ├── errors.ts, presence.ts, session.ts
│           ├── index.ts, model.ts, service.ts, views.tsx, chat.test.ts
├── compose.yaml                  # Konfigurasi PostgreSQL 17 untuk development
└── package.json
```

---

## Cara Menjalankan Proyek

### 1. Prasyarat
- **Bun** (v1.3+ direkomendasikan)
- **Docker & Docker Compose** (atau PostgreSQL 17 lokal)

### 2. Instalasi Dependensi
```bash
bun install
```

### 3. Menjalankan Database PostgreSQL
Proyek telah menyediakan `compose.yaml` untuk menjalankan PostgreSQL 17 pada port `5433`:
```bash
docker compose up -d
```

### 4. Konfigurasi Environment (Opsional untuk Development)
Secara default, `src/config.ts` sudah menyediakan konfigurasi development yang langsung cocok dengan `compose.yaml`. Untuk kustomisasi atau lingkungan produksi, buat file `.env` dengan variabel berikut:

| Variabel | Deskripsi | Default (Development) |
| :--- | :--- | :--- |
| `NODE_ENV` | Mode aplikasi (`development`, `production`, `test`) | `development` |
| `PORT` | Port server HTTP/WebSocket | `3000` |
| `DB_URL` | Connection string PostgreSQL utama (**wajib saat `production`**) | `postgres://chatify:chatify_dev_password@localhost:5433/chatify` |
| `TEST_DB_URL` | Connection string PostgreSQL khusus pengujian | `postgres://chatify:chatify_dev_password@localhost:5433/chatify_test` |
| `COOKIE_SECRET` | Kunci penandatanganan cookie sesi, min. 32 karakter (**wajib saat `production`**) | *(dev secret bawaan)* |
| `S3_ENDPOINT` | Endpoint S3-compatible object storage (AWS S3, Cloudflare R2, MinIO, dll.) | *(opsional, fallback lokal)* |
| `S3_REGION` | Region bucket S3 | `us-east-1` |
| `S3_BUCKET` | Nama bucket S3 untuk menyimpan avatar & lampiran chat | *(opsional)* |
| `S3_ACCESS_KEY_ID` | Access Key ID untuk S3 storage | *(opsional)* |
| `S3_SECRET_ACCESS_KEY` | Secret Access Key untuk S3 storage | *(opsional)* |

### 5. Migrasi Database & Build CSS
Jalankan migrasi skema Drizzle ke database dan kompilasi Tailwind CSS:
```bash
bunx drizzle-kit migrate
bun run build
```

### 6. Menjalankan Server Development
```bash
bun run dev
```
Server akan berjalan di `http://localhost:3000`. Jika mengubah class Tailwind pada file `.tsx`, jalankan watcher CSS di terminal terpisah:
```bash
bun run tailwind
```

---

## Pengujian & Verifikasi Kualitas

Pastikan database test (`chatify_test` atau sesuai `TEST_DB_URL`) sudah tersedia dan termigrasi, lalu jalankan perintah berikut:

```bash
# Menjalankan seluruh unit & integration test
NODE_ENV=test bun test

# Pemeriksaan tipe TypeScript (strict mode)
bunx tsc --noEmit

# Pemeriksaan kompatibilitas atribut & event HTMX v4
bunx htmx.org upgrade-check --ext .tsx -- ./src ./public
```
