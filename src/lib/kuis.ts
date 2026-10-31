/**
 * Pemeriksaan mutu soal kuis yang berjalan saat build (dipanggil dari Kuis.astro).
 *
 * Masalah yang dicegah: jawaban benar yang selalu paling panjang dan paling rinci.
 * Pembaca yang jeli bisa lulus hanya dengan memilih pilihan terpanjang, tanpa membaca pelajarannya.
 * Pengacakan urutan pilihan tidak menolong, karena yang bocor adalah panjangnya, bukan posisinya.
 *
 * Dua aturan:
 * 1. Per soal: jawaban benar tidak boleh lebih dari RASIO_MAKS kali pengecoh terpanjang.
 * 2. Per kuis: tidak ada satu "posisi panjang" yang terlalu sering menjadi jawaban benar.
 *    Jawaban benar paling banyak PORSI_UJUNG bagian soal sebagai pilihan terpanjang, dan sebanyak itu
 *    juga sebagai terpendek, serta paling banyak PORSI_TENGAH bagian soal di antara keduanya.
 *    Dengan begitu strategi "selalu pilih yang terpanjang/terpendek/sedang" tidak cukup untuk lulus 70%.
 *
 * Fungsi ini murni (tanpa efek samping) sehingga mudah diuji di tests/kuis.spec.ts.
 */
export interface Soal {
	tanya: string;
	pilihan: string[];
	jawaban: number;
	pembahasan: string;
}

export const RASIO_MAKS = 1.2;
export const PORSI_UJUNG = 0.4;
export const PORSI_TENGAH = 0.6;

const panjang = (teks: string) => teks.trim().length;

export function cekPanjangPilihan(soal: Soal[]): string[] {
	const masalah: string[] = [];
	let terpanjang = 0;
	let terpendek = 0;
	let tengah = 0;

	soal.forEach((s, i) => {
		const pj = s.pilihan.map(panjang);
		const benar = pj[s.jawaban];
		const pengecoh = pj.filter((_, j) => j !== s.jawaban);
		const maks = Math.max(...pengecoh);
		const min = Math.min(...pengecoh);
		if (benar > maks * RASIO_MAKS) {
			masalah.push(
				`soal ${i + 1}: jawaban benar ${benar} karakter, pengecoh terpanjang hanya ${maks}. ` +
					'Ringkas jawaban benar (pindahkan penjelasan ke pembahasan) atau buat pengecoh serinci jawaban benar.',
			);
		}
		if (benar > maks) terpanjang++;
		else if (benar < min) terpendek++;
		else tengah++;
	});

	const batas = Math.max(1, Math.floor(soal.length * PORSI_UJUNG));
	const batasTengah = Math.max(1, Math.floor(soal.length * PORSI_TENGAH));
	if (terpanjang > batas) {
		masalah.push(
			`jawaban benar menjadi pilihan terpanjang di ${terpanjang} dari ${soal.length} soal (maksimal ${batas}). ` +
				'Jadikan pengecoh sebagai pilihan terpanjang di sebagian soal.',
		);
	}
	if (terpendek > batas) {
		masalah.push(
			`jawaban benar menjadi pilihan terpendek di ${terpendek} dari ${soal.length} soal (maksimal ${batas}). ` +
				'Variasikan panjang pilihan agar tidak menjadi pola baru.',
		);
	}
	if (tengah > batasTengah) {
		masalah.push(
			`jawaban benar berada di antara pilihan terpanjang dan terpendek di ${tengah} dari ${soal.length} soal (maksimal ${batasTengah}). ` +
				'Jadikan jawaban benar sebagai pilihan terpanjang atau terpendek di beberapa soal.',
		);
	}
	return masalah;
}
