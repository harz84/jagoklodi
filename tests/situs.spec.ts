import { expect, test } from '@playwright/test';
import { halamanBerkuis, pantauMasalah, pasangHeaderProduksi, semuaHalaman } from './bantu';

test.beforeEach(async ({ context }) => {
	await pasangHeaderProduksi(context);
});

test.describe('setiap halaman', () => {
	for (const path of semuaHalaman()) {
		test(`tampil tanpa error: ${path}`, async ({ page }) => {
			const cek = await pantauMasalah(page);
			const res = await page.goto(path);
			expect(res?.status()).toBe(200);
			await expect(page.locator('h1').first()).toBeVisible();
			await expect(page.locator('.disclaimer')).toContainText('tidak berafiliasi dengan Anthropic');

			const lebarBerlebih = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
			expect(lebarBerlebih, 'halaman tidak boleh bergeser ke samping').toBe(false);
			expect(await cek()).toEqual([]);
		});
	}
});

test('halaman yang tidak ada menampilkan 404 berbahasa Indonesia', async ({ page }) => {
	const res = await page.goto('/halaman-yang-tidak-ada/');
	expect(res?.status()).toBe(404);
	await expect(page.locator('h1').first()).toContainText('Halaman tidak ditemukan');
});

test('pencarian menemukan pelajaran', async ({ page, isMobile }) => {
	const cek = await pantauMasalah(page);
	await page.goto('/');
	await page.locator('button[data-open-modal]').first().click();
	await page.locator('#starlight__search input').fill('privasi');
	await expect(page.locator('.pagefind-ui__result').first()).toBeVisible({ timeout: 10_000 });
	expect(await cek(), isMobile ? 'mobile' : 'desktop').toEqual([]);
});

test.describe('kuis dan progres', () => {
	const pelajaran = halamanBerkuis()[0];

	test('tombol selesai terkunci sampai kuis lulus, lalu progres tersimpan', async ({ page }) => {
		const cek = await pantauMasalah(page);
		await page.goto(pelajaran);
		const tombolSelesai = page.locator('.tanda-selesai button');
		await expect(tombolSelesai).toBeDisabled();

		const soal = page.locator('.kuis__soal');
		const jumlah = await soal.count();
		expect(jumlah).toBeGreaterThanOrEqual(3);

		// Semua jawaban salah: gagal dan tetap terkunci.
		for (let i = 0; i < jumlah; i++) {
			const kunci = await soal.nth(i).getAttribute('data-jawaban');
			await soal.nth(i).locator(`input:not([value="${kunci}"])`).first().check();
		}
		await page.locator('.kuis__periksa').click();
		await expect(page.locator('.kuis__hasil')).toContainText('Belum lulus');
		await expect(tombolSelesai).toBeDisabled();

		// Ulangi dengan semua jawaban benar: lulus dan terbuka.
		await page.locator('.kuis__ulangi').click();
		for (let i = 0; i < jumlah; i++) {
			const kunci = await soal.nth(i).getAttribute('data-jawaban');
			await soal.nth(i).locator(`input[value="${kunci}"]`).check();
		}
		await page.locator('.kuis__periksa').click();
		await expect(page.locator('.kuis__hasil')).toContainText('100%');
		await expect(tombolSelesai).toBeEnabled();

		// Setelah dimuat ulang, skor terbaik dan status lulus tetap ada.
		await page.reload();
		await expect(page.locator('.kuis__terbaik')).toContainText('100% (lulus)');
		await expect(tombolSelesai).toBeEnabled();
		await tombolSelesai.click();
		await expect(tombolSelesai).toHaveAttribute('aria-pressed', 'true');

		await page.reload();
		await expect(tombolSelesai).toHaveAttribute('aria-pressed', 'true');
		expect(await cek()).toEqual([]);
	});

	test('setiap halaman berkuis punya soal dengan kunci jawaban yang valid', async ({ page }) => {
		for (const path of halamanBerkuis()) {
			await page.goto(path);
			const soal = page.locator('.kuis__soal');
			const jumlah = await soal.count();
			expect(jumlah, path).toBeGreaterThanOrEqual(3);
			for (let i = 0; i < jumlah; i++) {
				const kunci = await soal.nth(i).getAttribute('data-jawaban');
				await expect(soal.nth(i).locator(`input[value="${kunci}"]`), `${path} soal ${i + 1}`).toHaveCount(1);
			}
		}
	});
});
