# Saifi Interior Hub — Official Website & Studio Portal

[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-19.3-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=flat&logo=supabase&logoColor=white)](https://supabase.com/)
[![GSAP](https://img.shields.io/badge/GSAP-3.15-88CE02?style=flat&logo=greensock&logoColor=white)](https://greensock.com/gsap/)
[![Vercel](https://img.shields.io/badge/Deployment-Vercel-000000?style=flat&logo=vercel&logoColor=white)](https://vercel.com/)
[![Status](https://img.shields.io/badge/Production-Ready-success)]()

**Official Domain:** [https://saifiinteriorhub.in](https://saifiinteriorhub.in)  
**Company:** Saifi Interior Hub  
**Industry:** Premium Interior Design & Execution Studio  
**Experience:** 10+ Years • Delhi NCR (Gurugram, Delhi, Noida, Greater Noida)  
**Direct Site Contact:** `+91-84498-02502` • `enquiry@saifiinteriorhub.in`

---

## 1. Project Overview

Saifi Interior Hub is a production-grade, high-performance web platform and studio management portal engineered for luxury residential and commercial interior design.

The platform combines a **visual architectural public portfolio** with smooth GSAP animations, dynamic category filtering, and direct client conversion channels (WhatsApp, phone, and consultation booking), backed by a private, **state-of-the-art Studio Administration Dashboard**.

### Key Highlights
- **Architectural Aesthetic:** Warm alabaster linen palette, Playfair Display typography, high WCAG contrast, and silky micro-interactions.
- **Premium Multi-Image Project Gallery:** Asymmetric 3-column editorial grid showcasing 5–6 project photographs simultaneously on case study detail views, featuring a larger hero highlight image, elegant hover elevations, and an expandable "+N Photos" portfolio view.
- **Fullscreen Lightbox with Touch Swipe:** Complete modal gallery supporting previous/next chevron navigation, live image counter badge (`Photo X of Y`), keyboard shortcuts (`ArrowLeft`, `ArrowRight`, `Escape`), mobile swipe gestures, and direct photo-referenced WhatsApp consultation links.
- **Dual-Mode Backend Architecture:** Fully functional in zero-credential **Demo Mode** with persistent browser storage and real category photography, and seamlessly connects to live **Supabase** via `.env` with ordered `project_images` joins and zero code changes.
- **Route-Level Code Splitting:** Dynamic lazy loading isolates the heavy admin portal from public visitors, keeping the main public JavaScript payload under 170kB (gzip: <49kB).
- **Comprehensive Admin Suite:**
  - Live Overview metrics (project counts, published vs draft, categories).
  - Complete Projects CRUD (draft/publish toggles, featured projects, image manager, live preview).
  - Category Management (order index, active/inactive, safe deletion guards against assigned projects).
  - Centralized Media Library (multi-file upload, file size formatting, content usage tracking, image replacement).
  - Dynamic Website Settings (8 tabs, live Google search snippet & Open Graph card previews, instant sync).
- **Search Engine Optimization:** Static XML sitemap (`/sitemap.xml`), robots protocol (`/robots.txt`), Open Graph / Twitter cards, canonical links, and Schema.org LocalBusiness structured data.

---

## 2. Tech Stack

- **Framework:** React 19 (`19.3.1`)
- **Build Tool:** Vite 8 (`8.3.5`) with vendor chunk optimization
- **Routing:** React Router DOM 7 (`7.18.4`)
- **Animations:** GSAP 3 (`3.15.1`) with ScrollTrigger & `@gsap/react`
- **Backend / DB:** Supabase (`@supabase/supabase-js` `2.119.0`) with PostgreSQL, Auth, Storage, and Row Level Security (RLS)
- **Icons:** Lucide React (`1.61.0`) & React Icons (`5.7.0`)
- **Linting & Code Quality:** Oxlint (`1.88.0`)

---

## 3. Directory Structure

```text
Interior-web-main/
├── public/                     # Static assets, fonts, icons, real site photographs
│   ├── images/projects/        # Real interior site photos categorized by room type
│   ├── favicon.svg             # Studio architectural favicon
│   ├── robots.txt              # Search engine crawler directives
│   └── sitemap.xml             # XML sitemap with canonical URLs
├── src/
│   ├── components/             # Reusable UI components
│   │   ├── admin/              # Admin components (AdminLayout, AdminRouteGuard, MediaPickerModal)
│   │   ├── common/             # Common elements (SocialIcons, WhatsAppButton, etc.)
│   │   ├── home/               # Homepage sections (Hero, FeaturedProjects, CompanyExperience, etc.)
│   │   └── layout/             # Public layout (Navbar, Footer, MobileMenu)
│   ├── config/                 # Application configuration
│   │   └── backendConfig.js    # Centralized Demo Mode and backend state configuration
│   ├── context/                # React context providers
│   │   ├── AuthContext.jsx     # Authentication state & session manager
│   │   └── SettingsContext.jsx # Dynamic site settings & deep merge provider
│   ├── data/                   # Fallback baseline static datasets
│   │   ├── designer.js         # Company baseline profile, services, contact
│   │   └── projects.js         # Curated real site photography & project showcase
│   ├── lib/
│   │   └── supabase.js         # Centralized Supabase client & environment detection
│   ├── pages/                  # Route views
│   │   ├── admin/              # Admin views (Dashboard, Projects, Categories, Media, Settings, Auth)
│   │   ├── HomePage.jsx        # Landing page with GSAP animations
│   │   ├── ProjectsPage.jsx    # Filterable portfolio gallery
│   │   ├── ProjectDetailPage.jsx # Comprehensive project case study view
│   │   ├── ServicesPage.jsx    # Studio services and execution offerings
│   │   ├── AboutPage.jsx       # Studio story and 10+ years experience background
│   │   └── ContactPage.jsx     # Consultation booking and direct site visit request
│   ├── services/               # API service layer (Supabase + Demo Mode fallbacks)
│   │   ├── adminService.js     # Dashboard metrics & analytics queries
│   │   ├── authService.js      # Two-tier authentication & admin authorization
│   │   ├── categoryService.js  # Category management & relationship mapping
│   │   ├── mediaService.js     # Media library, storage uploads & usage tracker
│   │   ├── projectService.js   # Project CRUD, filtering & slug resolution
│   │   └── settingsService.js  # Dynamic site settings CRUD & section validation
│   ├── utils/                  # Helper utilities
│   │   ├── gsapConfig.js       # GSAP registration & reduced motion detection
│   │   └── useSEO.js           # Dynamic meta tag & Open Graph injector
│   ├── App.jsx                 # Main application router with route-level code splitting
│   ├── index.css               # Global architectural design system & variables
│   └── main.jsx                # React root mount
├── supabase/
│   └── migrations/             # Production SQL migrations
│       ├── 20260214000000_initial_schema.sql         # Core schema, tables, triggers & RLS
│       ├── 20260214000001_category_images_storage.sql# Storage bucket policies
│       └── 20260214000002_site_settings_seed.sql     # Verified studio initial seed
├── DEMO_TO_LIVE_MIGRATION.md   # Step-by-step Supabase production connection guide
├── .env.example                # Clean environment variables template
└── vite.config.js              # Vite build & code-splitting configuration
```

---

## 4. Quick Start (Demo Mode)

The project runs immediately out-of-the-box without requiring any Supabase credentials:

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Explore the public website:**
   Open [http://localhost:5173](http://localhost:5173) in your browser.

4. **Access the Studio Admin Portal:**
   Navigate to [http://localhost:5173/admin/login](http://localhost:5173/admin/login).
   - In Demo Mode, click the **"Autofill Demo Admin"** button or enter `admin@saifiinteriorhub.in` with any password.
   - All changes made in the admin portal (creating projects, editing categories, changing settings) persist in your browser's `localStorage` across reloads!

---

## 5. Connecting to Live Supabase

When you are ready to connect to your live Supabase database and storage:

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Fill in your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
3. Follow the complete step-by-step guide in [`DEMO_TO_LIVE_MIGRATION.md`](DEMO_TO_LIVE_MIGRATION.md) to apply SQL migrations and create your admin user.
4. Restart the development server. The admin dashboard badge will turn green (**`Live DB`**).

---

## 6. Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Launches local development server with Hot Module Replacement (HMR). |
| `npm run build` | Produces optimized, minified production build with route-level code splitting in `/dist`. |
| `npm run lint` | Runs `oxlint` across all files (currently 0 errors, 0 warnings). |
| `npm run preview` | Locally serves the production `/dist` build for pre-deployment inspection. |

---

## 7. Production Deployment

### Single-Page Application (SPA) Routing
Because this application uses client-side routing (`react-router-dom`), ensure your hosting provider rewrites all non-asset requests to `index.html`.

#### Vercel
Create a `vercel.json` in the root:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

#### Netlify
Create a `public/_redirects` file:
```text
/*    /index.html   200
```

#### Cloudflare Pages
Add a `_redirects` file to `public/`:
```text
/*    /index.html   200
```

### Environment Variables on Production
When deploying to Vercel/Netlify/Cloudflare, set the following environment variables in your deployment dashboard:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

---

## 8. Company Information & Attribution

- **Company Name:** Saifi Interior Hub
- **Official Domain:** [https://saifiinteriorhub.in](https://saifiinteriorhub.in)
- **Experience:** 10+ Years of Craftsmanship & Execution
- **Service Region:** Gurugram, Delhi, Noida, Greater Noida (Delhi NCR)
- **Phone:** `+91-84498-02502`
- **Email:** `enquiry@saifiinteriorhub.in`
- **Copyright:** &copy; 2026 Saifi Interior Hub. All rights reserved.
