-- Run this in the Supabase SQL editor

create table if not exists library_setups (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  date date not null,
  time_of_setup text,
  symbol text not null,
  author text,
  confluence_tags text[] default '{}',
  labels text[] default '{}',
  outcome text check (outcome in ('win', 'loss', 'breakeven', 'pending', null)),
  exit_criteria text,
  notes text,
  image_weekly text,
  image_daily text,
  image_hourly text
);

-- Storage bucket for setup images
insert into storage.buckets (id, name, public)
values ('library-images', 'library-images', true)
on conflict do nothing;

-- Allow public read
create policy "Public read library-images"
  on storage.objects for select
  using (bucket_id = 'library-images');

-- Allow anonymous insert (tighten with auth later)
create policy "Anyone can upload library-images"
  on storage.objects for insert
  with check (bucket_id = 'library-images');
