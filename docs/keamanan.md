# Keamanan jagoklodi

Ringkasan pengamanan situs, untuk dibaca saat mengubah konfigurasi.

## Header keamanan (netlify.toml)

| Header | Fungsi |
| --- | --- |
| `Strict-Transport-Security` | Browser selalu memakai HTTPS untuk domain ini selama 1 tahun. |
| `X-Frame-Options: DENY` dan `frame-ancestors 'none'` | Situs tidak bisa dimuat di dalam situs lain (mencegah clickjacking). |
| `X-Content-Type-Options: nosniff` | Browser tidak menebak jenis file, sehingga file teks tidak bisa dijalankan sebagai skrip. |
| `Referrer-Policy` | Saat pengunjung mengklik tautan keluar, situs tujuan hanya tahu domainnya, bukan alamat halaman lengkap. |
| `Permissions-Policy` | Mematikan akses kamera, mikrofon, lokasi, pembayaran, dan USB yang memang tidak dipakai. |
| `Content-Security-Policy` | Hanya mengizinkan skrip, style, gambar, dan font dari domain sendiri. Koneksi keluar hanya ke domain sendiri dan `*.supabase.co` (login dan sinkron progres). |

### Kenapa CSP masih memakai `'unsafe-inline'`

Starlight memakai skrip dan style inline bawaan, misalnya untuk tema terang/gelap dan pewarnaan blok kode. CSP berbasis hash (`security.csp` di Astro) sudah dicoba pada 29 Oktober 2026 dan **merusak tampilan**: style inline dan sebagian skrip terblokir.

Risikonya kecil untuk situs ini, karena tidak ada konten dari pengguna dan tidak ada skrip pihak ketiga. CSP tetap memblokir skrip dari domain lain. Coba lagi bila Starlight sudah mendukung CSP ketat.

## Pemeriksaan otomatis

- `npm run build`: pemeriksaan konten, skema frontmatter, validasi kuis, dan tautan internal.
- `npm test`: uji di browser (desktop dan HP) untuk setiap halaman. Header dari `netlify.toml` ikut dipasang saat uji, jadi **perubahan CSP yang merusak situs akan membuat uji gagal**.
- GitHub Actions (`.github/workflows/ci.yml`) menjalankan keduanya di setiap pull request.
- Dependabot (`.github/dependabot.yml`) membuka PR untuk pembaruan paket setiap Senin.

## Login dan data pengguna

- Hanya publishable key Supabase yang ada di situs; secret key tidak pernah dipakai.
- Tabel `progres` dilindungi Row Level Security: setiap pengguna hanya bisa membaca dan mengubah barisnya sendiri (`supabase/migrations/0001_progres.sql`).
- Data pribadi yang tersimpan hanya email. Rincian untuk pengguna ada di halaman `/privasi/`; panduan aktivasi di `docs/login.md`.

## Formulir laporan kesalahan (Netlify Forms)

- Formulir ada di `src/components/FormLapor.astro` (halaman `/lapor/`). Netlify mendeteksinya dari HTML hasil build saat deploy; tidak ada server, function, atau API key milik kita.
- Dikirim dengan POST ke domain sendiri, jadi CSP tetap `form-action 'self'` dan tidak perlu domain tambahan.
- Spam disaring dua lapis: kolom jebakan (honeypot) `situs-web` dan Akismet bawaan Netlify. reCAPTCHA sengaja tidak dipakai karena memuat skrip dari domain Google dan butuh pelonggaran CSP.
- Tidak ada kolom email atau nama. Netlify tetap mencatat IP, user agent, dan referrer setiap kiriman; ini sudah dijelaskan di halaman `/privasi/`.
- Prefill kolom halaman dari `?halaman=` hanya menerima path internal (diawali `/`), dan nilainya diisi lewat `.value`, bukan HTML, sehingga tidak bisa disisipi skrip.
- Kiriman hanya diterima bila **form detection** aktif di Netlify (Forms → Enable form detection) dan baru berlaku setelah deploy berikutnya.

## Pengaturan akun (dilakukan pemilik)

- [ ] 2FA aktif di GitHub, Netlify, Sumopod, dan Supabase.
- [ ] Branch `main` dan `rilis` dilindungi: wajib pull request dan wajib lolos pemeriksaan **CI / Build dan uji**. Alur rilis ada di `docs/rilis.md`.
- [ ] Dependabot alerts dan security updates aktif (GitHub → Settings → Code security).
- [ ] Netlify Forms: notifikasi email kiriman `laporan-kesalahan` diarahkan ke email pengelola (Project configuration → Notifications → Emails and webhooks → Form submission notifications).
- [ ] Laporan yang sudah ditindaklanjuti dihapus dari Netlify, sesuai janji di halaman `/privasi/`.
