import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { PROJECTS as STATIC_PROJECTS } from '../data/projects';
import { FALLBACK_CATEGORIES } from './categoryService';
import { resolveImageUrl } from './projectImageService';

/**
 * Fetch real aggregate statistics from Supabase database tables
 * for the Admin Dashboard overview.
 *
 * Uses head: true and count: 'exact' for minimal bandwidth and maximum speed.
 *
 * @returns {Promise<{
 *   data: {
 *     totalProjects: number,
 *     publishedProjects: number,
 *     draftProjects: number,
 *     totalCategories: number,
 *     featuredProjects: number
 *   },
 *   error: Error | null
 * }>}
 */
export async function getDashboardStats() {
  if (!isSupabaseConfigured) {
    // Accurate metrics from static baseline when database is not connected
    const total = STATIC_PROJECTS.length;
    const published = STATIC_PROJECTS.length;
    const drafts = 0;
    const featured = STATIC_PROJECTS.filter(p => p.isFeatured).length;
    const categoriesCount = FALLBACK_CATEGORIES.length;

    return {
      data: {
        totalProjects: total,
        publishedProjects: published,
        draftProjects: drafts,
        totalCategories: categoriesCount,
        featuredProjects: featured
      },
      error: null
    };
  }

  try {
    const [
      totalProjectsRes,
      publishedProjectsRes,
      draftProjectsRes,
      featuredProjectsRes,
      categoriesRes
    ] = await Promise.all([
      supabase.from('projects').select('*', { count: 'exact', head: true }),
      supabase.from('projects').select('*', { count: 'exact', head: true }).eq('is_published', true),
      supabase.from('projects').select('*', { count: 'exact', head: true }).eq('is_published', false),
      supabase.from('projects').select('*', { count: 'exact', head: true }).eq('is_featured', true),
      supabase.from('categories').select('*', { count: 'exact', head: true })
    ]);

    if (totalProjectsRes.error) throw totalProjectsRes.error;
    if (categoriesRes.error) throw categoriesRes.error;

    return {
      data: {
        totalProjects: totalProjectsRes.count ?? 0,
        publishedProjects: publishedProjectsRes.count ?? 0,
        draftProjects: draftProjectsRes.count ?? 0,
        featuredProjects: featuredProjectsRes.count ?? 0,
        totalCategories: categoriesRes.count ?? 0
      },
      error: null
    };
  } catch (err) {
    console.error('[adminService] Error fetching dashboard stats:', err.message);
    return {
      data: {
        totalProjects: 0,
        publishedProjects: 0,
        draftProjects: 0,
        totalCategories: 0,
        featuredProjects: 0
      },
      error: err
    };
  }
}

/**
 * Fetch latest projects for the recent projects table in Admin Dashboard.
 * Uses authorized admin access to display both published and draft records.
 *
 * @param {Object} [options]
 * @param {number} [options.limit=6]
 * @returns {Promise<{ data: Array, error: Error | null }>}
 */
export async function getRecentProjectsAdmin({ limit = 6 } = {}) {
  if (!isSupabaseConfigured) {
    const items = STATIC_PROJECTS.slice(0, limit).map((p, idx) => ({
      id: p.id,
      title: p.title,
      slug: p.id,
      coverImage: resolveImageUrl(p.coverImage),
      category: p.category,
      location: p.location || 'Delhi NCR',
      projectDate: p.completionTime || 'Delivered',
      isPublished: true,
      isFeatured: Boolean(p.isFeatured),
      createdAt: new Date(Date.now() - idx * 86400000 * 5).toISOString()
    }));
    return { data: items, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        id,
        title,
        slug,
        cover_image,
        location,
        project_date,
        is_published,
        is_featured,
        created_at,
        category:categories ( id, name, slug )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    if (!data || data.length === 0) {
      return { data: [], error: null };
    }

    const formatted = data.map(row => ({
      id: row.id,
      title: row.title,
      slug: row.slug || row.id,
      coverImage: resolveImageUrl(row.cover_image),
      category: row.category?.name || 'Interior Work',
      location: row.location || 'Delhi NCR',
      projectDate: row.project_date
        ? new Date(row.project_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
        : 'N/A',
      isPublished: Boolean(row.is_published),
      isFeatured: Boolean(row.is_featured),
      createdAt: row.created_at
    }));

    return { data: formatted, error: null };
  } catch (err) {
    console.error('[adminService] Error fetching recent projects:', err.message);
    return { data: [], error: err };
  }
}
