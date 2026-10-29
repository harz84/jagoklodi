import { expect, test } from '@playwright/test';
import { gabung, rapikan, sama } from '../src/lib/gabung';

// Uji fungsi murni; tidak membuka browser.
test.describe('penggabungan progres', () => {
	test('pelajaran selesai dari kedua perangkat digabung tanpa duplikat', () => {
		const hp = { selesai: ['/level-0/01/', '/level-0/02/'], kuis: {} };
		const laptop = { selesai: ['/level-0/02/', '/level-1/04/'], kuis: {} };
		expect(gabung(hp, laptop).selesai).toEqual(['/level-0/01/', '/level-0/02/', '/level-1/04/']);
	});

	test('skor kuis diambil yang tertinggi dan status lulus tidak pernah dicabut', () => {
		const a = { selesai: [], kuis: { '/p/': { terbaik: 100, lulus: true } } };
		const b = { selesai: [], kuis: { '/p/': { terbaik: 40, lulus: false }, '/q/': { terbaik: 80, lulus: true } } };
		expect(gabung(a, b).kuis).toEqual({ '/p/': { terbaik: 100, lulus: true }, '/q/': { terbaik: 80, lulus: true } });
		expect(gabung(b, a).kuis).toEqual(gabung(a, b).kuis);
	});

	test('data rusak atau aneh dari luar dibersihkan', () => {
		const kotor = { selesai: ['/ok/', 42, 'bukan-path', '/ok/'], kuis: { '/x/': { terbaik: 250, lulus: 'ya' }, tanpa: { terbaik: 10 }, '/y/': null } };
		expect(rapikan(kotor)).toEqual({ selesai: ['/ok/'], kuis: { '/x/': { terbaik: 100, lulus: false } } });
		expect(rapikan(null)).toEqual({ selesai: [], kuis: {} });
		expect(rapikan('teks')).toEqual({ selesai: [], kuis: {} });
	});

	test('perbandingan sama() mengabaikan urutan', () => {
		const a = { selesai: ['/b/', '/a/'], kuis: { '/a/': { terbaik: 90, lulus: true } } };
		const b = { selesai: ['/a/', '/b/'], kuis: { '/a/': { terbaik: 90, lulus: true } } };
		expect(sama(a, b)).toBe(true);
		expect(sama(a, { ...b, selesai: ['/a/'] })).toBe(false);
		expect(sama(a, { ...b, kuis: { '/a/': { terbaik: 80, lulus: true } } })).toBe(false);
	});
});
