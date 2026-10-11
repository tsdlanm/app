# IoT Designer

Aplikasi web untuk merancang sistem IoT secara visual lalu menyimulasikannya langsung di browser.

- **Frontend:** React + TypeScript (Vite), React Flow, Zustand
- **Backend:** Go + PostgreSQL (belum dipakai; editor saat ini berjalan penuh di browser)

## Yang sudah bisa

- Kanvas: seret komponen dari palet (atau klik untuk menambah), tarik kabel dari titik keluaran ke titik masukan, geser, hapus
- Kabel divalidasi: tipe harus cocok (angka ke angka, ya/tidak ke ya/tidak), satu kabel per masukan, tanpa loop
- 15 komponen: sensor (suhu, kelembapan, cahaya, gerak, tombol), logika (pembanding, AND, OR, NOT, timer), aktuator (LED, kipas, buzzer), tampilan (gauge, grafik)
- Panel properti untuk mengatur tiap komponen
- Simulasi Run / Pause / Reset dengan kecepatan 1×, 2×, 5×; pengeditan saat berjalan langsung berlaku
- Undo / redo (Ctrl+Z, Ctrl+Shift+Z), simpan otomatis di browser, ekspor/impor file `.iot.json`
- Tanpa akun

Rencana lengkap dan yang belum dikerjakan ada di [docs/BLUEPRINT.md](docs/BLUEPRINT.md).

## Menjalankan secara lokal

Editor hanya butuh Node.js 20+:

```sh
cd web
npm install
npm run dev     # http://localhost:5173
npm test        # unit test engine simulasi dan validasi proyek
npm run build
```

Backend (Go 1.24+, belum dipakai editor) dan PostgreSQL:

```sh
docker compose up -d                 # PostgreSQL di localhost:5432
cd server && go run ./cmd/server     # API di localhost:8080, GET /api/health
```

## Struktur

```
web/src/
  components/   definisi komponen IoT (port, properti, perilaku)
  sim/          engine simulasi dan runner
  editor/       kanvas, palet, panel properti, toolbar, store, penyimpanan
  pages/        halaman editor
server/         Go API (kerangka)
docs/           blueprint
```
