import { expect, test, type Page } from '@playwright/test';
import { halamanBerkuis, pantauMasalah, pasangHeaderProduksi } from './bantu';

/**
 * Uji navigasi: menu kiri bisa disembunyikan, grup Level tertutup otomatis,
 * indikator progres di sidebar dan beranda, serta indikator login (tersembunyi bila login nonaktif).
 */

test.beforeEach(async ({ context }) => {
	await pasangHeaderProduksi(context);
});

const L0 = halamanBerkuis().filter((p) => p.startsWith('/level-0/'));
const L2_PELAJARAN = halamanBerkuis().find((p) => p.startsWith('/level-2/'))!;
const TOTAL = halamanBerkuis().length;

async function isiSelesai(page: Page, selesai: string[]) {
	await page.goto('/tentang/');
	await page.evaluate((s) => localStorage.setItem('jagoklodi:selesai', JSON.stringify(s)), selesai);
}

test('menu kiri bisa disembunyikan, pilihan diingat, lalu ditampilkan lagi', async ({ page, isMobile }) => {
	test.skip(isMobile, 'di HP menu sudah tersembunyi di balik tombol ☰');
	const cek = await pantauMasalah(page);
	await page.goto(L2_PELAJARAN);
	const menu = page.locator('#starlight__sidebar');
	const tombol = page.locator('[data-tombol-menu]');
	await expect(menu).toBeVisible();
	await expect(tombol).toHaveText(/Sembunyikan menu/);

	await tombol.click();
	await expect(menu).toBeHidden();
	await expect(tombol).toHaveText(/Tampilkan menu/);
	await expect(tombol).toHaveAttribute('aria-expanded', 'false');
	// Isi pelajaran bergeser ke kiri karena ruang menu dilepas.
	const kiri = await page.locator('main').evaluate((el) => el.getBoundingClientRect().left);
	expect(kiri).toBeLessThan(100);

	await page.reload();
	await expect(menu).toBeHidden();

	await page.locator('[data-tombol-menu]').click();
	await expect(menu).toBeVisible();
	await page.reload();
	await expect(menu).toBeVisible();
	expect(await cek()).toEqual([]);
});

test('tombol sembunyikan menu tidak tampil di HP dan di beranda', async ({ page, isMobile }) => {
	if (isMobile) {
		await page.goto(L2_PELAJARAN);
		await expect(page.locator('[data-tombol-menu]')).toBeHidden();
	}
	await page.goto('/');
	await expect(page.locator('[data-tombol-menu]')).toHaveCount(0);
});

test('hanya grup Level yang sedang dibaca yang terbuka', async ({ page, isMobile }) => {
	test.skip(isMobile, 'cukup di desktop; isi menu sama');
	await page.goto(L2_PELAJARAN);
	const grup = (label: string) => page.locator('nav.sidebar details').filter({ has: page.locator('.large', { hasText: label }) });
	await expect(grup('Level 2')).toHaveAttribute('open', '');
	await expect(grup('Level 0')).not.toHaveAttribute('open', '');
	await expect(grup('Mulai di sini')).not.toHaveAttribute('open', '');
});

test('progres keseluruhan dan per level tampil di sidebar', async ({ page, isMobile }) => {
	const cek = await pantauMasalah(page);
	await isiSelesai(page, [L0[0], L0[1], '/level-9/sudah-dihapus/']);
	await page.goto(L2_PELAJARAN);
	if (isMobile) await page.locator('button.sl-menu-button').click();
	const ringkas = page.locator('[data-progres-sidebar]');
	await expect(ringkas).toBeVisible();
	await expect(ringkas.locator('[data-isi="angka"]')).toHaveText(`2/${TOTAL} (${Math.floor((2 / TOTAL) * 100)}%)`);
	await expect(page.locator('nav.sidebar .progres-level').first()).toHaveText(`2/${L0.length}`);
	expect(await cek()).toEqual([]);
});

test('progres di sidebar ikut berubah saat pelajaran ditandai selesai', async ({ page, isMobile }) => {
	test.skip(isMobile, 'cukup di desktop');
	// Kuis pelajaran pertama sudah lulus, tetapi belum ditandai selesai.
	await page.goto('/tentang/');
	await page.evaluate((p) => localStorage.setItem('jagoklodi:kuis', JSON.stringify({ [p]: { terbaik: 100, lulus: true } })), L0[0]);
	await page.goto(L0[0]);
	const angka = page.locator('[data-progres-sidebar] [data-isi="angka"]');
	await expect(angka).toHaveText(new RegExp(`^0/${TOTAL} `));
	await page.locator('.tanda-selesai button').click();
	await expect(angka).toHaveText(new RegExp(`^1/${TOTAL} `));
});

test('kartu Progres Anda di beranda: tersembunyi untuk pengunjung baru, lalu menunjukkan pelajaran berikutnya', async ({ page }) => {
	const cek = await pantauMasalah(page);
	await page.goto('/');
	await expect(page.locator('[data-progres-beranda]')).toBeHidden();

	await isiSelesai(page, [L0[0], L0[1]]);
	await page.goto('/');
	const kartu = page.locator('[data-progres-beranda]');
	await expect(kartu).toBeVisible();
	await expect(kartu).toContainText(`2 dari ${TOTAL} pelajaran selesai`);
	await expect(kartu.locator('[data-isi="lanjut"]')).toHaveAttribute('href', L0[2]);
	expect(await cek()).toEqual([]);
});

test('indikator login tersembunyi bila fitur login nonaktif', async ({ page }) => {
	await page.goto('/akun/');
	await expect(page.locator('.akun__memuat')).toBeHidden();
	test.skip(!(await page.locator('[data-langkah="nonaktif"]').isVisible()), 'situs di-build dengan login aktif; lihat login.spec.ts');
	await expect(page.locator('[data-indikator-akun]')).toBeHidden();
});
