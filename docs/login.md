# Mengaktifkan login dan sinkron progres

Fitur login **nonaktif** sampai dua environment variable diisi di Netlify. Selama nonaktif, situs berjalan seperti biasa dan progres tersimpan di browser.

Nama menu Supabase bisa berubah. Bila ada yang berbeda, cari menu dengan nama yang mirip.

## 1. Buat proyek Supabase

1. Daftar di [supabase.com](https://supabase.com) (bisa memakai akun GitHub). **Aktifkan 2FA** di akun Supabase.
2. **New project**:
   - Name: `jagoklodi`
   - Region: **Southeast Asia (Singapore)**, yang terdekat dengan pengguna Indonesia
   - Database password: buat yang kuat dan simpan di password manager. Password ini **tidak** dipakai oleh situs.

## 2. Buat tabel dan aturan keamanannya

1. Buka **SQL Editor** → **New query**.
2. Tempel seluruh isi `supabase/migrations/0001_progres.sql`, lalu klik **Run**.
3. Pastikan muncul pesan sukses. File ini aman dijalankan ulang.

## 3. Atur alamat situs

Buka **Authentication → URL Configuration**:

- **Site URL**: `https://jagoklodi.web.id`
- **Redirect URLs**, tambahkan keempatnya:
  - `https://jagoklodi.web.id/**`
  - `https://www.jagoklodi.web.id/**`
  - `https://deploy-preview-*--jagoklodi.netlify.app/**`
  - `http://localhost:4321/**`

## 4. Tambahkan kode 6 digit di email

Kode 6 digit membuat login berhasil walaupun email dibuka di perangkat lain (misalnya email di HP, belajar di laptop).

Buka **Authentication → Emails → Templates**, lalu ubah **kedua** template berikut. **Confirm signup** dipakai saat seseorang masuk untuk pertama kali; **Magic Link** dipakai untuk login berikutnya. Tanpa `{{ .Token }}`, email hanya berisi tautan, dan tautan itu hanya berfungsi di browser yang sama dengan tempat kode diminta.

```html
<h2>Masuk ke jagoklodi</h2>
<p>Kode masuk Anda:</p>
<p style="font-size:28px;font-weight:bold;letter-spacing:4px">{{ .Token }}</p>
<p>Atau klik tautan ini dari browser yang sama: <a href="{{ .ConfirmationURL }}">Masuk</a></p>
<p>Abaikan email ini bila Anda tidak meminta kode masuk.</p>
```

Subjek yang disarankan: `Kode masuk jagoklodi`.

## 5. Isi environment variable di Netlify

1. Di Supabase, buka **Project Settings → API Keys**. Salin:
   - **Project URL** (`https://xxxx.supabase.co`)
   - **Publishable key** (`sb_publishable_...`)
2. **Jangan** menyalin **secret key** (`sb_secret_...`). Kunci itu tidak boleh berada di situs atau repo.
3. Di Netlify: **Site configuration → Environment variables → Add a variable**:
   - `PUBLIC_SUPABASE_URL` = Project URL
   - `PUBLIC_SUPABASE_PUBLISHABLE_KEY` = Publishable key
4. **Deploys → Trigger deploy → Deploy site**. Variabel baru terbaca saat build berikutnya.

Publishable key memang aman berada di browser. Yang menjaga data adalah Row Level Security dari langkah 2: setiap pengguna hanya bisa membaca dan mengubah barisnya sendiri.

## 6. Coba

1. Buka `https://jagoklodi.web.id/akun/`, masukkan email **yang dipakai untuk akun Supabase Anda**, lalu masukkan kode dari email.
2. Tandai satu pelajaran selesai.
3. Buka situs di perangkat atau browser lain, masuk dengan email yang sama, dan pastikan progres yang sama muncul.

## Batasan paket gratis

| Batasan | Dampak | Solusi |
| --- | --- | --- |
| Email bawaan Supabase hanya terkirim ke **anggota tim proyek**, maksimal **2 email per jam** | Cukup untuk Anda sendiri, belum cukup untuk umum | Sebelum dibuka untuk umum, pasang SMTP sendiri (misalnya Resend atau Brevo) di **Authentication → Emails → SMTP Settings** |
| Proyek gratis **dihentikan sementara setelah 7 hari tanpa aktivitas** | Situs tetap jalan; hanya login dan sinkron yang gagal sampai proyek diaktifkan lagi | Klik **Restore** di dashboard Supabase, atau naik ke paket berbayar bila pengguna sudah banyak |

## Menghapus akun pengguna

Pengguna bisa menghapus progresnya sendiri di halaman Akun. Untuk menghapus akun beserta emailnya: Supabase → **Authentication → Users** → pilih pengguna → **Delete user**. Baris progresnya ikut terhapus otomatis.
