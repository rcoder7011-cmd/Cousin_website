-- ==============================================================================
-- Migration: 20260214000000_initial_schema.sql
-- Description: Initial schema for Saifi Interior Hub (categories, projects, project_images, admin_profiles, site_settings)
-- Official Domain: saifiinteriorhub.in
-- ==============================================================================

create extension if not exists "uuid-ossp";

-- Automated updated_at trigger function
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 1. categories
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  display_order integer default 0,
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

drop trigger if exists set_categories_updated_at on public.categories;
create trigger set_categories_updated_at
  before update on public.categories
  for each row
  execute function public.set_updated_at();

create index if not exists idx_categories_slug on public.categories(slug);
create index if not exists idx_categories_is_active on public.categories(is_active);
create index if not exists idx_categories_order on public.categories(display_order asc);

-- 2. projects
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text,
  category_id uuid references public.categories(id) on delete set null,
  location text default 'Delhi NCR',
  project_date date,
  cover_image text,
  is_featured boolean default false,
  is_published boolean default false,
  display_order integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

drop trigger if exists set_projects_updated_at on public.projects;
create trigger set_projects_updated_at
  before update on public.projects
  for each row
  execute function public.set_updated_at();

create index if not exists idx_projects_slug on public.projects(slug);
create index if not exists idx_projects_category on public.projects(category_id);
create index if not exists idx_projects_published on public.projects(is_published);
create index if not exists idx_projects_featured on public.projects(is_featured);
create index if not exists idx_projects_order on public.projects(display_order asc);

-- 3. project_images
create table if not exists public.project_images (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  image_url text not null,
  alt_text text,
  display_order integer default 0,
  created_at timestamp with time zone default now()
);

create index if not exists idx_project_images_project_id on public.project_images(project_id);
create index if not exists idx_project_images_order on public.project_images(display_order asc);

-- 4. admin_profiles
create table if not exists public.admin_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'admin' check (role in ('admin', 'editor')),
  created_at timestamp with time zone default now()
);

-- 5. site_settings
create table if not exists public.site_settings (
  id uuid primary key default gen_random_uuid(),
  setting_key text not null unique,
  setting_value jsonb not null,
  updated_at timestamp with time zone default now()
);

drop trigger if exists set_site_settings_updated_at on public.site_settings;
create trigger set_site_settings_updated_at
  before update on public.site_settings
  for each row
  execute function public.set_updated_at();

-- Security helper function
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.admin_profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

-- RLS Activation
alter table public.categories enable row level security;
alter table public.projects enable row level security;
alter table public.project_images enable row level security;
alter table public.admin_profiles enable row level security;
alter table public.site_settings enable row level security;

-- Policies for categories
drop policy if exists "Public visitors can view active categories" on public.categories;
create policy "Public visitors can view active categories"
  on public.categories for select
  using (is_active = true or public.is_admin());

drop policy if exists "Admins can insert categories" on public.categories;
create policy "Admins can insert categories"
  on public.categories for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "Admins can update categories" on public.categories;
create policy "Admins can update categories"
  on public.categories for update
  to authenticated
  using (public.is_admin());

drop policy if exists "Admins can delete categories" on public.categories;
create policy "Admins can delete categories"
  on public.categories for delete
  to authenticated
  using (public.is_admin());

-- Policies for projects
drop policy if exists "Public visitors can view published projects" on public.projects;
create policy "Public visitors can view published projects"
  on public.projects for select
  using (is_published = true or public.is_admin());

drop policy if exists "Admins can insert projects" on public.projects;
create policy "Admins can insert projects"
  on public.projects for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "Admins can update projects" on public.projects;
create policy "Admins can update projects"
  on public.projects for update
  to authenticated
  using (public.is_admin());

drop policy if exists "Admins can delete projects" on public.projects;
create policy "Admins can delete projects"
  on public.projects for delete
  to authenticated
  using (public.is_admin());

-- Policies for project_images
drop policy if exists "Public visitors can view images of published projects" on public.project_images;
create policy "Public visitors can view images of published projects"
  on public.project_images for select
  using (
    exists (
      select 1 from public.projects
      where projects.id = project_images.project_id
        and (projects.is_published = true or public.is_admin())
    )
  );

