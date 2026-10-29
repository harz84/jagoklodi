/**
 * Progres belajar disimpan di localStorage browser pengguna (local-first).
 * Bila pengguna login, src/lib/sinkron.ts menyalin dan menggabungkan progres ini
 * dengan salinan di server, sehingga sama di semua perangkat.
 */
import { rapikan, type HasilKuis, type Progres } from './gabung';

export type { HasilKuis, Progres };

const KUNCI = 'jagoklodi:selesai';
const KUNCI_KUIS = 'jagoklodi:kuis';
/** Path yang ditandai "belum selesai" dan belum sempat dihapus dari server. */
const KUNCI_HAPUS = 'jagoklodi:hapus-tertunda';

/** Dikirim setiap kali pengguna mengubah progres (tandai selesai, kuis). */
export const EVENT_PROGRES_BERUBAH = 'jagoklodi:progres-berubah';
/** Dikirim setelah progres dari server digabungkan, agar tampilan menyegarkan diri. */
export const EVENT_PROGRES_DIMUAT = 'jagoklodi:progres-dimuat';
/** Nama event yang dikirim komponen Kuis saat pengguna lulus. */
export const EVENT_KUIS_LULUS = 'jagoklodi:kuis-lulus';

/** Normalisasi path supaya "/level-0/x" dan "/level-0/x/" dianggap sama. */
export function normalPath(path: string): string {
	return path.endsWith('/') ? path : `${path}/`;
}

function bacaJson<T>(kunci: string, cadangan: T): T {
	try {
		const isi = localStorage.getItem(kunci);
		return isi === null ? cadangan : (JSON.parse(isi) as T);
	} catch {
		return cadangan;
	}
}

function kabarkanBerubah() {
	window.dispatchEvent(new CustomEvent(EVENT_PROGRES_BERUBAH));
}

export function bacaSelesai(): string[] {
	const isi = bacaJson<unknown>(KUNCI, []);
	return Array.isArray(isi) ? isi.filter((x): x is string => typeof x === 'string').map(normalPath) : [];
}

export function setSelesai(path: string, selesai: boolean): boolean {
	try {
		const daftar = new Set(bacaSelesai());
		const hapus = new Set(bacaHapusTertunda());
		const p = normalPath(path);
		if (selesai) {
			daftar.add(p);
			hapus.delete(p);
		} else {
			daftar.delete(p);
			hapus.add(p);
		}
		localStorage.setItem(KUNCI, JSON.stringify([...daftar]));
		localStorage.setItem(KUNCI_HAPUS, JSON.stringify([...hapus]));
		kabarkanBerubah();
		return true;
	} catch {
		return false;
	}
}

/* ---------- Kuis ---------- */

function bacaSemuaKuis(): Record<string, HasilKuis> {
	const isi = bacaJson<unknown>(KUNCI_KUIS, {});
	return isi && typeof isi === 'object' && !Array.isArray(isi) ? (isi as Record<string, HasilKuis>) : {};
}

export function bacaKuis(path: string): HasilKuis | undefined {
	const h = bacaSemuaKuis()[normalPath(path)];
	return h && typeof h.terbaik === 'number' ? { terbaik: h.terbaik, lulus: Boolean(h.lulus) } : undefined;
}

/** Simpan hasil percobaan; skor terbaik dan status lulus tidak pernah turun. Mengembalikan null bila penyimpanan gagal. */
export function simpanKuis(path: string, skor: number, lulus: boolean): HasilKuis | null {
	try {
		const semua = bacaSemuaKuis();
		const p = normalPath(path);
		const lama = semua[p];
		const baru: HasilKuis = {
			terbaik: Math.max(skor, lama?.terbaik ?? 0),
			lulus: lulus || Boolean(lama?.lulus),
		};
		semua[p] = baru;
		localStorage.setItem(KUNCI_KUIS, JSON.stringify(semua));
		kabarkanBerubah();
		return baru;
	} catch {
		return null;
	}
}

/* ---------- Untuk sinkronisasi ---------- */

/** Seluruh progres di browser ini, dalam bentuk yang sudah dirapikan. */
export function bacaProgres(): Progres {
	return rapikan({ selesai: bacaSelesai(), kuis: bacaSemuaKuis() });
}

/** Timpa progres di browser ini (dipakai setelah digabung dengan server). Tidak memicu sinkron ulang. */
export function tulisProgres(p: Progres): boolean {
	try {
		const r = rapikan(p);
		localStorage.setItem(KUNCI, JSON.stringify(r.selesai));
		localStorage.setItem(KUNCI_KUIS, JSON.stringify(r.kuis));
		window.dispatchEvent(new CustomEvent(EVENT_PROGRES_DIMUAT));
		return true;
	} catch {
		return false;
	}
}

export function bacaHapusTertunda(): string[] {
	const isi = bacaJson<unknown>(KUNCI_HAPUS, []);
	return Array.isArray(isi) ? isi.filter((x): x is string => typeof x === 'string') : [];
}

export function kosongkanHapusTertunda() {
	try {
		localStorage.removeItem(KUNCI_HAPUS);
	} catch {
		/* abaikan */
	}
}

/** Hapus seluruh progres di browser ini (dipakai saat pengguna menghapus datanya). */
export function hapusProgresLokal() {
	try {
		for (const k of [KUNCI, KUNCI_KUIS, KUNCI_HAPUS]) localStorage.removeItem(k);
		window.dispatchEvent(new CustomEvent(EVENT_PROGRES_DIMUAT));
	} catch {
		/* abaikan */
	}
}
