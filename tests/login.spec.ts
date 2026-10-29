import { expect, test, type BrowserContext, type Page } from '@playwright/test';
import { pantauMasalah, pasangHeaderProduksi } from './bantu';

/**
 * Uji login dan sinkron progres dengan Supabase TIRUAN (tidak ada data sungguhan yang dikirim).
 * Hanya berjalan bila situs di-build dengan login aktif, misalnya:
 *   PUBLIC_SUPABASE_URL=https://uji.supabase.co PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_uji npm run build
 *   npx playwright test tests/login.spec.ts
 * Build tanpa variabel itu (seperti di CI) membuat uji ini dilewati.
 */

const L1 = '/level-0/01-kenalan-dengan-claude/';
const L2 = '/level-0/02-paket-model-batas/';
const L3 = '/level-0/03-privasi-keamanan/';

interface Baris {
	user_id: string;
	selesai: string[];
	kuis: Record<string, { terbaik: number; lulus: boolean }>;
}

function jwt(payload: Record<string, unknown>) {
	const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url');
	return `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64(payload)}.tiruan`;
}

/** Server Supabase tiruan: auth (otp, verify, logout) dan tabel progres. */
class SupabaseTiruan {
	baris: Baris | null = null;
	readonly userId = '00000000-0000-4000-8000-000000000001';

	async pasang(context: BrowserContext) {
		await context.route('https://*.supabase.co/**', async (route) => {
			const req = route.request();
			const url = new URL(req.url());
			const json = (status: number, body: unknown) =>
				route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

			if (url.pathname === '/auth/v1/otp') return json(200, {});
			if (url.pathname === '/auth/v1/verify') {
				const body = req.postDataJSON();
				if (body.token !== '123456') return json(403, { code: 403, error_code: 'otp_expired', msg: 'Token has expired or is invalid' });
				const exp = Math.floor(Date.now() / 1000) + 3600;
				const user = { id: this.userId, aud: 'authenticated', role: 'authenticated', email: body.email, app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() };
				return json(200, {
					access_token: jwt({ sub: this.userId, exp, role: 'authenticated', aud: 'authenticated', email: body.email }),
					token_type: 'bearer',
					expires_in: 3600,
					expires_at: exp,
					refresh_token: 'refresh-tiruan',
					user,
				});
			}
			if (url.pathname === '/auth/v1/logout') return route.fulfill({ status: 204 });
			if (url.pathname === '/auth/v1/user') return json(200, { id: this.userId, aud: 'authenticated', email: 'uji@contoh.com' });

			if (url.pathname === '/rest/v1/progres') {
				if (req.method() === 'GET') return json(200, this.baris ? [{ selesai: this.baris.selesai, kuis: this.baris.kuis }] : []);
				if (req.method() === 'POST') {
					const body = req.postDataJSON();
					const b = Array.isArray(body) ? body[0] : body;
					this.baris = { user_id: b.user_id, selesai: b.selesai, kuis: b.kuis };
					return route.fulfill({ status: 201, body: '' });
				}
				if (req.method() === 'DELETE') {
					this.baris = null;
					return route.fulfill({ status: 204, body: '' });
				}
			}
			return json(404, { message: `tidak ditiru: ${req.method()} ${url.pathname}` });
		});
	}
}

async function masuk(page: Page) {
	await page.goto('/akun/');
	await page.locator('#akun-email').fill('uji@contoh.com');
	await page.getByRole('button', { name: 'Kirim kode masuk' }).click();
	await page.locator('#akun-kode').fill('123456');
	await page.getByRole('button', { name: 'Masuk', exact: true }).click();
	await expect(page.locator('[data-isi="status"]')).toContainText('Tersinkron');
}

async function isiProgres(page: Page, selesai: string[], kuis: Record<string, { terbaik: number; lulus: boolean }>) {
	await page.goto('/');
	await page.evaluate(
		([s, k]) => {
			localStorage.setItem('jagoklodi:selesai', JSON.stringify(s));
			localStorage.setItem('jagoklodi:kuis', JSON.stringify(k));
		},
		[selesai, kuis] as const,
	);
}

test.describe.configure({ mode: 'serial' });

