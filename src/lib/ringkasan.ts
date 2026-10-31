/**
 * Ringkasan progres belajar: berapa pelajaran selesai, per level, dan pelajaran berikutnya.
 * Fungsi murni (tanpa localStorage atau DOM) supaya mudah diuji di tests/ringkasan.spec.ts.
 * Daftar pelajaran dibuat saat build oleh src/lib/daftar-pelajaran.ts.
 */

export interface ItemPelajaran {
	/** Path halaman, selalu diakhiri "/", misalnya "/level-0/01-kenalan-dengan-claude/". */
	path: string;
	level: number;
	judul: string;
	urutan: number;
}

export interface RingkasanLevel {
	level: number;
	total: number;
	selesai: number;
}

export interface Ringkasan {
	total: number;
	selesai: number;
	/** Dibulatkan ke bawah, supaya 100% hanya tampil bila semuanya benar-benar selesai. */
	persen: number;
	perLevel: RingkasanLevel[];
	/** Pelajaran pertama (urut level, lalu urutan) yang belum selesai; undefined bila semua selesai. */
	berikutnya?: ItemPelajaran;
}

export function urutkan(daftar: ItemPelajaran[]): ItemPelajaran[] {
	return [...daftar].sort((a, b) => a.level - b.level || a.urutan - b.urutan || a.path.localeCompare(b.path));
}

export function ringkas(daftar: ItemPelajaran[], selesai: Iterable<string>): Ringkasan {
	const sudah = new Set(selesai);
	const urut = urutkan(daftar);
	const perLevel = new Map<number, RingkasanLevel>();
	let jumlah = 0;
	for (const item of urut) {
		const lv = perLevel.get(item.level) ?? { level: item.level, total: 0, selesai: 0 };
		lv.total++;
		// Path di progres yang tidak ada di daftar (misalnya pelajaran yang sudah dihapus) diabaikan.
		if (sudah.has(item.path)) {
			lv.selesai++;
			jumlah++;
		}
		perLevel.set(item.level, lv);
	}
	return {
		total: urut.length,
		selesai: jumlah,
		persen: urut.length ? Math.floor((jumlah / urut.length) * 100) : 0,
		perLevel: [...perLevel.values()],
		berikutnya: urut.find((item) => !sudah.has(item.path)),
	};
}
