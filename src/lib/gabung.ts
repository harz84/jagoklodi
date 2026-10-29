/**
 * Penggabungan progres dari dua sumber (browser dan server).
 * Fungsi murni tanpa efek samping, supaya mudah diuji.
 *
 * Aturannya sengaja "tidak pernah mundur":
 * - pelajaran yang selesai di salah satu sumber dianggap selesai;
 * - skor kuis diambil yang tertinggi, dan status lulus tidak pernah dicabut.
 * Akibatnya, menandai "belum selesai" di satu perangkat tidak menghapus status selesai
 * yang sudah tersinkron dari perangkat lain. Ini pilihan yang disengaja agar progres tidak hilang.
 */
export interface HasilKuis {
	terbaik: number;
	lulus: boolean;
}

export interface Progres {
	selesai: string[];
	kuis: Record<string, HasilKuis>;
}

export const PROGRES_KOSONG: Progres = { selesai: [], kuis: {} };

function skorValid(n: unknown): number {
	return typeof n === 'number' && Number.isFinite(n) ? Math.min(100, Math.max(0, Math.round(n))) : 0;
}

/** Bersihkan data yang datang dari luar (server atau localStorage) menjadi bentuk yang pasti benar. */
export function rapikan(input: unknown): Progres {
	const o = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
	const selesai = Array.isArray(o.selesai)
		? [...new Set(o.selesai.filter((x): x is string => typeof x === 'string' && x.startsWith('/')))]
		: [];
	const kuis: Record<string, HasilKuis> = {};
	if (o.kuis && typeof o.kuis === 'object' && !Array.isArray(o.kuis)) {
		for (const [path, h] of Object.entries(o.kuis as Record<string, unknown>)) {
			if (!path.startsWith('/') || !h || typeof h !== 'object') continue;
			const r = h as Record<string, unknown>;
			kuis[path] = { terbaik: skorValid(r.terbaik), lulus: r.lulus === true };
		}
	}
	return { selesai: selesai.sort(), kuis };
}

export function gabung(a: Progres, b: Progres): Progres {
	const x = rapikan(a);
	const y = rapikan(b);
	const kuis: Record<string, HasilKuis> = { ...x.kuis };
	for (const [path, h] of Object.entries(y.kuis)) {
		const lama = kuis[path];
		kuis[path] = lama ? { terbaik: Math.max(lama.terbaik, h.terbaik), lulus: lama.lulus || h.lulus } : h;
	}
	return { selesai: [...new Set([...x.selesai, ...y.selesai])].sort(), kuis };
}

/** True bila dua progres berisi data yang sama persis. */
export function sama(a: Progres, b: Progres): boolean {
	const x = rapikan(a);
	const y = rapikan(b);
	if (x.selesai.join('|') !== y.selesai.join('|')) return false;
	const kx = Object.keys(x.kuis).sort();
	const ky = Object.keys(y.kuis).sort();
	if (kx.join('|') !== ky.join('|')) return false;
	return kx.every((k) => x.kuis[k].terbaik === y.kuis[k].terbaik && x.kuis[k].lulus === y.kuis[k].lulus);
}
