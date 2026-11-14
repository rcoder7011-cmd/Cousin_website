import React from 'react';
import { Link } from 'react-router-dom';
import {
  FolderKanban,
  Layers,
  Image as ImageIcon,
  Settings,
  Clock,
  ArrowLeft,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';

const MODULE_CONFIGS = {
  projects: {
    title: 'Projects Management',
    tagline: 'Manage turnkey interior portfolio works',
    icon: FolderKanban,
    summary: 'In Part 8, you will be able to add new projects with rich specifications, upload high-resolution cover photos, set featured highlights, and toggle draft/published status.',
    features: [
      'Multi-field creation form (Title, Slug, Category, Location, Area, Scope, Date)',
      'Direct Supabase Storage integration with client-side drag-and-drop',
      'Instant publication toggle with optimistic UI updates',
      'Quick action to assign projects to room categories'
    ]
  },
  categories: {
    title: 'Categories Management',
    tagline: 'Organize design specializations & spaces',
    icon: Layers,
    summary: 'In Part 8, you will have complete control over room categories (Living Room, Bedroom, Modular Kitchen, POP Ceiling, Wardrobe, Commercial).',
    features: [
      'Create and edit category titles, descriptions, and slugs',
      'Set custom display ordering for navigation tabs and filters',
      'Real-time project counter per category',
      'Automatic slug collision detection'
    ]
  },
  media: {
    title: 'Media & Storage Library',
    tagline: 'High-resolution interior photography CDN',
    icon: ImageIcon,
    summary: 'In Part 8, this dedicated library will manage all assets in your Supabase project-images storage bucket.',
    features: [
      'Bucket browser for the public project-images storage bucket',
      'Direct image upload with thumbnail preview generation',
      'Automatic image optimization and size restriction checks (max 10MB)',
      'Copy public CDN URLs for use across content'
    ]
  },
  settings: {
    title: 'Website Settings',
    tagline: 'Branding, contact info & studio preferences',
    icon: Settings,
    summary: 'In Part 8, synchronize studio phone numbers, email addresses, WhatsApp links, and office addresses directly to the Supabase site_settings table.',
    features: [
      'Update official phone, email, and WhatsApp numbers dynamically',
      'Modify studio address, visiting hours, and Google Maps embed',
      'Configure social media links and SEO meta defaults',
      'Immediate cache invalidation across the public website'
    ]
  }
};

export default function AdminPlaceholderModule({ moduleKey = 'projects' }) {
  const config = MODULE_CONFIGS[moduleKey] || MODULE_CONFIGS.projects;
  const Icon = config.icon;

  return (
    <AdminLayout pageTitle={config.title}>
      <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Module Header Box */}
        <div style={{
          background: 'var(--admin-card-bg)',
          border: '1px solid var(--admin-border)',
          borderRadius: 'var(--radius-md)',
          padding: 'clamp(1.75rem, 3vw, 2.5rem)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.02)'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.75rem',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--admin-accent)',
            background: 'rgba(179, 136, 56, 0.1)',
            padding: '0.3rem 0.75rem',
            borderRadius: 'var(--radius-pill)',
            alignSelf: 'flex-start'
          }}>
            <Clock size={13} />
            <span>Scheduled for Part 8: Full CRUD Activation</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(179, 136, 56, 0.12)',
              color: 'var(--admin-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Icon size={28} />
            </div>
            <div>
              <h1 style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'clamp(1.5rem, 2.4vw, 2rem)',
                fontWeight: 600,
                color: 'var(--admin-primary)',
                margin: '0 0 0.35rem 0'
              }}>
                {config.title}
              </h1>
              <p style={{ margin: 0, fontSize: '0.92rem', color: 'var(--color-text-muted)' }}>
                {config.tagline}
              </p>
            </div>
          </div>

          <p style={{
            fontSize: '0.95rem',
            lineHeight: 1.6,
            color: 'var(--color-text)',
            margin: '0.5rem 0 0 0'
          }}>
            {config.summary}
          </p>
        </div>

        {/* Feature List Preview Card */}
        <div style={{
          background: 'var(--admin-card-bg)',
          border: '1px solid var(--admin-border)',
          borderRadius: 'var(--radius-md)',
          padding: '1.75rem',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.02)'
        }}>
          <h2 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '1.15rem',
            fontWeight: 600,
            color: 'var(--admin-primary)',
            margin: '0 0 1.25rem 0'
          }}>
            Upcoming Capabilities for this Module
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {config.features.map((feat, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  padding: '1rem',
                  background: 'var(--admin-bg)',
                  border: '1px solid var(--admin-border)',
                  borderRadius: 'var(--radius-sm)'
                }}
              >
                <Sparkles size={16} color="var(--admin-accent)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span style={{ fontSize: '0.86rem', color: 'var(--color-text)', lineHeight: 1.5 }}>
                  {feat}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Security & Action Footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
          padding: '0.5rem 0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
            <ShieldCheck size={16} color="var(--admin-accent)" />
            <span>Protected by Supabase Auth and Database RLS</span>
          </div>

          <Link
            to="/admin/dashboard"
            className="btn btn-outline"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.84rem'
            }}
          >
            <ArrowLeft size={14} />
            <span>Back to Dashboard Overview</span>
          </Link>
        </div>
      </div>
    </AdminLayout>
  );
}
