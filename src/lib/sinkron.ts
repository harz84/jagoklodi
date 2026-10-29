/**
 * Login dan sinkronisasi progres lewat Supabase.
 *
 * Prinsip:
 * - Local-first: situs tetap berfungsi penuh tanpa login dan tanpa Supabase.
 * - Pustaka Supabase hanya dimuat bila pengguna pernah login atau sedang membuka halaman Akun,
 *   jadi pengunjung biasa tidak mengunduh kode tambahan.
 * - Yang tersimpan di server hanya progres belajar; identitas yang tersimpan hanya email (di Supabase Auth).
 *
 * Konfigurasi lewat environment variable saat build (lihat docs/login.md):
 *   PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY
 * Keduanya memang aman untuk browser; keamanan data dijaga oleh Row Level Security di database.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { gabung, rapikan, sama } from './gabung';
import {
	bacaHapusTertunda,
	bacaProgres,
	EVENT_PROGRES_BERUBAH,
	hapusProgresLokal,
	kosongkanHapusTertunda,
	tulisProgres,
} from './progres';

const URL_SUPABASE = import.meta.env.PUBLIC_SUPABASE_URL as string | undefined;
const KEY_SUPABASE = import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY as string | undefined;
const KUNCI_SESI = 'jagoklodi:auth';
const KUNCI_TERAKHIR = 'jagoklodi:sinkron-terakhir';

export const loginAktif = Boolean(URL_SUPABASE && KEY_SUPABASE);

export type StatusSinkron = 'nonaktif' | 'keluar' | 'tersinkron' | 'gagal';

let klienPromise: Promise<SupabaseClient> | null = null;

/** Klien Supabase, dimuat sekali dan hanya bila diperlukan. */
export function klien(): Promise<SupabaseClient> | null {
	if (!loginAktif) return null;
	klienPromise ??= import('@supabase/supabase-js').then(({ createClient }) =>
		createClient(URL_SUPABASE!, KEY_SUPABASE!, {
			auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: KUNCI_SESI },
		}),
	);
	return klienPromise;
}

/** Cek murah tanpa memuat Supabase: apakah browser ini menyimpan sesi login. */
export function adaSesiTersimpan(): boolean {
	try {
		return loginAktif && localStorage.getItem(KUNCI_SESI) !== null;
	} catch {
		return false;
	}
}

export function waktuSinkronTerakhir(): string | null {
	try {
		return localStorage.getItem(KUNCI_TERAKHIR);
	} catch {
		return null;
	}
}

let sedangSinkron: Promise<StatusSinkron> | null = null;

/** Gabungkan progres browser dan server, lalu simpan hasilnya di keduanya. */
export function sinkronkan(): Promise<StatusSinkron> {
	sedangSinkron ??= jalankanSinkron().finally(() => {
		sedangSinkron = null;
	});
	return sedangSinkron;
}

async function jalankanSinkron(): Promise<StatusSinkron> {
	const k = klien();
	if (!k) return 'nonaktif';
	try {
		const sb = await k;
		const {
			data: { session },
		} = await sb.auth.getSession();
		if (!session) return 'keluar';
		const userId = session.user.id;

		const { data, error } = await sb.from('progres').select('selesai, kuis').eq('user_id', userId).maybeSingle();
		if (error) return 'gagal';

		const lokal = bacaProgres();
		const server = rapikan(data ?? {});
		const hapus = new Set(bacaHapusTertunda());
		const hasil = gabung(lokal, server);
		hasil.selesai = hasil.selesai.filter((p) => !hapus.has(p));

		if (!sama(hasil, server) || !data) {
			const { error: e2 } = await sb
				.from('progres')
				.upsert({ user_id: userId, selesai: hasil.selesai, kuis: hasil.kuis }, { onConflict: 'user_id' });
			if (e2) return 'gagal';
		}
		kosongkanHapusTertunda();
		if (!sama(hasil, lokal)) tulisProgres(hasil);
		try {
			localStorage.setItem(KUNCI_TERAKHIR, new Date().toISOString());
		} catch {
			/* abaikan */
		}
		return 'tersinkron';
	} catch {
		return 'gagal';
	}
}

/** Dipanggil di setiap halaman: sinkron saat dibuka, lalu setiap kali progres berubah. */
export function mulaiSinkronOtomatis() {
	if (!adaSesiTersimpan()) return;
	void sinkronkan();
	let jeda: ReturnType<typeof setTimeout> | undefined;
	window.addEventListener(EVENT_PROGRES_BERUBAH, () => {
		clearTimeout(jeda);
		jeda = setTimeout(() => void sinkronkan(), 1500);
	});
	// Kirim perubahan terakhir sebelum halaman ditutup atau berpindah.
	document.addEventListener('visibilitychange', () => {
		if (document.visibilityState === 'hidden' && jeda) {
			clearTimeout(jeda);
			jeda = undefined;
			void sinkronkan();
		}
	});
}

/** Kirim kode masuk (dan tautan) ke email. */
export async function kirimKode(email: string): Promise<string | null> {
	const k = klien();
	if (!k) return 'Fitur login belum diaktifkan.';
	const sb = await k;
	const { error } = await sb.auth.signInWithOtp({
		email,
		options: { emailRedirectTo: `${location.origin}/akun/`, shouldCreateUser: true },
	});
	return error ? pesanGalat(error.message, error.status) : null;
}

/** Masuk dengan kode 6 digit dari email. Berfungsi walau email dibuka di perangkat lain. */
export async function masukDenganKode(email: string, kode: string): Promise<string | null> {
	const k = klien();
	if (!k) return 'Fitur login belum diaktifkan.';
	const sb = await k;
	const { error } = await sb.auth.verifyOtp({ email, token: kode, type: 'email' });
	return error ? pesanGalat(error.message, error.status) : null;
}

export async function emailPengguna(): Promise<string | null> {
	const k = klien();
	if (!k) return null;
	const sb = await k;
	const {
		data: { session },
	} = await sb.auth.getSession();
	return session?.user.email ?? null;
}

/** Keluar. Progres tetap ada di browser ini. */
export async function keluar(): Promise<void> {
	const k = klien();
	if (!k) return;
	const sb = await k;
	await sb.auth.signOut();
	try {
		localStorage.removeItem(KUNCI_TERAKHIR);
	} catch {
		/* abaikan */
	}
}

/** Hapus progres di server dan di browser ini. */
export async function hapusProgresSaya(): Promise<string | null> {
	const k = klien();
	if (!k) return 'Fitur login belum diaktifkan.';
	const sb = await k;
	const {
		data: { session },
	} = await sb.auth.getSession();
	if (!session) return 'Anda belum masuk.';
	const { error } = await sb.from('progres').delete().eq('user_id', session.user.id);
	if (error) return 'Data di server belum terhapus. Coba lagi sebentar lagi.';
	hapusProgresLokal();
	return null;
}

function pesanGalat(pesan: string, status?: number): string {
	const p = pesan.toLowerCase();
	if (status === 429 || p.includes('rate limit') || p.includes('security purposes'))
		return 'Terlalu banyak permintaan. Tunggu sekitar satu menit, lalu coba lagi.';
	if (p.includes('expired') || p.includes('invalid')) return 'Kode salah atau sudah kedaluwarsa. Minta kode baru.';
	if (p.includes('not authorized') || p.includes('email address'))
		return 'Email ini belum bisa menerima kode. Pengelola situs perlu mengaktifkan pengiriman email untuk umum.';
	return 'Terjadi kesalahan. Periksa koneksi internet, lalu coba lagi.';
}
