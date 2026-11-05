-- =====================================================================
-- Restaurant Digital Menu - Supabase setup
-- Run this whole file once: Supabase Dashboard > SQL Editor > New query > paste > Run
-- =====================================================================

-- ---------- 1. Admin allow-list ----------
create table if not exists public.admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;

drop policy if exists "admins read own row" on public.admins;
create policy "admins read own row" on public.admins
  for select to authenticated using (user_id = auth.uid());
-- (no insert/update/delete policies: nobody can add admins from the website)

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.admins where user_id = auth.uid()); $$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------- 2. Shared updated_at trigger ----------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- ---------- 3. Tables ----------
create table if not exists public.categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(trim(name)) between 1 and 60),
  image_url  text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists categories_name_unique on public.categories (lower(trim(name)));

create table if not exists public.dishes (
  id           uuid primary key default gen_random_uuid(),
  category_id  uuid not null references public.categories(id) on delete restrict,
  name         text not null check (char_length(trim(name)) between 1 and 80),
  description  text check (description is null or char_length(description) <= 300),
  price        numeric(10,2) not null check (price >= 0 and price <= 100000),
  image_url    text,
  is_veg       boolean not null default true,
  badge        text check (badge in ('bestseller','special')),
  is_featured  boolean not null default false,
  is_available boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists dishes_category_idx on public.dishes (category_id);
create index if not exists dishes_created_idx  on public.dishes (created_at desc);

create table if not exists public.restaurant_settings (
  id            integer primary key default 1 check (id = 1),   -- exactly one row
  name          text not null default 'My Restaurant',
  tagline       text,
  logo_url      text,
  cover_image_url text,
  address       text,
  maps_url      text,
  phone         text,
  opening_hours text,
  about         text,
  instagram_url text,
  facebook_url  text,
  updated_at    timestamptz not null default now()
);

drop trigger if exists categories_updated on public.categories;
create trigger categories_updated before update on public.categories for each row execute function public.set_updated_at();
drop trigger if exists dishes_updated on public.dishes;
create trigger dishes_updated before update on public.dishes for each row execute function public.set_updated_at();
drop trigger if exists settings_updated on public.restaurant_settings;
create trigger settings_updated before update on public.restaurant_settings for each row execute function public.set_updated_at();

-- ---------- 4. Row Level Security ----------
alter table public.categories          enable row level security;
alter table public.dishes              enable row level security;
alter table public.restaurant_settings enable row level security;

-- Everyone (customers) can READ menu information
drop policy if exists "public read categories" on public.categories;
create policy "public read categories" on public.categories for select to anon, authenticated using (true);
drop policy if exists "public read dishes" on public.dishes;
create policy "public read dishes" on public.dishes for select to anon, authenticated using (true);
drop policy if exists "public read settings" on public.restaurant_settings;
create policy "public read settings" on public.restaurant_settings for select to anon, authenticated using (true);

-- Only administrators can INSERT / UPDATE / DELETE
drop policy if exists "admin write categories" on public.categories;
create policy "admin write categories" on public.categories for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admin write dishes" on public.dishes;
create policy "admin write dishes" on public.dishes for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admin write settings" on public.restaurant_settings;
create policy "admin write settings" on public.restaurant_settings for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------- 5. Image storage ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('menu-images', 'menu-images', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
  set public = true, file_size_limit = 5242880, allowed_mime_types = array['image/jpeg','image/png','image/webp'];

-- Images are public to VIEW via their URL (bucket is public). Only admins may upload/change/delete.
drop policy if exists "admin read images"   on storage.objects;
drop policy if exists "admin upload images" on storage.objects;
drop policy if exists "admin update images" on storage.objects;
drop policy if exists "admin delete images" on storage.objects;
create policy "admin read images"   on storage.objects for select to authenticated
  using (bucket_id = 'menu-images' and public.is_admin());
create policy "admin upload images" on storage.objects for insert to authenticated
  with check (bucket_id = 'menu-images' and public.is_admin());
create policy "admin update images" on storage.objects for update to authenticated
  using (bucket_id = 'menu-images' and public.is_admin());
create policy "admin delete images" on storage.objects for delete to authenticated
  using (bucket_id = 'menu-images' and public.is_admin());

-- ---------- 6. Realtime (customer menu updates instantly) ----------
do $$
begin
  begin alter publication supabase_realtime add table public.dishes;              exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.categories;          exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.restaurant_settings; exception when duplicate_object then null; end;
end $$;

-- ---------- 7. Starting data (needed for the site to work; editable in the Admin Panel) ----------
insert into public.restaurant_settings (id, name) values (1, 'My Restaurant') on conflict (id) do nothing;

insert into public.categories (name, sort_order) values
  ('Starters', 1), ('Main Course', 2), ('Indian Thali', 3), ('Chinese', 4), ('South Indian', 5),
  ('Fast Food', 6), ('Pizza & Burger', 7), ('Beverages', 8), ('Desserts', 9)
on conflict do nothing;

-- =====================================================================
-- 8. MAKE YOURSELF ADMIN  (do this AFTER creating your user in Authentication > Users)
--    Replace the email, then run just this statement:
--
--    insert into public.admins (user_id)
--    select id from auth.users where email = 'owner@example.com';
-- =====================================================================
