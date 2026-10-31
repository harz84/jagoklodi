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
				Header: './src/components/Header.astro',
				Sidebar: './src/components/Sidebar.astro',
			},
			sidebar: [
				{
					label: 'Mulai di sini',
					collapsed: true,
					items: [
						{ label: 'Tentang jagoklodi', slug: 'tentang' },
						{ label: 'Akun dan sinkron progres', slug: 'akun' },
						{ label: 'Kebijakan privasi', slug: 'privasi' },
					],
				},
				{ label: 'Level 0 · Orientasi', collapsed: true, items: [{ autogenerate: { directory: 'level-0' } }] },
				{ label: 'Level 1 · Dasar pemakaian', collapsed: true, items: [{ autogenerate: { directory: 'level-1' } }] },
				{ label: 'Level 2 · Produktivitas', collapsed: true, items: [{ autogenerate: { directory: 'level-2' } }] },
				// Tambahkan grup level berikutnya setelah folder-nya berisi minimal satu pelajaran.
				// collapsed: true → hanya grup yang berisi halaman yang sedang dibaca yang terbuka otomatis.
			],
		}),
	],
});
