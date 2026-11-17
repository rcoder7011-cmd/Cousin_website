-- ==============================================================================
-- MIGRATION: 20260214000001_category_images_storage.sql
-- Description: Provision dedicated category-images storage bucket with RLS policies
-- Project: Saifi Interior Hub (saifiinteriorhub.in)
-- ==============================================================================

-- 1. Create or update the category-images storage bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'category-images',
  'category-images',
  true,
  10485760, -- 10MB limit per image
  array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];

-- 2. Storage Policies for category-images bucket
drop policy if exists "Public can view category images bucket" on storage.objects;
create policy "Public can view category images bucket"
  on storage.objects for select
  using (bucket_id = 'category-images');

drop policy if exists "Admins can upload to category images bucket" on storage.objects;
create policy "Admins can upload to category images bucket"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'category-images' and public.is_admin());

drop policy if exists "Admins can update category images bucket" on storage.objects;
create policy "Admins can update category images bucket"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'category-images' and public.is_admin());

drop policy if exists "Admins can delete from category images bucket" on storage.objects;
create policy "Admins can delete from category images bucket"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'category-images' and public.is_admin());

