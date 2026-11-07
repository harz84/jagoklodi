import { expect, test } from '@playwright/test';
import { cekPanjangPilihan, type Soal } from '../src/lib/kuis';

// Uji fungsi murni; tidak membuka browser.
const soal = (pilihan: string[], jawaban = 0): Soal => ({ tanya: 'T', pilihan, jawaban, pembahasan: 'P' });

test.describe('pemeriksaan panjang pilihan kuis', () => {
	test('kuis yang panjang pilihannya bervariasi lolos', () => {
		// Satu soal jawaban benarnya di tengah, satu terpanjang (tipis), satu terpendek.
		const kuis = [
			soal(['Jawaban yang tepat', 'Pengecoh agak panjang sekali', 'Pengecoh pendek']),
			soal(['Jawaban benar', 'Pengecoh 1x', 'Pengecoh 2']),
			soal(['Benar', 'Pengecoh satu', 'Pengecoh dua']),
		];
		expect(cekPanjangPilihan(kuis)).toEqual([]);
	});

	test('jawaban benar yang jauh lebih panjang dari semua pengecoh ditolak', () => {
		const kuis = [soal(['Jawaban benar yang panjang dan sangat rinci sekali', 'Salah', 'Keliru']), soal(['A', 'B', 'C']), soal(['A', 'B', 'C'])];
		const masalah = cekPanjangPilihan(kuis);
		expect(masalah.some((m) => m.startsWith('soal 1:'))).toBe(true);
	});

	test('jawaban benar yang selalu sedikit lebih panjang tetap ditolak sebagai pola', () => {
		// Selisihnya kecil (lolos aturan per soal), tetapi selalu menjadi yang terpanjang.
		const kuis = Array.from({ length: 5 }, () => soal(['Jawaban benar x', 'Pengecoh satu', 'Pengecoh dua']));
		const masalah = cekPanjangPilihan(kuis);
		expect(masalah).toHaveLength(1);
		expect(masalah[0]).toContain('terpanjang di 5 dari 5 soal');
	});

	test('pola kebalikannya (jawaban benar selalu terpendek) juga ditolak', () => {
		const kuis = Array.from({ length: 5 }, () => soal(['Benar', 'Pengecoh pertama', 'Pengecoh kedua']));
		expect(cekPanjangPilihan(kuis)[0]).toContain('terpendek di 5 dari 5 soal');
	});

	test('jawaban benar yang selalu berpanjang sedang juga ditolak', () => {
		// Strategi "pilih yang sedang" tidak boleh cukup untuk lulus.
		const kuis = Array.from({ length: 5 }, () => soal(['Jawaban sedang', 'Pendek', 'Pengecoh paling panjang']));
		expect(cekPanjangPilihan(kuis)[0]).toContain('di antara pilihan terpanjang dan terpendek di 5 dari 5 soal');
	});

	test('panjang yang sama dengan pengecoh tidak dihitung sebagai terpanjang', () => {
		// Bila soal pertama dihitung terpanjang, kuis ini akan punya dua soal terpanjang dan gagal.
		const kuis = [
			soal(['Sama', 'Sama', 'Beda panjang']),
			soal(['Jawaban panjang', 'Pendek', 'Hampir panjang']),
			soal(['Pdk', 'Pengecoh satu', 'Pengecoh dua']),
		];
		expect(cekPanjangPilihan(kuis)).toEqual([]);
	});
});
