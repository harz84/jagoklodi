import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { docsLoader, i18nLoader } from '@astrojs/starlight/loaders';
import { docsSchema, i18nSchema } from '@astrojs/starlight/schema';

/**
 * Field tambahan untuk halaman pelajaran.
 * Field dibuat opsional di skema karena halaman biasa (beranda, tentang) tidak memakainya.
 * Kelengkapannya untuk halaman pelajaran dipaksa di src/components/PageTitle.astro:
 * build GAGAL bila ada pelajaran yang field-nya tidak lengkap.
 */
export const collections = {
	docs: defineCollection({
		loader: docsLoader(),
		schema: docsSchema({
			extend: z.object({
				// pelajaran = materi + kuis 3–5 soal; kuis = kuis akhir level (minimal 10 soal); halaman = halaman biasa
				jenis: z.enum(['pelajaran', 'kuis', 'halaman']).default('halaman'),
				level: z.number().int().min(0).max(4).optional(),
				durasi: z.string().optional(),
				prasyarat: z.string().optional(),
				terakhirDiverifikasi: z.coerce.date().optional(),
			}),
		}),
	}),
	// Teks antarmuka khusus (opsional). Isi di src/content/i18n/id.json menimpa terjemahan bawaan Starlight.
	i18n: defineCollection({ loader: i18nLoader(), schema: i18nSchema() }),
};
