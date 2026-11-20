# Saifi Interior Hub — Demo to Live Supabase Migration Guide
**Official Website:** [https://saifiinteriorhub.in](https://saifiinteriorhub.in)  
**Company:** Saifi Interior Hub (10+ Years Experience • Delhi NCR)  
**Architecture:** React 19 + Vite 8 + Supabase (PostgreSQL, Auth, Storage, RLS)

---

## 1. Overview & Architecture Transition

Saifi Interior Hub includes a **Zero-Friction Dual Mode Architecture**:

| Aspect | Demo Mode (Active Baseline) | Live Mode (Supabase Production) |
|---|---|---|
| **Database** | Local memory + browser `localStorage` caches | Live Supabase PostgreSQL database |
| **Authentication** | Demo studio admin session (`saifi_demo_admin_session_v1`) | Supabase Auth (JWT) + `admin_profiles` RLS verification |
| **Storage** | Bundled high-resolution photography + base64 local cache | Supabase Storage buckets (`project-images`, `category-images`) |
| **Website Settings** | Verified static seed + local cache (`saifi_site_settings_cache_v1`) | Supabase `site_settings` table (key-value schema) |
| **Configuration Requirement** | Works instantly out-of-the-box (no keys required) | `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env` |

> **Zero Code Changes:** The application dynamically detects valid credentials at runtime via `src/lib/supabase.js` and `src/config/backendConfig.js`. When valid Supabase environment variables are provided, the system seamlessly switches from Demo Mode to Live Mode without altering any source code.

---

## 2. Step 1: Create a Supabase Project

1. Visit [https://supabase.com](https://supabase.com) and log in or create a free account.
2. Click **New Project** and select your organization.
3. Configure your project:
   - **Name:** `saifi-interior-hub`
   - **Database Password:** Generate and securely save a strong database password.
   - **Region:** Select **Mumbai (ap-south-1)** (recommended for lowest latency in Delhi NCR / India) or your preferred region.
   - **Pricing Plan:** Free tier is fully sufficient for initial launch.
4. Wait approximately 1–2 minutes for database provisioning to complete.

---

## 3. Step 2: Configure Environment Variables

1. In your project root (`Interior-web-main`), copy the environment template:
   ```bash
   cp .env.example .env
   ```
2. Retrieve your Supabase API credentials:
   - Navigate to **Project Settings** (gear icon) -> **API** in the Supabase Dashboard.
   - Find **Project URL** (e.g., `https://abcdefghijklm.supabase.co`).
   - Find **Project API Keys** -> `anon` / `public` (starts with `ey...`).
3. Open `.env` in your text editor and paste the values:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

> **CRITICAL SECURITY NOTE:**
> - Never expose the `service_role` key in `.env` or anywhere in frontend code.
> - The `anon` key is strictly intended for public/client use protected by PostgreSQL Row Level Security (RLS).
> - `.env` is included in `.gitignore` and must never be committed to git.

---

## 4. Step 3: Execute Database Migrations

Run the three migration scripts in order using the **SQL Editor** in the Supabase Dashboard:

### Migration 1: Core Schema & Policies
1. In the Supabase Dashboard, click **SQL Editor** in the left sidebar.
2. Click **New query**.
3. Open and copy the entire contents of [`supabase/migrations/20260214000000_initial_schema.sql`](supabase/migrations/20260214000000_initial_schema.sql).
4. Paste it into the SQL Editor and click **Run**.
   - *This creates:*
     - Tables: `admin_profiles`, `categories`, `projects`, `project_images`, `site_settings`.
     - Constraints, foreign keys, and automatic `updated_at` triggers.
     - Row Level Security (RLS) policies: Public read-only for published content; write access restricted strictly to verified `admin` profiles.
     - Storage bucket `project-images` with access policies.

### Migration 2: Category Images Storage
1. Click **New query**.
2. Open and copy the contents of [`supabase/migrations/20260214000001_category_images_storage.sql`](supabase/migrations/20260214000001_category_images_storage.sql).
3. Paste into the SQL Editor and click **Run**.
   - *This creates:*
     - Storage bucket `category-images`.
     - Public read access for category covers.
     - Admin-restricted write/update/delete access for category images.

### Migration 3: Verified Site Settings Seed
1. Click **New query**.
2. Open and copy the contents of [`supabase/migrations/20260214000002_site_settings_seed.sql`](supabase/migrations/20260214000002_site_settings_seed.sql).
3. Paste into the SQL Editor and click **Run**.
   - *This seeds:*
     - Verified official branding for **Saifi Interior Hub**.
     - Official contact info (`+91-84498-02502`, `saifiinteriorhub@gmail.com`).
     - **10+ Years Experience** company background and metrics.
     - Core services, stats, socials, and SEO metadata.

---

## 5. Step 4: Verify Supabase Storage Buckets

1. In the Supabase Dashboard, click **Storage** in the left sidebar.
2. Confirm both buckets appear:
   - `project-images` (Public: Yes)
   - `category-images` (Public: Yes)
3. If they are marked private, click the three dots next to each bucket -> **Edit bucket** -> toggle **Public bucket** ON -> Save.

---

## 6. Step 5: Create Initial Administrator Account

Because `admin_profiles` enforces strict Row Level Security, creating a user in Supabase Auth is step 5a, and granting admin privileges is step 5b:

### 5a. Create Auth User
1. In the Supabase Dashboard, go to **Authentication** -> **Users**.
2. Click **Add User** -> **Create user**.
3. Enter:
   - **Email:** `admin@saifiinteriorhub.in` (or your personal administrator email)
   - **Password:** Choose a secure password (minimum 8 characters)
   - **Auto Confirm User:** Checked / Yes
4. Click **Create user**.
5. Copy the generated **User UID** (UUID string, e.g. `c4b12345-6789-abcd-ef01-234567890abc`).

### 5b. Authorize in `admin_profiles`
1. Go back to **SQL Editor** -> **New query**.
2. Run the following statement, replacing `<USER_UID>` with the copied UUID:
   ```sql
   INSERT INTO public.admin_profiles (id, full_name, role)
   VALUES ('<USER_UID>', 'Master Administrator', 'admin')
   ON CONFLICT (id) DO UPDATE SET role = 'admin';
   ```
3. Click **Run**.
4. You are now a fully authorized studio administrator!

---

## 7. Step 6: Verify Live Backend Connection

1. Restart your development server:
   ```bash
   npm run dev
   ```
2. Open [http://localhost:5173/admin/login](http://localhost:5173/admin/login) in your browser.
3. Observe the login page:
   - The yellow "Demo Mode Active" banner will no longer appear.
   - The system is now communicating directly with your live Supabase project.
4. Sign in with the administrator email and password created in Step 5.
5. In the top-right header of the Admin Dashboard:
   - The badge will display **`Live DB`** with a green status indicator.
6. Test functionality:
   - Navigate to **Categories**: Add a test category -> Verify it appears in your Supabase `categories` table.
   - Navigate to **Projects**: Add a project with an image -> Verify image uploads to Supabase Storage.
   - Navigate to **Website Settings**: Update an announcement or phone number -> Verify instant persistence.

---

## 8. Data Migration & Cleanup

### Clearing Local Demo Cache
If you made test modifications during Demo Mode and want a clean slate in Live Mode:
1. Open DevTools in your browser (F12) -> **Application** -> **Local Storage**.
2. Clear the following demo cache keys:
   - `saifi_projects_cache_v1`
   - `saifi_categories_cache_v1`
   - `saifi_media_cache_v1`
   - `saifi_site_settings_cache_v1`
   - `saifi_demo_admin_session_v1`
3. Reload the page. The app will fetch fresh live data directly from Supabase.

### Rollback to Demo Mode
If you ever need to return to Demo Mode for testing or client presentations:
1. Simply comment out or clear the variables in `.env`:
   ```env
   VITE_SUPABASE_URL=
   VITE_SUPABASE_ANON_KEY=
   ```
2. Reload the application. The system immediately reverts to local Demo Mode with full feature fidelity.
