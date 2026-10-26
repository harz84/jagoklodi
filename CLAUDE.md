# jagoklodi: aturan proyek untuk Claude Code

Situs belajar Claude berbahasa Indonesia, dibangun dengan Astro + Starlight dan di-deploy ke Netlify (jagoklodi.web.id).

## Perintah

- `npm run dev`: server lokal di http://localhost:4321
- `npm run build`: build produksi, termasuk validasi skema frontmatter dan tautan internal. WAJIB lolos sebelum pekerjaan dinyatakan selesai.

## Struktur

- `src/content/docs/level-N/NN-judul.mdx`: satu file per pelajaran, nomor urut dua digit.
- `src/content.config.ts`: skema frontmatter.
- `src/components/PageTitle.astro`: info pelajaran dan penjaga kelengkapan frontmatter (build gagal bila kurang).
- `src/components/TandaSelesai.astro`: tombol progres (localStorage), dipasang di akhir setiap pelajaran; terkunci sampai kuis lulus.
- `src/components/Kuis.astro`: kuis pilihan ganda dengan validasi saat build.
- `src/components/Footer.astro`: disclaimer dan centang progres di sidebar.

## Aturan materi

- Bahasa Indonesia baku yang ramah. Istilah teknis tetap dalam bahasa Inggris dan dijelaskan saat pertama kali muncul.
- Setiap pelajaran mengikuti format baku, dengan contoh di `src/content/docs/level-0/01-kenalan-dengan-claude.mdx`:
  Tujuan → Penjelasan singkat → Langkah (komponen Steps) → Contoh nyata → Latihan dengan kriteria berhasil → Kesalahan umum → Rujukan → `## Kuis` + `<Kuis />` → `<TandaSelesai />`.
- Kuis (`src/components/Kuis.astro`): pelajaran wajib 3–5 soal pilihan ganda; halaman kuis akhir level (`jenis: kuis`) minimal 10 soal. Setiap soal wajib punya pembahasan. Urutan pilihan diacak otomatis, jadi jangan pakai pilihan "Semua benar" atau "A dan B". Soal hanya boleh menguji isi pelajaran itu sendiri.
- Tombol "Tandai selesai" terkunci sampai kuis lulus (skor minimal 70%). Skor terbaik disimpan di localStorage.
- `scripts/cek-konten.mjs` berjalan sebelum build dan gagal bila ada pelajaran tanpa `<Kuis>` atau `<TandaSelesai />`.
- Frontmatter wajib untuk pelajaran: `jenis: pelajaran`, `level`, `durasi`, `prasyarat`, `terakhirDiverifikasi` (YYYY-MM-DD), `sidebar.order`.
- Jangan mengarang fitur, harga, kuota, atau nama model. Harga dan kuota cukup ditautkan ke halaman resmi. Setiap klaim produk harus punya tautan ke sumber resmi (support.claude.com, docs.claude.com, anthropic.skilljar.com).
- Saat memperbarui isi pelajaran setelah dicek ulang, perbarui juga `terakhirDiverifikasi`.
- Semua contoh memakai data fiktif. Jangan pernah memakai data pelanggan, data kantor, atau data pribadi asli.
- Kurangi screenshot; utamakan nama menu dan teks prompt.

## Aturan merek

- Jangan memakai logo, ikon, atau aset visual Anthropic.
- Jangan memakai kata "resmi", "official", atau "Anthropic" sebagai bagian dari nama, tagline, atau domain.
- Disclaimer di footer tidak boleh dihapus.

## Alur git

- Jangan pernah push langsung ke `main`. Selalu buat branch (`pelajaran/NN-judul` atau `fitur/nama`) lalu buka pull request.
- Deploy preview Netlify dipakai untuk review sebelum merge.
