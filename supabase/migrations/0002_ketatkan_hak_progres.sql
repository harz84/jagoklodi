-- jagoklodi: cabut hak akses tabel progres yang tidak dibutuhkan.
-- Supabase secara bawaan memberi role authenticated semua hak tabel (termasuk TRUNCATE,
-- yang tidak dibatasi Row Level Security). Situs hanya butuh SELECT, INSERT, UPDATE, DELETE.
-- Aman dijalankan ulang.

revoke all on public.progres from authenticated;
grant select, insert, update, delete on public.progres to authenticated;

revoke all on public.progres from anon;
