-- ==============================================================================
-- SAIFI INTERIOR HUB — COMPLETE SUPABASE DATABASE FOUNDATION
-- Official Domain: saifiinteriorhub.in
-- Company Experience: 10+ Years
-- ==============================================================================
-- INSTRUCTIONS:
-- 1. Open your Supabase Dashboard: https://supabase.com/dashboard
-- 2. Select your project -> SQL Editor -> New Query
-- 3. Paste and run this script. It is safe, idempotent, and does not drop existing data.
-- ==============================================================================

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";

-- 2. FUNCTION: Automated updated_at timestamp maintenance
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ------------------------------------------------------------------------------
-- 3. TABLE: categories
-- ------------------------------------------------------------------------------
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

-- Trigger for categories.updated_at
drop trigger if exists set_categories_updated_at on public.categories;
create trigger set_categories_updated_at
  before update on public.categories
  for each row
  execute function public.set_updated_at();

-- Index on slug & active status
create index if not exists idx_categories_slug on public.categories(slug);
create index if not exists idx_categories_is_active on public.categories(is_active);
create index if not exists idx_categories_order on public.categories(display_order asc);

-- ------------------------------------------------------------------------------
-- 4. TABLE: projects
-- ------------------------------------------------------------------------------
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

-- Trigger for projects.updated_at
drop trigger if exists set_projects_updated_at on public.projects;
create trigger set_projects_updated_at
  before update on public.projects
  for each row
  execute function public.set_updated_at();

-- Indexes for performance
create index if not exists idx_projects_slug on public.projects(slug);
create index if not exists idx_projects_category on public.projects(category_id);
create index if not exists idx_projects_published on public.projects(is_published);
create index if not exists idx_projects_featured on public.projects(is_featured);
create index if not exists idx_projects_order on public.projects(display_order asc);

-- ------------------------------------------------------------------------------
-- 5. TABLE: project_images
-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- 6. TABLE: admin_profiles (Role-based access control)
-- ------------------------------------------------------------------------------
create table if not exists public.admin_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'admin' check (role in ('admin', 'editor')),
  created_at timestamp with time zone default now()
);

-- ------------------------------------------------------------------------------
-- 7. TABLE: site_settings (Configurable website settings)
-- ------------------------------------------------------------------------------
create table if not exists public.site_settings (
  id uuid primary key default gen_random_uuid(),
  setting_key text not null unique,
  setting_value jsonb not null,
  updated_at timestamp with time zone default now()
);

-- Trigger for site_settings.updated_at
drop trigger if exists set_site_settings_updated_at on public.site_settings;
create trigger set_site_settings_updated_at
  before update on public.site_settings
  for each row
  execute function public.set_updated_at();

-- ------------------------------------------------------------------------------
-- 8. SECURITY HELPER FUNCTION: is_admin()
-- Checks if currently authenticated user exists in admin_profiles with role='admin'
-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------

-- Enable RLS on all tables
alter table public.categories enable row level security;
alter table public.projects enable row level security;
alter table public.project_images enable row level security;
alter table public.admin_profiles enable row level security;
alter table public.site_settings enable row level security;

-- --- CATEGORIES POLICIES ---
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

-- --- PROJECTS POLICIES ---
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

-- --- PROJECT IMAGES POLICIES ---
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

-- --- ADMIN PROFILES POLICIES ---
drop policy if exists "Admins and profile owners can view admin profiles" on public.admin_profiles;
create policy "Admins and profile owners can view admin profiles"
  on public.admin_profiles for select
  to authenticated
  using (auth.uid() = id or public.is_admin());

drop policy if exists "Admins can update admin profiles" on public.admin_profiles;
create policy "Admins can update admin profiles"
  on public.admin_profiles for update
  to authenticated
  using (public.is_admin());

-- Notice: No public insert or self-assignment policy is created for admin_profiles.
-- Admin assignment must be done via the Supabase SQL editor or elevated management script.

-- --- SITE SETTINGS POLICIES ---
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

-- ------------------------------------------------------------------------------
-- 10. SUPABASE STORAGE BUCKET & POLICIES (project-images)
-- ------------------------------------------------------------------------------

-- Create the public bucket if not already present
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'project-images',
  'project-images',
  true,
  10485760, -- 10MB limit per image
  array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];

-- Storage Object Policies
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

-- ------------------------------------------------------------------------------
-- 11. INITIAL SEED DATA
-- ------------------------------------------------------------------------------

-- Seed Required Categories (Bedroom, Kitchen, Living Room, Office, Pop Ceiling, Wardrobe)
insert into public.categories (name, slug, description, display_order, is_active)
values
  ('Bedroom', 'bedroom', 'Master and guest bedroom interior spaces, bespoke beds, and mood lighting.', 1, true),
  ('Kitchen', 'kitchen', 'Modular kitchen layouts, acrylic & laminate cabinetry, and quartz countertops.', 2, true),
  ('Living Room', 'living-room', 'Architectural living room spaces, media walls, acoustic wall panelling.', 3, true),
  ('Office', 'office', 'Corporate executive cabins, reception desks, acoustic panelling & ergonomic suites.', 4, true),
  ('Pop Ceiling', 'pop-ceiling', 'Gypsum & plaster false ceilings with cove illumination and magnetic track lights.', 5, true),
  ('Wardrobe', 'wardrobe', 'Floor-to-ceiling sliding & walk-in wardrobes with fluted glass & sensor lights.', 6, true)
on conflict (slug) do nothing;

-- Seed Official Company Settings
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