drop policy if exists "Admins can insert project images" on public.project_images;
create policy "Admins can insert project images"
  on public.project_images for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "Admins can update project images" on public.project_images;
create policy "Admins can update project images"
  on public.project_images for update
  to authenticated
  using (public.is_admin());

drop policy if exists "Admins can delete project images" on public.project_images;
create policy "Admins can delete project images"
  on public.project_images for delete
  to authenticated
  using (public.is_admin());

-- Policies for admin_profiles (Zero recursion, authenticated self-check only)
drop policy if exists "Admins and profile owners can view admin profiles" on public.admin_profiles;
drop policy if exists "Users can view own admin profile" on public.admin_profiles;
create policy "Users can view own admin profile"
  on public.admin_profiles for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "Admins can update admin profiles" on public.admin_profiles;
drop policy if exists "Admins can update own admin profile" on public.admin_profiles;
create policy "Admins can update own admin profile"
  on public.admin_profiles for update
  to authenticated
  using (auth.uid() = id and role = 'admin');

-- Policies for site_settings
drop policy if exists "Public visitors can view site settings" on public.site_settings;
create policy "Public visitors can view site settings"
  on public.site_settings for select
  using (true);

drop policy if exists "Admins can insert site settings" on public.site_settings;
create policy "Admins can insert site settings"
  on public.site_settings for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "Admins can update site settings" on public.site_settings;
create policy "Admins can update site settings"
  on public.site_settings for update
  to authenticated
  using (public.is_admin());

drop policy if exists "Admins can delete site settings" on public.site_settings;
create policy "Admins can delete site settings"
  on public.site_settings for delete
  to authenticated
  using (public.is_admin());

-- Storage Bucket Setup
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'project-images',
  'project-images',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];

drop policy if exists "Public can view project images bucket" on storage.objects;
create policy "Public can view project images bucket"
  on storage.objects for select
  using (bucket_id = 'project-images');

drop policy if exists "Admins can upload to project images bucket" on storage.objects;
create policy "Admins can upload to project images bucket"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'project-images' and public.is_admin());

drop policy if exists "Admins can update project images bucket" on storage.objects;
create policy "Admins can update project images bucket"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'project-images' and public.is_admin());

drop policy if exists "Admins can delete from project images bucket" on storage.objects;
create policy "Admins can delete from project images bucket"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'project-images' and public.is_admin());

-- Seed Categories
insert into public.categories (name, slug, description, display_order, is_active)
values
  ('Bedroom', 'bedroom', 'Master and guest bedroom interior spaces, bespoke beds, and mood lighting.', 1, true),
  ('Kitchen', 'kitchen', 'Modular kitchen layouts, acrylic & laminate cabinetry, and quartz countertops.', 2, true),
  ('Living Room', 'living-room', 'Architectural living room spaces, media walls, acoustic wall panelling.', 3, true),
  ('Office', 'office', 'Corporate executive cabins, reception desks, acoustic panelling & ergonomic suites.', 4, true),
  ('Pop Ceiling', 'pop-ceiling', 'Gypsum & plaster false ceilings with cove illumination and magnetic track lights.', 5, true),
  ('Wardrobe', 'wardrobe', 'Floor-to-ceiling sliding & walk-in wardrobes with fluted glass & sensor lights.', 6, true)
on conflict (slug) do nothing;

-- Seed Site Settings
insert into public.site_settings (setting_key, setting_value)
values
  ('company_info', jsonb_build_object(
    'name', 'Saifi Interior Hub',
    'domain', 'saifiinteriorhub.in',
    'website_url', 'https://saifiinteriorhub.in',
    'industry', 'Interior Design & Interior Work',
    'experience', '10+ Years Experience',
    'years_of_experience', 10,
    'phone', '+91 84498 02502',
    'whatsapp_number', '918449802502',
    'email', 'enquiry@saifiinteriorhub.in',
    'service_areas', jsonb_build_array('Gurugram', 'Delhi', 'Noida')
  ))
on conflict (setting_key) do update set
  setting_value = excluded.setting_value,
  updated_at = now();

