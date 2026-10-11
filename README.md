# IoT Designer

Aplikasi web untuk merancang sistem IoT secara visual lalu menyimulasikannya langsung di browser.

- **Frontend:** React + TypeScript (Vite), React Flow
- **Backend:** Go + PostgreSQL

Status: tahap perencanaan. Lihat [docs/BLUEPRINT.md](docs/BLUEPRINT.md) untuk cakupan MVP, arsitektur, dan urutan pengerjaan.

## Menjalankan secara lokal

Butuh Node.js 20+, Go 1.24+, dan Docker.

```sh
docker compose up -d                 # PostgreSQL di localhost:5432
cd server && go run ./cmd/server     # API di localhost:8080
cd web && npm install && npm run dev # UI di localhost:5173
```

Buka http://localhost:5173. Halaman akan menampilkan `API: ok` kalau frontend sudah tersambung ke backend.

## Struktur

```
web/      React + Vite (editor/, components/, sim/, api/, pages/)
server/   Go API (cmd/server/, internal/, migrations/)
docs/     Blueprint dan dokumentasi
```
