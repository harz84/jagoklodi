/// <reference types="astro/client" />

interface ImportMetaEnv {
	/** URL proyek Supabase, misalnya https://abcdefgh.supabase.co. Kosong = fitur login nonaktif. */
	readonly PUBLIC_SUPABASE_URL?: string;
	/** Publishable key Supabase (sb_publishable_...). Aman untuk browser. */
	readonly PUBLIC_SUPABASE_PUBLISHABLE_KEY?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
