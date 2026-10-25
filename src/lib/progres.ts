/**
 * Progres belajar disimpan di localStorage browser pengguna.
 * Tidak ada server: progres hanya ada di browser itu saja dan bisa hilang
 * bila data situs dihapus atau dibuka di mode privat.
 */
const KUNCI = 'jagoklodi:selesai';

/** Normalisasi path supaya "/level-0/x" dan "/level-0/x/" dianggap sama. */
export function normalPath(path: string): string {
	return path.endsWith('/') ? path : `${path}/`;
}

export function bacaSelesai(): string[] {
	try {
		const isi = JSON.parse(localStorage.getItem(KUNCI) ?? '[]');
		return Array.isArray(isi) ? isi.filter((x): x is string => typeof x === 'string').map(normalPath) : [];
	} catch {
		return [];
	}
}

export function setSelesai(path: string, selesai: boolean): boolean {
	try {
		const daftar = new Set(bacaSelesai());
		const p = normalPath(path);
		if (selesai) daftar.add(p);
		else daftar.delete(p);
		localStorage.setItem(KUNCI, JSON.stringify([...daftar]));
		return true;
	} catch {
		return false;
	}
}
