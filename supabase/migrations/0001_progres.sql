-- jagoklodi: penyimpanan progres belajar per pengguna.
-- Jalankan sekali di Supabase: Dashboard → SQL Editor → New query → tempel isi file ini → Run.
-- Aman dijalankan ulang.

create table if not exists public.progres (
  -- Satu baris per pengguna. Terhapus otomatis bila akunnya dihapus.
  user_id uuid primary key references auth.users (id) on delete cascade,
  -- Daftar path pelajaran yang sudah ditandai selesai, misalnya '/level-0/01-kenalan-dengan-claude/'.
  selesai text[] not null default '{}',
  -- Skor kuis per path: { "/level-0/01-.../": { "terbaik": 100, "lulus": true } }.
  kuis jsonb not null default '{}'::jsonb,
  diperbarui timestamptz not null default now(),
  -- Batas ukuran agar tabel tidak bisa dipakai untuk menyimpan data sembarangan.
  constraint progres_selesai_wajar check (cardinality(selesai) <= 500),
  constraint progres_kuis_wajar check (pg_column_size(kuis) <= 65536)
);

-- Row Level Security: tanpa ini, siapa pun yang memegang publishable key bisa membaca semua baris.
alter table public.progres enable row level security;

-- Pengunjung yang belum login tidak boleh menyentuh tabel ini sama sekali.
revoke all on public.progres from anon;
grant select, insert, update, delete on public.progres to authenticated;

drop policy if exists "baca progres sendiri" on public.progres;
create policy "baca progres sendiri" on public.progres
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "buat progres sendiri" on public.progres;
create policy "buat progres sendiri" on public.progres
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "ubah progres sendiri" on public.progres;
create policy "ubah progres sendiri" on public.progres
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "hapus progres sendiri" on public.progres;
create policy "hapus progres sendiri" on public.progres
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Isi kolom diperbarui otomatis di setiap perubahan.
create or replace function public.progres_set_diperbarui()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.diperbarui := now();
  return new;
end;
$$;

drop trigger if exists progres_diperbarui on public.progres;
create trigger progres_diperbarui
  before update on public.progres
  for each row execute function public.progres_set_diperbarui();
