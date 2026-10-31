# Alur rilis jagoklodi

Situs memakai paket **Free** Netlify berbasis kredit: 300 kredit per bulan untuk seluruh tim, dibagi ke semua situs di tim itu. Saat kredit habis, deploy produksi diblokir sampai periode berikutnya.

| Jenis deploy | Kredit | Kapan terjadi |
| --- | --- | --- |
| Deploy produksi | 15 | Setiap commit baru di production branch |
| Deploy Preview | 0 | Setiap pull request |
| Branch deploy | 0 | Setiap commit baru di branch yang didaftarkan sebagai branch deploy |

Dulu setiap merge ke `main` langsung menjadi deploy produksi, sehingga 16 merge dalam 6 hari memakai sekitar 240 kredit. Karena itu production branch dipisah dari `main`.

## Dua branch

| Branch | Peran | Tayang di | Biaya |
| --- | --- | --- | --- |
| `main` | Tempat semua pekerjaan digabung (integrasi) | `main--jagoklodi.netlify.app` (branch deploy) | Gratis |
| `rilis` | Production branch | jagoklodi.web.id | 15 kredit per rilis |

## Alur sehari-hari

1. Pekerjaan dibuat di branch `pelajaran/...` atau `fitur/...`, lalu PR ke `main`. Review lewat Deploy Preview (gratis).
2. Merge ke `main`. Hasil gabungan bisa dicek di `main--jagoklodi.netlify.app` (gratis).
3. Ulangi sesering apa pun. Belum ada kredit yang terpakai.

## Rilis (sekitar seminggu sekali)

1. Buka PR **dari `main` ke `rilis`** dengan judul `Rilis YYYY-MM-DD` dan daftar perubahan di deskripsi. Di GitHub: **Pull requests → New pull request**, base `rilis`, compare `main`. Claude bisa membukakannya bila diminta "rilis".
2. Pastikan CI lolos dan cek Deploy Preview PR rilis itu sekali lagi.
3. Merge dengan **Create a merge commit** (bukan squash), supaya riwayat `rilis` tetap sejalan dengan `main`.
4. Netlify membuat satu deploy produksi (15 kredit).

**Pengecualian, rilis segera:** perbaikan keamanan (termasuk PR keamanan dari Dependabot) dan kesalahan materi yang bisa merugikan pembaca, misalnya langkah yang membuat data terhapus.

## Aturan

- Jangan pernah push atau membuka PR langsung ke `rilis` selain dari `main`. Perbaikan darurat tetap lewat PR ke `main` dulu, lalu rilis.
- Pengaturan bersama (CSP, header) ada di `netlify.toml` dan berlaku untuk semua konteks deploy, jadi branch deploy `main` sudah memakai header yang sama dengan produksi.
- Tag kanonik setiap halaman menunjuk ke jagoklodi.web.id (`site` di `astro.config.mjs`), sehingga branch deploy tidak dianggap duplikat oleh mesin pencari.

## Pengaturan yang dilakukan pemilik (sekali saja)

Urutannya penting: branch `rilis` harus sudah ada di GitHub sebelum production branch diganti.

1. **Netlify → project jagoklodi → Project configuration → Developer settings → Continuous deployment → Branches and deploy contexts → Configure:**
   - Production branch: `rilis`
   - Branch deploys: **Let me add individual branches** → `main`
   - Deploy Previews: biarkan aktif untuk pull request
2. **GitHub → Settings → Branches:** tambahkan aturan perlindungan untuk `rilis` yang sama dengan `main` (wajib PR, wajib lolos **CI / Build dan uji**).
3. Rilis pertama: merge PR rilis pertama, atau tekan **Trigger deploy** di halaman Deploys bila `rilis` sudah sama dengan `main`. Bila kredit bulan ini sudah habis, deploy baru berhasil setelah periode kredit berganti.

## Memantau kredit

Netlify → team → **Usage & billing**. Dengan rilis mingguan, jagoklodi memakai sekitar 60–75 kredit per bulan, sehingga situs lain di tim masih punya ruang.
