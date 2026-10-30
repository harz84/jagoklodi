import { expect, test } from '@playwright/test';
import { halamanBerkuis, pantauMasalah, pasangHeaderProduksi } from './bantu';

/**
 * Uji fitur "Laporkan kesalahan".
 * Penerimaan kiriman sungguhan hanya ada di Netlify, jadi di sini kiriman dicegat
 * dan isinya diperiksa: nama formulir, field, dan kolom jebakan.
 */

test.beforeEach(async ({ context }) => {
	await pasangHeaderProduksi(context);
});

const pelajaran = halamanBerkuis()[0];

test('setiap pelajaran punya tautan lapor yang membawa path halamannya', async ({ page }) => {
	await page.goto(pelajaran);
	const tautan = page.locator('.lapor-tautan a');
	await expect(tautan).toHaveAttribute('href', `/lapor/?halaman=${pelajaran}`);
});

test('tautan lapor tidak muncul di halaman laporan itu sendiri', async ({ page }) => {
	await page.goto('/lapor/');
	await expect(page.locator('.lapor-tautan')).toHaveCount(0);
	await page.goto('/lapor/terima/');
	await expect(page.locator('.lapor-tautan')).toHaveCount(0);
});

test('formulir siap dideteksi Netlify dan tidak meminta data pribadi', async ({ page }) => {
	await page.goto('/lapor/');
	const form = page.locator('form[data-form-lapor]');
	await expect(form).toHaveAttribute('name', 'laporan-kesalahan');
	await expect(form).toHaveAttribute('method', 'POST');
	await expect(form).toHaveAttribute('action', '/lapor/terima/');
	await expect(form).toHaveAttribute('data-netlify', 'true');
	await expect(form).toHaveAttribute('netlify-honeypot', 'situs-web');
	await expect(form.locator('input[name="form-name"]')).toHaveValue('laporan-kesalahan');
	await expect(form.locator('input[name="situs-web"]')).not.toBeInViewport();
	await expect(form.locator('input[type="email"], input[name*="email" i], input[name*="nama" i]')).toHaveCount(0);
});

test('kolom halaman terisi dari tautan, tetapi menolak alamat luar', async ({ page }) => {
	await page.goto(`/lapor/?halaman=${pelajaran}`);
	await expect(page.locator('#lapor-halaman')).toHaveValue(pelajaran);

	for (const jahat of ['https://contoh.com/', '//contoh.com/', '/<script>alert(1)</script>']) {
		await page.goto(`/lapor/?halaman=${encodeURIComponent(jahat)}`);
		await expect(page.locator('#lapor-halaman'), jahat).toHaveValue('');
	}
});

test('formulir kosong tidak terkirim', async ({ page }) => {
	let terkirim = false;
	await page.route('**/lapor/terima/', async (route) => {
		if (route.request().method() === 'POST') terkirim = true;
		await route.fallback();
	});
	await page.goto('/lapor/');
	await page.locator('form[data-form-lapor] button[type="submit"]').click();
	await expect(page).toHaveURL(/\/lapor\/$/);
	expect(terkirim).toBe(false);
});

test('laporan terkirim lengkap lalu menampilkan halaman terima kasih', async ({ page }) => {
	const cek = await pantauMasalah(page);
	let isi: URLSearchParams | null = null;
	await page.route('**/lapor/terima/', async (route) => {
		const req = route.request();
		if (req.method() !== 'POST') return route.fallback();
		isi = new URLSearchParams(req.postData() ?? '');
		// Tiru perilaku Netlify: setelah kiriman diterima, tampilkan halaman tujuan (action).
		await route.fulfill({ status: 303, headers: { location: '/lapor/terima/' } });
	});

	await page.goto(`/lapor/?halaman=${pelajaran}`);
	await page.locator('#lapor-jenis').selectOption({ index: 1 });
	await page.locator('#lapor-penjelasan').fill('Di langkah 2, nama menunya sekarang berbeda dari yang tertulis.');
	await page.locator('form[data-form-lapor] button[type="submit"]').click();

	await expect(page).toHaveURL(/\/lapor\/terima\/$/);
	await expect(page.locator('h1').first()).toContainText('Laporan terkirim');

	expect(isi).not.toBeNull();
	const data = isi as unknown as URLSearchParams;
	expect(data.get('form-name')).toBe('laporan-kesalahan');
	expect(data.get('halaman')).toBe(pelajaran);
	expect(data.get('jenis')).toBeTruthy();
	expect(data.get('penjelasan')).toContain('langkah 2');
	expect(data.get('situs-web')).toBe('');
	expect(await cek()).toEqual([]);
});
