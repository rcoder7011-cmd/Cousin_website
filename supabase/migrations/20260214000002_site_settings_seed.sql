-- ==============================================================================
-- Migration: 20260214000002_site_settings_seed.sql
-- Description: Comprehensive Site Settings Default Seed for Saifi Interior Hub
-- Official Domain: https://saifiinteriorhub.in
-- Company: Saifi Interior Hub (10+ Years Experience)
-- ==============================================================================

-- 1. General Settings
insert into public.site_settings (setting_key, setting_value)
values (
  'general_settings',
  jsonb_build_object(
    'website_name', 'Saifi Interior Hub',
    'tagline', 'Over a decade of creating beautiful, functional, and thoughtfully designed spaces.',
    'description', 'Saifi Interior Hub creates beautiful, functional and inspiring interior spaces tailored to clients'' needs.',
    'logo_url', null,
    'favicon_url', null,
    'default_language', 'en',
    'contact_email', 'enquiry@saifiinteriorhub.in',
    'maintenance_mode', false
  )
)
on conflict (setting_key) do nothing;

-- 2. Business Information
insert into public.site_settings (setting_key, setting_value)
values (
  'business_info',
  jsonb_build_object(
    'business_name', 'Saifi Interior Hub',
    'description', 'Saifi Interior Hub brings over 10 years of experience in interior design and interior work across Gurugram, Delhi, and Noida with direct on-site supervision, transparent execution, and lasting quality.',
    'years_of_experience', '10+',
    'address', 'Delhi NCR',
    'city', 'New Delhi',
    'state', 'Delhi',
    'postal_code', '110001',
    'country', 'India',
    'business_email', 'enquiry@saifiinteriorhub.in',
    'business_phone', '+91 84498 02502',
    'whatsapp_number', '918449802502',
    'working_hours', 'Mon – Sat: 9:00 AM – 8:00 PM (Sunday Closed)'
  )
)
on conflict (setting_key) do nothing;

-- 3. Contact Information
insert into public.site_settings (setting_key, setting_value)
values (
  'contact_info',
  jsonb_build_object(
    'primary_phone', '+91 84498 02502',
    'secondary_phone', '',
    'whatsapp_number', '918449802502',
    'email', 'enquiry@saifiinteriorhub.in',
    'address', 'Gurugram • Delhi • Noida (Delhi NCR, India)',
    'google_maps_url', 'https://maps.google.com/?q=Delhi+NCR',
    'contact_description', 'Connect directly with Saifi Interior Hub for on-site visits, architectural space discussions, and transparent cost estimates across Gurugram, Delhi, and Noida.'
  )
)
on conflict (setting_key) do nothing;

-- 4. Social Media
insert into public.site_settings (setting_key, setting_value)
values (
  'social_media',
  jsonb_build_object(
    'instagram', 'https://instagram.com/saifiinteriorhub',
    'facebook', 'https://facebook.com/saifiinteriorhub',
    'youtube', '',
    'pinterest', '',
    'linkedin', ''
  )
)
on conflict (setting_key) do nothing;

-- 5. Homepage Content
insert into public.site_settings (setting_key, setting_value)
values (
  'homepage_content',
  jsonb_build_object(
    'hero_heading', 'Crafting Thoughtful Interiors with Direct Site Execution',
    'hero_subtitle', 'With over 10 years of experience in interior design and interior work, Saifi Interior Hub pairs refined aesthetic vision with a dedicated team of master craftsmen across Gurugram, Delhi, and Noida.',
    'hero_btn_text', 'View Completed Sites',
    'hero_btn_link', '/projects',
    'hero_secondary_btn_text', 'Enquire on WhatsApp',
    'hero_secondary_btn_link', '',
    'hero_image', '/images/projects/Living Room/78d10c45-348b-4c86-90f8-942b36a10bc9.png',
    'experience_heading', 'A Proven Decade of Craftsmanship and Direct On-Site Supervision',
    'experience_description', 'Over 10 years of dedicated interior execution across Delhi NCR. Master carpenters, POP artisans, and finishing technicians working cohesively under direct supervision.',
    'experience_number', '10',
    'experience_label', 'Years of Transforming Spaces',
    'about_heading', 'About Saifi Interior Hub',
    'about_description', 'Saifi Interior Hub delivers turnkey interior design and precision interior execution with direct on-site management and zero intermediaries.',
    'about_image', '/images/projects/Living Room/78d10c45-348b-4c86-90f8-942b36a10bc9.png',
    'services_heading', 'Specialized Interior Execution Services',
    'services_description', 'Precision craftsmanship across modular woodwork, false ceilings, lighting, and turnkey solutions.',
    'cta_heading', 'Have a Flat, Villa or Commercial Site Ready for Work?',
    'cta_description', 'Connect directly with Saifi Interior Hub (saifiinteriorhub.in). Benefit from more than 10 years of on-site execution experience with transparent estimates.',
    'cta_btn_text', 'Chat Directly on WhatsApp',
    'cta_btn_link', ''
  )
)
on conflict (setting_key) do nothing;

