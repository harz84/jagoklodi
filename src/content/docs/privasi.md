---
title: Kebijakan privasi
description: Data apa yang dikumpulkan jagoklodi, untuk apa, di mana disimpan, dan cara menghapusnya.
prev: false
next: false
---

Terakhir diperbarui: 30 Oktober 2026.

jagoklodi mengumpulkan data sesedikit mungkin. Kebijakan ini disusun dengan mengacu pada UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi.

## Bila Anda tidak masuk (tanpa akun)

Tidak ada data pribadi yang dikirim ke server kami. Progres belajar dan skor kuis disimpan di **penyimpanan browser Anda sendiri** (localStorage) dan tidak pernah meninggalkan perangkat Anda. Anda bisa menghapusnya kapan saja dengan menghapus data situs di pengaturan browser.

## Bila Anda masuk dengan email

| Data | Untuk apa | Disimpan di |
| --- | --- | --- |
| Alamat email | Mengirim kode masuk dan mengenali akun Anda | Supabase Auth |
| Pelajaran yang sudah selesai | Menyinkronkan progres antarperangkat | Database Supabase |
| Skor terbaik dan status lulus kuis | Menyinkronkan progres antarperangkat | Database Supabase |

Kami **tidak** mengumpulkan nama, nomor telepon, lokasi, atau jawaban kuis satu per satu. Data tidak dijual, tidak dipakai untuk iklan, dan tidak dibagikan kepada pihak lain selain penyedia layanan di bawah.

Setiap baris progres dilindungi aturan database (Row Level Security): hanya akun Anda sendiri yang bisa membaca dan mengubahnya.

## Bila Anda mengirim laporan kesalahan

Formulir [Laporkan kesalahan](/lapor/) tidak meminta nama atau email.

| Data | Untuk apa | Disimpan di |
| --- | --- | --- |
| Isi formulir: halaman, jenis masalah, dan penjelasan | Memperbaiki materi | Netlify Forms |
| Alamat IP, jenis browser (user agent), dan halaman asal (referrer), dicatat otomatis oleh Netlify | Menyaring spam | Netlify Forms |

Mohon jangan menulis data pribadi di kolom penjelasan. Laporan dihapus dari Netlify setelah ditindaklanjuti.

## Penyedia layanan

- **Netlify**: hosting situs dan penampung laporan kesalahan (Netlify Forms). Seperti semua server web, Netlify mencatat data teknis kunjungan (misalnya alamat IP) untuk operasional dan keamanan.
- **Supabase**: layanan login dan database untuk pengguna yang masuk.

Situs ini belum memakai analytics, cookie pelacak, atau skrip pihak ketiga.

## Hak Anda

- **Melihat data**: buka halaman [Akun](/akun/) untuk melihat email dan jumlah progres yang tersimpan.
- **Menghapus progres**: di halaman [Akun](/akun/), pilih **Hapus progres saya**. Progres langsung terhapus dari server dan dari browser Anda.
- **Menghapus akun beserta email**: kirim permintaan kepada pengelola. Alamat kontak pengelola akan dicantumkan di bagian ini sebelum fitur login dibuka untuk umum.
- **Berhenti memakai akun**: pilih **Keluar** di halaman Akun. Anda tetap bisa belajar tanpa akun.

## Penyimpanan

Data disimpan selama akun Anda masih ada. Bila progres atau akun dihapus, datanya ikut terhapus dari database.

## Perubahan kebijakan

Bila kebijakan ini berubah, tanggal "terakhir diperbarui" di atas ikut diubah.
