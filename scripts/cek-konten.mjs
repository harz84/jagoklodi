// Pemeriksaan sebelum build: setiap file di folder level-* wajib memuat komponen <Kuis>.
// Jumlah dan isi soal divalidasi oleh komponen Kuis saat build.
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const AKAR = 'src/content/docs';
const masalah = [];

for (const folder of await readdir(AKAR, { withFileTypes: true })) {
	if (!folder.isDirectory() || !/^level-\d$/.test(folder.name)) continue;
	for (const file of await readdir(join(AKAR, folder.name))) {
		const path = join(AKAR, folder.name, file);
		if (!file.endsWith('.mdx')) {
			masalah.push(`${path}: pelajaran harus berformat .mdx agar bisa memuat kuis.`);
			continue;
		}
		const isi = await readFile(path, 'utf8');
		if (!/<Kuis[\s/>]/.test(isi)) masalah.push(`${path}: belum ada komponen <Kuis>.`);
		if (!/<TandaSelesai\s*\/>/.test(isi)) masalah.push(`${path}: belum ada komponen <TandaSelesai />.`);
	}
}

if (masalah.length) {
	console.error('\n[jagoklodi] Pemeriksaan konten gagal:\n- ' + masalah.join('\n- ') + '\n');
	process.exit(1);
}
console.log('[jagoklodi] Pemeriksaan konten lolos.');