-- 6. SEO Settings
insert into public.site_settings (setting_key, setting_value)
values (
  'seo_settings',
  jsonb_build_object(
    'meta_title', 'Saifi Interior Hub | Interior Design and Interior Work • 10+ Years Experience - Delhi NCR',
    'meta_description', 'Saifi Interior Hub has over 10 years of experience in interior design and interior work across Gurugram, Delhi, and Noida. Direct site supervision with dedicated master craftsmen.',
    'meta_keywords', 'interior design, interior work, Saifi Interior Hub, modular kitchen, pop ceiling, wardrobe, Delhi NCR, Gurugram interiors, Noida interiors',
    'og_title', 'Saifi Interior Hub | Interior Design and Interior Work • 10+ Years Experience',
    'og_description', 'Saifi Interior Hub has over 10 years of experience in interior design and interior work across Delhi NCR. Direct site supervision by experienced craftsmen.',
    'og_image', 'https://saifiinteriorhub.in/images/projects/Living%20Room/78d10c45-348b-4c86-90f8-942b36a10bc9.png',
    'twitter_image', 'https://saifiinteriorhub.in/images/projects/Living%20Room/78d10c45-348b-4c86-90f8-942b36a10bc9.png',
    'canonical_url', 'https://saifiinteriorhub.in',
    'robots_index', 'index, follow',
    'page_seo', jsonb_build_object(
      'home', jsonb_build_object(
        'title', 'Saifi Interior Hub | Interior Design & Execution • 10+ Years Exp',
        'description', 'Over a decade of creating bespoke interiors across Gurugram, Delhi, and Noida with direct site supervision.'
      ),
      'about', jsonb_build_object(
        'title', 'About Us | Saifi Interior Hub - 10+ Years Experience',
        'description', 'Learn about Saifi Interior Hub, our 10+ years of interior craftsmanship and direct on-site execution.'
      ),
      'services', jsonb_build_object(
        'title', 'Our Services | Saifi Interior Hub',
        'description', 'Turnkey interior design services including modular woodwork, false ceiling, painting and electrical solutions.'
      ),
      'projects', jsonb_build_object(
        'title', 'Completed Projects | Saifi Interior Hub Portfolio',
        'description', 'Explore real completed interior design projects executed by Saifi Interior Hub across Delhi NCR.'
      ),
      'contact', jsonb_build_object(
        'title', 'Contact Us | Saifi Interior Hub Consultation',
        'description', 'Get in touch for on-site interior design consultations and estimates in Gurugram, Delhi, and Noida.'
      )
    )
  )
)
on conflict (setting_key) do nothing;

-- 7. Footer Settings
insert into public.site_settings (setting_key, setting_value)
values (
  'footer_settings',
  jsonb_build_object(
    'footer_description', 'With over 10 years of experience in interior design and interior work, Saifi Interior Hub focuses on creating beautiful, functional, and thoughtfully designed residential and commercial spaces across Gurugram, Delhi, and Noida with direct on-site supervision.',
    'copyright_text', '© {year} Saifi Interior Hub. All Rights Reserved.',
    'footer_address', 'Gurugram • Delhi • Noida',
    'footer_phone', '+91 84498 02502',
    'footer_email', 'enquiry@saifiinteriorhub.in',
    'show_social', true
  )
)
on conflict (setting_key) do nothing;

-- 8. Advanced Settings
insert into public.site_settings (setting_key, setting_value)
values (
  'advanced_settings',
  jsonb_build_object(
    'maintenance_mode', false,
    'maintenance_message', 'We are currently updating our portfolio. Please contact us on WhatsApp at +91 84498 02502 for immediate enquiries.',
    'default_language', 'en',
    'custom_head_code', ''
  )
)
on conflict (setting_key) do nothing;
