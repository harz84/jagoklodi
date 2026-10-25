// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightLinksValidator from 'starlight-links-validator';

// https://astro.build/config
export default defineConfig({
	site: 'https://jagoklodi.web.id',
	integrations: [
		starlight({
			title: 'jagoklodi',
			description:
				'Belajar Claude bertahap dalam Bahasa Indonesia, dari pemula sampai developer. Situs komunitas independen.',
			locales: {
				root: { label: 'Bahasa Indonesia', lang: 'id' },
			},
			plugins: [starlightLinksValidator()],
			customCss: ['./src/styles/custom.css'],
			components: {
				PageTitle: './src/components/PageTitle.astro',
				Footer: './src/components/Footer.astro',
			},
			sidebar: [
				{ label: 'Mulai di sini', items: [{ label: 'Tentang jagoklodi', slug: 'tentang' }] },
				{ label: 'Level 0 · Orientasi', items: [{ autogenerate: { directory: 'level-0' } }] },
				// Tambahkan grup level berikutnya setelah folder-nya berisi minimal satu pelajaran, contoh:
				// { label: 'Level 1 · Dasar pemakaian', items: [{ autogenerate: { directory: 'level-1' } }] },
			],
		}),
	],
});
