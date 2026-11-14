# SUPABASE BACKEND SETUP GUIDE
## Project: Saifi Interior Hub
**Official Domain:** [https://saifiinteriorhub.in](https://saifiinteriorhub.in)  
**Industry:** Interior Design & Interior Work  
**Company Experience:** 10+ Years

This step-by-step guide explains how to connect your Supabase project to the **Saifi Interior Hub** website, execute the database schema, configure storage, and set up your secure admin account.

---

## 1. Create a Supabase Account & Project

1. Visit [https://supabase.com](https://supabase.com) and click **Start your project** (or sign in).
2. Click **New Project** in your Supabase dashboard.
3. Configure your project settings:
   - **Name:** `saifi-interior-hub`
   - **Database Password:** Choose a strong password and save it securely.
   - **Region:** Choose a region close to your target audience (e.g., `South Asia (Mumbai)` or `Southeast Asia (Singapore)`).
   - **Pricing Plan:** Free plan is suitable for starting.
4. Click **Create new project** and wait 1-2 minutes for project provisioning.

---

## 2. Locate Your API Credentials

Once your project is ready:
1. In the Supabase left navigation bar, click **Project Settings** (gear icon) at the bottom.
2. Select **API** under the Configuration section.
3. Locate the following two values:
   - **Project URL:** Looks like `https://abcdefghijklmnopqrst.supabase.co`
   - **Project API keys -> `anon` `public`:** A long alphanumeric string (starts with `ey...`).
4. **IMPORTANT SECURITY NOTICE:**
   - Use the **`anon` `public`** key for this frontend website.
   - **NEVER** use or expose the **`service_role`** key in frontend code or in Git commits. The `service_role` key bypasses Row Level Security.

---

## 3. Configure Your Environment Variables

1. Inside your project folder (`Interior-web-main`), find `.env.example`.
2. Create a copy of `.env.example` named `.env`:
   ```bash
   cp .env.example .env
   ```
   *(On Windows PowerShell: `Copy-Item .env.example .env`)*
3. Open `.env` and fill in your actual values:
   ```env
   VITE_SUPABASE_URL=https://your-actual-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-actual-anon-public-key
   ```
4. Save the file.
5. Notice that `.env` is already included in `.gitignore` so your actual credentials will never be committed to Git.

---

## 4. Execute Database Migration & Schema

1. In your Supabase Dashboard, click **SQL Editor** in the left sidebar.
2. Click **New Query** (or the **+** button).
3. Open the file `supabase/schema.sql` from your project repository, copy the entire SQL script, and paste it into the Supabase SQL editor.
4. Click **Run** (or press `Ctrl+Enter` / `Cmd+Enter`).
5. Verify the success message: `Success. No rows returned`.

### What this script creates:
- ✅ **`categories` table:** Stores Bedroom, Kitchen, Living Room, Office, Pop Ceiling, Wardrobe (pre-seeded).
- ✅ **`projects` table:** Stores interior design projects with title, slug, cover image, category relation, published/featured flags.
- ✅ **`project_images` table:** Stores multiple gallery photographs for each project with cascading delete.
- ✅ **`admin_profiles` table:** Secure role-based table referencing `auth.users` for authorized admins.
- ✅ **`site_settings` table:** Key-value store for company info, phone, email, and service areas.
- ✅ **`is_admin()` function:** Secure database function to verify admin status.
- ✅ **Row Level Security (RLS) on all tables:** Public can only read active/published items; only verified admins can write or edit.
- ✅ **Storage bucket `project-images`:** Configured with 10MB upload limits and public view access.

---

## 5. Verify the Storage Bucket

1. In your Supabase Dashboard, click **Storage** in the left sidebar.
2. You will see the bucket named **`project-images`**.
3. Confirm that it is marked as **Public Bucket** (enabled by the SQL script).
4. If you ever need to create it manually through the dashboard:
   - Bucket Name: `project-images`
   - Public bucket: **ON**
   - File size limit: `10MB`
   - Allowed MIME types: `image/jpeg, image/png, image/webp, image/svg+xml`

---

## 6. Create Your First Admin Account Securely

Because public user registration is intentionally disabled for security, admin accounts are created through the Supabase Dashboard:

### Step A: Create the user in Supabase Auth
1. In your Supabase Dashboard, click **Authentication** -> **Users**.
2. Click **Add User** -> **Create User**.
3. Enter your administrative email (e.g., `admin@saifiinteriorhub.in` or your personal email) and a strong password.
4. Make sure **Auto Confirm User?** is checked.
5. Click **Create User**.
6. Find the newly created user in the list and **copy their User UID** (looks like `8f1e2d3c-4b5a-6789-0123-abcdef456789`).

### Step B: Grant the Admin Role in the Database
1. Go back to **SQL Editor** in the Supabase Dashboard.
2. Run the following SQL query, replacing `<PASTE-USER-UID-HERE>` with the UID copied from Step A:
   ```sql
   insert into public.admin_profiles (id, full_name, role)
   values (
     '<PASTE-USER-UID-HERE>',
     'Rajabul Saifi',
     'admin'
   )
   on conflict (id) do update set
     role = 'admin';
   ```
3. Click **Run**.
4. Your account now has full administrative privileges secured by database Row Level Security.

---

## 7. Test Your Database Connection Locally

1. Start your local development server:
   ```bash
   npm run dev
   ```
2. Open your browser to the local URL (usually `http://localhost:5173`).
3. Open Developer Tools (F12) -> Console:
   - If credentials are valid: No warnings will appear; the services will query Supabase directly.
   - If `.env` is missing or contains placeholder values: A friendly notice informs you that fallback static data is being displayed so the site remains 100% operational.
4. Your existing frontend and GSAP animations will continue to work seamlessly!

---

## 8. Summary of Reusable Service Functions

All backend queries have been encapsulated in clean, reusable service modules located in `src/services/`:

- **Categories:** `getCategories()`, `getCategoryBySlug(slug)`, `createCategory()`, `updateCategory()`, `deleteCategory()`
- **Projects:** `getPublishedProjects()`, `getProjectBySlug(slug)`, `getFeaturedProjects()`, `createProject()`, `updateProject()`, `deleteProject()`
- **Project Images:** `getImagesByProjectId(id)`, `uploadProjectImage(file, opts)`, `createProjectImageRecord()`, `deleteProjectImage()`
- **Settings:** `getSiteSettings()`, `getSettingByKey(key)`, `updateSetting(key, val)`
- **Authentication:** `loginAdmin(email, pwd)`, `logoutAdmin()`, `getCurrentUser()`, `isAdmin()`, `onAuthStateChange()`

These will be seamlessly plugged into the future Admin Dashboard in subsequent development parts.
