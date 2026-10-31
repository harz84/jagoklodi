# jagoklodi: aturan proyek untuk Claude Code

Situs belajar Claude berbahasa Indonesia, dibangun dengan Astro + Starlight dan di-deploy ke Netlify (jagoklodi.web.id).

## Perintah

- `npm run dev`: server lokal di http://localhost:4321
- `npm run build`: build produksi, termasuk validasi skema frontmatter dan tautan internal. WAJIB lolos sebelum pekerjaan dinyatakan selesai.
- `npm test`: uji Playwright di browser desktop dan HP untuk setiap halaman (jalankan setelah `npm run build`). Header produksi dari `netlify.toml`, termasuk CSP, ikut dipasang saat uji. WAJIB lolos sebelum membuka PR.
- CI (`.github/workflows/ci.yml`) menjalankan build dan uji di setiap PR. Penjelasan keamanan ada di `docs/keamanan.md`.

## Struktur

- `src/content/docs/level-N/NN-judul.mdx`: satu file per pelajaran, nomor urut dua digit.
- `src/content.config.ts`: skema frontmatter.
- `src/components/PageTitle.astro`: info pelajaran dan penjaga kelengkapan frontmatter (build gagal bila kurang).
- `src/components/TandaSelesai.astro`: tombol progres (localStorage), dipasang di akhir setiap pelajaran; terkunci sampai kuis lulus.
- `src/components/Kuis.astro`: kuis pilihan ganda dengan validasi saat build.
- `src/components/Footer.astro`: tautan "Laporkan kesalahan", disclaimer, dan centang progres di sidebar.
- `src/components/FormLapor.astro` + halaman `/lapor/` dan `/lapor/terima/`: formulir laporan kesalahan via Netlify Forms (tanpa email, dengan honeypot). Jangan ganti nama formulir atau nama field tanpa alasan: dashboard Netlify hanya menampilkan field dari versi terakhir.
- `src/components/Header.astro` (salinan Header bawaan Starlight; bandingkan saat memperbarui Starlight) memuat `TombolMenu.astro` (sembunyikan/tampilkan menu kiri di layar lebar, diingat di localStorage) dan `IndikatorAkun.astro` (status login: Masuk/Akun).
- `src/components/Sidebar.astro` + `ProgresSidebar.astro`: bilah progres keseluruhan di atas menu dan angka selesai/total per grup Level. `ProgresBeranda.astro`: kartu "Progres Anda" di beranda. Daftar pelajaran dibuat saat build oleh `src/lib/daftar-pelajaran.ts`; perhitungannya di `src/lib/ringkasan.ts` (fungsi murni, diuji di `tests/ringkasan.spec.ts`).
- Grup sidebar memakai `collapsed: true`: hanya grup Level yang sedang dibaca yang terbuka otomatis. Grup Level baru juga wajib diberi `collapsed: true`.
- `src/lib/progres.ts`: progres di localStorage (local-first). `src/lib/gabung.ts`: penggabungan progres browser dan server (fungsi murni, diuji di `tests/gabung.spec.ts`).
- `src/lib/sinkron.ts` + `src/components/Akun.astro` + halaman `/akun/`: login email (Supabase) dan sinkron progres. Nonaktif bila `PUBLIC_SUPABASE_URL` dan `PUBLIC_SUPABASE_PUBLISHABLE_KEY` kosong. Panduan aktivasi: `docs/login.md`.
- `supabase/migrations/`: skema database dan Row Level Security. Setiap perubahan skema = file migrasi baru, jangan ubah file lama.

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

## Aturan keamanan

- Jangan pernah menyimpan rahasia (API key, token, password) di repo; repo ini publik.
- Hanya publishable key Supabase (`sb_publishable_...`) yang boleh dipakai di situs. Secret key (`sb_secret_...`) tidak boleh ada di kode, repo, atau environment variable Netlify.
- Setiap tabel baru di Supabase wajib mengaktifkan Row Level Security dengan policy yang membatasi akses ke baris milik pengguna itu sendiri.
- Data pribadi yang disimpan hanya email (di Supabase Auth) dan metadata teknis kiriman laporan yang dicatat Netlify Forms (IP, user agent, referrer). Menambah jenis data pribadi baru, termasuk kolom baru di formulir, wajib memperbarui halaman `/privasi/`.
- Uji login memakai Supabase tiruan (`tests/login.spec.ts`); jalankan dengan build yang mengisi PUBLIC_SUPABASE_* dengan nilai uji.
- Jangan menambah skrip, font, atau layanan dari domain luar tanpa memperbarui CSP di `netlify.toml` dan `docs/keamanan.md`.

## Alur git

- Jangan pernah push langsung ke `main` atau `rilis`. Selalu buat branch (`pelajaran/NN-judul` atau `fitur/nama`) lalu buka pull request ke `main`.
- Deploy preview Netlify dipakai untuk review sebelum merge.
- Production branch Netlify adalah `rilis`, bukan `main`. Merge ke `main` gratis (branch deploy di `main--jagoklodi.netlify.app`); setiap merge ke `rilis` adalah deploy produksi yang memakai 15 kredit dari kuota 300 kredit per bulan.
- Rilis hanya lewat PR dari `main` ke `rilis`, sekitar seminggu sekali atau saat pemilik meminta "rilis". Pengecualian: perbaikan keamanan dan kesalahan materi yang merugikan pembaca dirilis segera. Detail di `docs/rilis.md`.
