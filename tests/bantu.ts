import { readFileSync } from 'node:fs';
import type { BrowserContext, Page } from '@playwright/test';

/** Semua path halaman dari sitemap hasil build, misalnya "/level-0/01-kenalan-dengan-claude/". */
export function semuaHalaman(): string[] {
	const xml = readFileSync('dist/sitemap-0.xml', 'utf8');
	return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
}

/** Halaman pelajaran dan kuis akhir level (yang punya komponen Kuis). */
export function halamanBerkuis(): string[] {
	return semuaHalaman().filter((p) => /^\/level-\d\//.test(p));
}

/**
 * Header produksi dibaca dari netlify.toml, lalu ditempelkan ke setiap respons HTML,
 * supaya uji ini juga memastikan Content-Security-Policy tidak merusak situs.
 */
export function headerProduksi(): Record<string, string> {
	const toml = readFileSync('netlify.toml', 'utf8');
	const bagian = toml.split('[headers.values]')[1] ?? '';
	const headers: Record<string, string> = {};
	for (const m of bagian.matchAll(/^\s*([A-Za-z-]+)\s*=\s*"([^"]*)"\s*$/gm)) headers[m[1]] = m[2];
	// upgrade-insecure-requests tidak relevan di http://localhost dan akan memblokir aset lokal.
	if (headers['Content-Security-Policy']) {
		headers['Content-Security-Policy'] = headers['Content-Security-Policy'].replace(/;\s*upgrade-insecure-requests/, '');
	}
	return headers;
}

export async function pasangHeaderProduksi(context: BrowserContext) {
	const extra = headerProduksi();
	await context.route('**/*', async (route) => {
		const response = await route.fetch();
		const isHtml = (response.headers()['content-type'] ?? '').includes('text/html');
		await route.fulfill({ response, headers: isHtml ? { ...response.headers(), ...extra } : response.headers() });
	});
}

/** Catat pelanggaran CSP dan error JavaScript di halaman. */
export async function pantauMasalah(page: Page) {
	const masalah: string[] = [];
	await page.addInitScript(() => {
		document.addEventListener('securitypolicyviolation', (e) => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			((window as any).__csp ??= []).push(`${e.violatedDirective} ${e.blockedURI}`);
		});
	});
	page.on('pageerror', (e) => masalah.push(`JS error: ${e.message}`));
	return async () => {
		const csp: string[] = await page.evaluate(() => (window as any).__csp ?? []);
		return [...masalah, ...csp.map((c) => `CSP: ${c}`)];
	};
}