test('login, sinkron antarperangkat, batal selesai, dan hapus progres', async ({ browser }, info) => {
	test.skip(info.project.name !== 'desktop', 'cukup sekali, di desktop');

	const server = new SupabaseTiruan();
	const hp = await browser.newContext({ baseURL: info.project.use.baseURL });
	const laptop = await browser.newContext({ baseURL: info.project.use.baseURL });
	for (const c of [hp, laptop]) {
		await pasangHeaderProduksi(c);
		await server.pasang(c);
	}

	const pHp = await hp.newPage();
	const cekHp = await pantauMasalah(pHp);
	await pHp.goto('/akun/');
	await expect(pHp.locator('.akun__memuat')).toBeHidden();
	test.skip(await pHp.locator('[data-langkah="nonaktif"]').isVisible(), 'situs di-build tanpa login aktif');

	// 1. Di HP: belum login, sudah menyelesaikan Pelajaran 1.
	await isiProgres(pHp, [L1], { [L1]: { terbaik: 100, lulus: true } });
	await pHp.goto(L1);
	await expect(pHp.locator('.tanda-selesai__ajak')).toBeVisible();

	// Kode salah ditolak dengan pesan yang jelas.
	await pHp.goto('/akun/');
	await pHp.locator('#akun-email').fill('uji@contoh.com');
	await pHp.getByRole('button', { name: 'Kirim kode masuk' }).click();
	await pHp.locator('#akun-kode').fill('999999');
	await pHp.getByRole('button', { name: 'Masuk', exact: true }).click();
	await expect(pHp.locator('.akun__pesan')).toContainText('Kode salah');

	await masuk(pHp);
	expect(server.baris?.selesai).toEqual([L1]);
	expect(server.baris?.kuis[L1]).toEqual({ terbaik: 100, lulus: true });

	// 2. Di laptop: progres lokal berbeda (Pelajaran 2), lalu login.
	const pLaptop = await laptop.newPage();
	const cekLaptop = await pantauMasalah(pLaptop);
	await isiProgres(pLaptop, [L2], { [L2]: { terbaik: 80, lulus: true } });
	await masuk(pLaptop);
	expect(server.baris?.selesai).toEqual([L1, L2]);

	// Laptop kini menampilkan Pelajaran 1 sebagai selesai, termasuk skor kuisnya.
	await pLaptop.goto(L1);
	await expect(pLaptop.locator('.tanda-selesai button')).toHaveAttribute('aria-pressed', 'true');
	await expect(pLaptop.locator('.kuis__terbaik')).toContainText('100% (lulus)');
	await expect(pLaptop.locator('.tanda-selesai__ajak')).toBeHidden();

	// 3. Di HP: buka halaman mana pun, progres Pelajaran 2 dari laptop ikut muncul.
	await pHp.goto(L2);
	await expect(pHp.locator('.tanda-selesai button')).toHaveAttribute('aria-pressed', 'true');

	// 4. Di HP: lulus kuis Pelajaran 3 lalu tandai selesai; terkirim otomatis ke server.
	await pHp.goto(L3);
	const soal = pHp.locator('.kuis__soal');
	for (let i = 0; i < (await soal.count()); i++) {
		const kunci = await soal.nth(i).getAttribute('data-jawaban');
		await soal.nth(i).locator(`input[value="${kunci}"]`).check();
	}
	await pHp.locator('.kuis__periksa').click();
	await pHp.locator('.tanda-selesai button').click();
	await expect.poll(() => server.baris?.selesai, { timeout: 8000 }).toEqual([L1, L2, L3]);

	// 5. Di laptop: membatalkan "selesai" Pelajaran 2 ikut terhapus di server.
	await pLaptop.goto(L2);
	await expect(pLaptop.locator('.tanda-selesai button')).toHaveAttribute('aria-pressed', 'true');
	await pLaptop.locator('.tanda-selesai button').click();
	await expect.poll(() => server.baris?.selesai, { timeout: 8000 }).toEqual([L1, L3]);

	// 6. Hapus progres: hilang dari server dan dari browser.
	await pLaptop.goto('/akun/');
	await expect(pLaptop.locator('[data-isi="status"]')).toContainText('Tersinkron');
	await pLaptop.locator('.akun__bahaya summary').click();
	await pLaptop.getByRole('button', { name: 'Ya, hapus progres saya' }).click();
	await expect(pLaptop.locator('.akun__pesan')).toContainText('sudah dihapus');
	expect(server.baris).toBeNull();
	expect(await pLaptop.evaluate(() => localStorage.getItem('jagoklodi:selesai'))).toBeNull();

	// 7. Keluar: kembali ke formulir email, progres lokal tetap ada.
	await pHp.goto('/akun/');
	await pHp.getByRole('button', { name: 'Keluar' }).click();
	await expect(pHp.locator('#akun-email')).toBeVisible();

	expect(await cekHp()).toEqual([]);
	expect(await cekLaptop()).toEqual([]);
	await hp.close();
	await laptop.close();
});
