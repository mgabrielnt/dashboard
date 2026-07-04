# Professional Dashboard

Dashboard React + Express + PostgreSQL untuk visualisasi BKI, SCI, SI, calendar, profile, team, chart, export PDF, dan chatbot.

## Stack

- React 18 + Material UI
- Nivo charts
- FullCalendar
- Express API
- PostgreSQL
- JWT session authentication

## Run lokal

```bash
npm install
npm run dev
```

Perintah `npm run dev` menjalankan backend di port `5000` dan React client di port `3000`.

## Environment lokal

Buat file `.env` di root project untuk backend dan client development.

```env
NODE_ENV=development
PORT=5000
CORS_ORIGIN=http://localhost:3000

DB_USER=postgres_user
DB_HOST=localhost
DB_NAME=database_name
DB_PASSWORD=database_password
DB_PORT=5432
DB_SSL=false

JWT_SECRET=change_this_to_a_long_random_value
GOOGLE_CLIENT_ID=your_google_client_id
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
REACT_APP_API_URL=http://localhost:5000
```

Untuk database hosting seperti Render, Railway, Supabase, atau Neon, kamu bisa memakai `DATABASE_URL` dan `DB_SSL=true`.

## Build production

```bash
npm run build
npm start
```

`npm start` menjalankan Express server. Saat `NODE_ENV=production`, Express otomatis menyajikan React build dari folder `build` dan semua route React tetap aman ketika refresh halaman.

## Deploy production

Rekomendasi paling sederhana: deploy sebagai satu web service Node.js.

Build command:

```bash
npm install && npm run build
```

Start command:

```bash
npm start
```

Environment production minimal:

```env
NODE_ENV=production
PORT=10000
CORS_ORIGIN=https://domain-dashboard-kamu.com
DATABASE_URL=postgresql://user:password@host:5432/dbname
DB_SSL=true
JWT_SECRET=change_this_to_a_long_random_value
GOOGLE_CLIENT_ID=your_google_client_id
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
```

## Catatan penting

- Jangan commit file `.env` asli.
- Pastikan tabel PostgreSQL yang dipakai route sudah tersedia.
- Jika frontend dan backend dipisah domain, isi `REACT_APP_API_URL` dengan URL backend production.
- Jika memakai satu domain Node service, `REACT_APP_API_URL` boleh dikosongkan karena request API akan memakai path relative `/api`.
