import { expect, test } from '@playwright/test';
import { ringkas, type ItemPelajaran } from '../src/lib/ringkasan';

const daftar: ItemPelajaran[] = [
	{ path: '/level-1/05-b/', level: 1, judul: '5. B', urutan: 5 },
	{ path: '/level-0/01-a/', level: 0, judul: '1. A', urutan: 1 },
	{ path: '/level-0/99-kuis/', level: 0, judul: 'Kuis akhir Level 0', urutan: 99 },
	{ path: '/level-1/04-c/', level: 1, judul: '4. C', urutan: 4 },
];

test.describe('ringkasan progres', () => {
	test('belum ada yang selesai: 0% dan berikutnya pelajaran pertama', () => {
		const r = ringkas(daftar, []);
		expect(r).toMatchObject({ total: 4, selesai: 0, persen: 0 });
		expect(r.berikutnya?.path).toBe('/level-0/01-a/');
	});

	test('dihitung per level, urut level lalu urutan', () => {
		const r = ringkas(daftar, ['/level-0/01-a/', '/level-1/04-c/']);
		expect(r).toMatchObject({ total: 4, selesai: 2, persen: 50 });
		expect(r.perLevel).toEqual([
			{ level: 0, total: 2, selesai: 1 },
			{ level: 1, total: 2, selesai: 1 },
		]);
		expect(r.berikutnya?.path).toBe('/level-0/99-kuis/');
	});

	test('path yang tidak ada di daftar diabaikan', () => {
		const r = ringkas(daftar, ['/level-9/hilang/', '/level-0/01-a/']);
		expect(r.selesai).toBe(1);
	});

	test('persen dibulatkan ke bawah; 100% hanya bila semua selesai', () => {
		const tiga = ringkas(daftar.slice(0, 3), ['/level-1/05-b/', '/level-0/01-a/']);
		expect(tiga.persen).toBe(66);
		const semua = ringkas(daftar, daftar.map((d) => d.path));
		expect(semua.persen).toBe(100);
		expect(semua.berikutnya).toBeUndefined();
	});
});
