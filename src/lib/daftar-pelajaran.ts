/**
 * Daftar semua halaman yang bisa ditandai selesai (pelajaran dan kuis akhir level), dibuat saat build.
 * Hanya dipakai di bagian server komponen Astro; hasilnya dikirim ke browser lewat atribut data-daftar.
 */
import { getCollection } from 'astro:content';
import { urutkan, type ItemPelajaran } from './ringkasan';

let simpanan: Promise<ItemPelajaran[]> | undefined;

export function daftarPelajaran(): Promise<ItemPelajaran[]> {
	simpanan ??= getCollection('docs', (e) => e.data.jenis === 'pelajaran' || e.data.jenis === 'kuis').then((entri) =>
		urutkan(
			entri.map((e) => ({
				path: `/${e.id}/`,
				level: e.data.level ?? 0,
				judul: e.data.sidebar?.label ?? e.data.title,
				urutan: e.data.sidebar?.order ?? 999,
			})),
		),
	);
	return simpanan;
}
