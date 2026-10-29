# jagoklodi

Belajar Claude bertahap, dalam Bahasa Indonesia. Situs komunitas independen, tidak berafiliasi dengan Anthropic.

## Menjalankan di komputer sendiri

Butuh Node.js 22 atau lebih baru.

```bash
npm install
npm run dev      # buka http://localhost:4321
npm run build    # build produksi + validasi skema dan tautan
npm test         # uji di browser desktop dan HP (setelah build)
```

## Menambah pelajaran

1. Buat branch: `git switch -c pelajaran/04-prompt-jelas`
2. Salin `src/content/docs/level-0/01-kenalan-dengan-claude.mdx` sebagai template ke folder level yang sesuai.
3. Isi semua field frontmatter, termasuk `terakhirDiverifikasi`.
4. Jalankan `npm run build`; harus lolos.
5. Push, buka pull request, lalu review lewat deploy preview Netlify sebelum merge.

Aturan lengkap ada di `CLAUDE.md`.
