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
| `Content-Security-Policy` | Hanya mengizinkan skrip, style, gambar, dan font dari domain sendiri. |

### Kenapa CSP masih memakai `'unsafe-inline'`

Starlight memakai skrip dan style inline bawaan, misalnya untuk tema terang/gelap dan pewarnaan blok kode. CSP berbasis hash (`security.csp` di Astro) sudah dicoba pada 29 Oktober 2026 dan **merusak tampilan**: style inline dan sebagian skrip terblokir.

Risikonya kecil untuk situs ini, karena tidak ada konten dari pengguna dan tidak ada skrip pihak ketiga. CSP tetap memblokir skrip dari domain lain. Coba lagi bila Starlight sudah mendukung CSP ketat.

## Pemeriksaan otomatis

- `npm run build`: pemeriksaan konten, skema frontmatter, validasi kuis, dan tautan internal.
- `npm test`: uji di browser (desktop dan HP) untuk setiap halaman. Header dari `netlify.toml` ikut dipasang saat uji, jadi **perubahan CSP yang merusak situs akan membuat uji gagal**.
- GitHub Actions (`.github/workflows/ci.yml`) menjalankan keduanya di setiap pull request.
- Dependabot (`.github/dependabot.yml`) membuka PR untuk pembaruan paket setiap Senin.

## Pengaturan akun (dilakukan pemilik)

- [ ] 2FA aktif di GitHub, Netlify, dan Sumopod.
- [ ] Branch `main` dilindungi: wajib pull request dan wajib lolos pemeriksaan **CI / Build dan uji**.
- [ ] Dependabot alerts dan security updates aktif (GitHub → Settings → Code security).
