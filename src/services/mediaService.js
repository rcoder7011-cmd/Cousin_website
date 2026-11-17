import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import { PROJECTS as STATIC_PROJECTS } from '../data/projects.js';
import { FALLBACK_CATEGORIES } from './categoryService.js';
import {
  resolveImageUrl,
  extractStoragePathFromUrl,
  MAX_FILE_SIZE_BYTES,
  ALLOWED_MIME_TYPES,
  STORAGE_BUCKET as PROJECT_BUCKET
} from './projectImageService.js';
import { CATEGORY_STORAGE_BUCKET } from './categoryService.js';

export const MEDIA_ALLOWED_MIME_TYPES = [
  ...ALLOWED_MIME_TYPES,
  'image/avif'
];

/**
 * Format bytes to readable string (e.g. 1.25 MB, 450 KB)
 * @param {number} bytes
 * @returns {string}
 */
export function formatBytes(bytes) {
  if (bytes === 0 || bytes === null || bytes === undefined) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Extract image file extension/format from filename or url
 * @param {string} filenameOrUrl
 * @returns {string}
 */
export function extractImageFormat(filenameOrUrl) {
  if (!filenameOrUrl) return 'jpg';
  const clean = filenameOrUrl.split('?')[0].split('#')[0];
  const ext = clean.split('.').pop()?.toLowerCase();
  if (ext === 'jpeg') return 'jpg';
  if (['jpg', 'png', 'webp', 'svg', 'avif'].includes(ext)) return ext;
  return 'jpg';
}

/**
 * Extract clean filename from url or path
 * @param {string} urlOrPath
 * @returns {string}
 */
export function extractFilename(urlOrPath) {
  if (!urlOrPath) return 'unnamed-asset.jpg';
  const clean = urlOrPath.split('?')[0].split('#')[0];
  const parts = clean.split('/');
  return parts[parts.length - 1] || 'asset.jpg';
}

/**
 * Fetch all media assets across Supabase Storage and database tables.
 * Discovers and tracks real usages across projects (covers and galleries) and categories.
 *
 * @param {Object} [options]
 * @param {string} [options.search='']
 * @param {string} [options.bucket='all'] - 'all' | 'project-images' | 'category-images' | 'general'
 * @param {string} [options.format='all'] - 'all' | 'jpg' | 'png' | 'webp' | 'svg' | 'avif'
 * @param {string} [options.usage='all'] - 'all' | 'in_use' | 'unused' | 'projects' | 'categories'
 * @param {string} [options.sortBy='newest'] - 'newest' | 'oldest' | 'name_asc' | 'largest' | 'smallest'
 * @returns {Promise<{ data: Array, count: number, error: Error | null }>}
 */
export async function getMediaItems({
  search = '',
  bucket = 'all',
  format = 'all',
  usage = 'all',
  sortBy = 'newest'
} = {}) {
  // Fallback when Supabase is not configured
  if (!isSupabaseConfigured) {
    const itemsMap = new Map();

    // 1. Scan static projects
    STATIC_PROJECTS.forEach(proj => {
      // Cover image
      if (proj.coverImage) {
        const url = resolveImageUrl(proj.coverImage);
        const name = extractFilename(url);
        const id = `static-cover-${proj.id}`;

        if (!itemsMap.has(url)) {
          itemsMap.set(url, {
            id,
            url,
            name,
            storagePath: null,
            bucket: 'project-images',
            size: 480 * 1024, // approx estimate
            format: extractImageFormat(url),
            createdAt: new Date('2026-01-10T10:00:00Z').toISOString(),
            altText: `${proj.title} - Cover Showcase`,
            usages: [
              {
                type: 'project_cover',
                title: proj.title,
                id: proj.id,
                url: `/admin/projects/${proj.id}/edit`
              }
            ]
          });
        } else {
          itemsMap.get(url).usages.push({
            type: 'project_cover',
            title: proj.title,
            id: proj.id,
            url: `/admin/projects/${proj.id}/edit`
          });
        }
      }

      // Gallery photos
      if (Array.isArray(proj.photos)) {
        proj.photos.forEach((photo, idx) => {
          const rawUrl = typeof photo === 'string' ? photo : photo.src;
          const alt = (typeof photo === 'object' ? photo.alt : null) || proj.title;
          const url = resolveImageUrl(rawUrl);
          const name = extractFilename(url);
          const id = `static-gallery-${proj.id}-${idx}`;

          if (!itemsMap.has(url)) {
            itemsMap.set(url, {
              id,
              url,
              name,
              storagePath: null,
              bucket: 'project-images',
              size: 520 * 1024,
              format: extractImageFormat(url),
              createdAt: new Date(Date.now() - idx * 86400000).toISOString(),
              altText: alt,
              usages: [
                {
                  type: 'project_gallery',
                  title: `${proj.title} (Gallery #${idx + 1})`,
                  id: proj.id,
                  url: `/admin/projects/${proj.id}/edit`
                }
              ]
            });
          } else {
            itemsMap.get(url).usages.push({
              type: 'project_gallery',
              title: `${proj.title} (Gallery #${idx + 1})`,
              id: proj.id,
              url: `/admin/projects/${proj.id}/edit`
            });
          }
        });
      }
    });

    // 2. Scan fallback categories
    FALLBACK_CATEGORIES.forEach(cat => {
      if (cat.image_url) {
        const url = resolveImageUrl(cat.image_url);
        const name = extractFilename(url);
        const id = `static-cat-${cat.id}`;

        if (!itemsMap.has(url)) {
          itemsMap.set(url, {
            id,
            url,
            name,
            storagePath: null,
            bucket: 'category-images',
            size: 380 * 1024,
            format: extractImageFormat(url),
            createdAt: cat.created_at || new Date().toISOString(),
            altText: `${cat.name} Room Category`,
            usages: [
              {
                type: 'category_cover',
                title: cat.name,
                id: cat.id,
                url: `/admin/categories/${cat.id}/edit`
              }
            ]
          });
        } else {
          itemsMap.get(url).usages.push({
            type: 'category_cover',
            title: cat.name,
            id: cat.id,
            url: `/admin/categories/${cat.id}/edit`
          });
        }
      }
    });

    let items = Array.from(itemsMap.values()).map(item => ({
      ...item,
      isUsed: item.usages.length > 0
    }));

    // Apply Filters
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      items = items.filter(i =>
        i.name.toLowerCase().includes(q) ||
        i.altText?.toLowerCase().includes(q) ||
        i.usages.some(u => u.title.toLowerCase().includes(q))
      );
    }

    if (bucket && bucket !== 'all') {
      items = items.filter(i => i.bucket === bucket);
    }

    if (format && format !== 'all') {
      items = items.filter(i => i.format === format);
    }

    if (usage === 'in_use') {
      items = items.filter(i => i.isUsed);
    } else if (usage === 'unused') {
      items = items.filter(i => !i.isUsed);
    } else if (usage === 'projects') {
      items = items.filter(i => i.usages.some(u => u.type.startsWith('project')));
    } else if (usage === 'categories') {
      items = items.filter(i => i.usages.some(u => u.type === 'category_cover'));
    }

    // Apply Sorting
    if (sortBy === 'newest') {
      items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === 'oldest') {
      items.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sortBy === 'name_asc') {
      items.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'largest') {
      items.sort((a, b) => (b.size || 0) - (a.size || 0));
    } else if (sortBy === 'smallest') {
      items.sort((a, b) => (a.size || 0) - (b.size || 0));
    }

    return { data: items, count: items.length, error: null };
  }

  try {
    // 1. Fetch live database references to build accurate usage maps
    const [projectsRes, galleryRes, categoriesRes] = await Promise.all([
      supabase.from('projects').select('id, title, slug, cover_image'),
      supabase.from('project_images').select('id, project_id, image_url, alt_text, created_at, project:projects(id, title, slug)'),
      supabase.from('categories').select('id, name, slug, image_url')
    ]);

    // Usage map keyed by normalized image URL and path
    const usageMap = new Map();

    const addUsage = (rawUrl, usageObj, altText = null) => {
      if (!rawUrl) return;
      const clean = resolveImageUrl(rawUrl);
      if (!usageMap.has(clean)) {
        usageMap.set(clean, { usages: [], altText });
      }
      usageMap.get(clean).usages.push(usageObj);
      if (altText && !usageMap.get(clean).altText) {
        usageMap.get(clean).altText = altText;
      }
    };

    // Index project covers
    (projectsRes.data || []).forEach(p => {
      if (p.cover_image) {
        addUsage(p.cover_image, {
          type: 'project_cover',
          title: p.title,
          id: p.id,
          url: `/admin/projects/${p.id}/edit`
        });
      }
    });

    // Index gallery images
    (galleryRes.data || []).forEach(g => {
      if (g.image_url) {
        addUsage(g.image_url, {
          type: 'project_gallery',
          title: g.project?.title ? `${g.project.title} (Gallery)` : 'Project Gallery',
          id: g.project_id,
          galleryImageId: g.id,
          url: `/admin/projects/${g.project_id}/edit`
        }, g.alt_text);
      }
    });

    // Index category covers
    (categoriesRes.data || []).forEach(c => {
      if (c.image_url) {
        addUsage(c.image_url, {
          type: 'category_cover',
          title: c.name,
          id: c.id,
          url: `/admin/categories/${c.id}/edit`
        });
      }
    });

    // 2. Fetch Storage objects from 'project-images' and 'category-images'
    const itemsMap = new Map();

    // Helper to scan a storage bucket
    const scanBucket = async (bucketName) => {
      try {
        const { data: rootItems, error: listError } = await supabase.storage
          .from(bucketName)
          .list('', { limit: 100, sortBy: { column: 'created_at', order: 'desc' } });

        if (listError) return;

        for (const item of rootItems || []) {
          // If folder, list subfolder contents
          if (!item.id && !item.metadata) {
            const { data: subFiles } = await supabase.storage
              .from(bucketName)
              .list(item.name, { limit: 100 });

            for (const sub of subFiles || []) {
              if (sub.name === '.emptyFolderPlaceholder') continue;
              const storagePath = `${item.name}/${sub.name}`;
              const { data: urlData } = supabase.storage
                .from(bucketName)
                .getPublicUrl(storagePath);

              const publicUrl = urlData.publicUrl;
              const usageInfo = usageMap.get(publicUrl) || { usages: [], altText: null };

              itemsMap.set(publicUrl, {
                id: `storage-${bucketName}-${storagePath}`,
                url: publicUrl,
                name: sub.name,
                storagePath,
                bucket: bucketName,
                size: sub.metadata?.size || null,
                format: extractImageFormat(sub.name),
                createdAt: sub.created_at || item.created_at || new Date().toISOString(),
                altText: usageInfo.altText || extractFilename(sub.name).replace(/[-_]/g, ' '),
                usages: usageInfo.usages,
                isUsed: usageInfo.usages.length > 0
              });
            }
          } else {
            if (item.name === '.emptyFolderPlaceholder') continue;
            const storagePath = item.name;
            const { data: urlData } = supabase.storage
              .from(bucketName)
              .getPublicUrl(storagePath);

            const publicUrl = urlData.publicUrl;
            const usageInfo = usageMap.get(publicUrl) || { usages: [], altText: null };

            itemsMap.set(publicUrl, {
              id: `storage-${bucketName}-${storagePath}`,
              url: publicUrl,
              name: item.name,
              storagePath,
              bucket: bucketName,
              size: item.metadata?.size || null,
              format: extractImageFormat(item.name),
              createdAt: item.created_at || new Date().toISOString(),
              altText: usageInfo.altText || extractFilename(item.name).replace(/[-_]/g, ' '),
              usages: usageInfo.usages,
              isUsed: usageInfo.usages.length > 0
            });
          }
        }
      } catch (err) {
        console.warn(`[mediaService] Could not list bucket "${bucketName}":`, err.message);
      }
    };

    await Promise.all([
      scanBucket(PROJECT_BUCKET),
      scanBucket(CATEGORY_STORAGE_BUCKET)
    ]);

    // 3. Include any database URLs not in the listed storage scan (e.g. static/CDN references)
    usageMap.forEach((val, url) => {
      if (!itemsMap.has(url)) {
        const name = extractFilename(url);
        itemsMap.set(url, {
          id: `db-ref-${name}-${Math.random().toString(36).substr(2, 6)}`,
          url,
          name,
          storagePath: extractStoragePathFromUrl(url),
          bucket: url.includes(CATEGORY_STORAGE_BUCKET) ? CATEGORY_STORAGE_BUCKET : PROJECT_BUCKET,
          size: null,
          format: extractImageFormat(url),
          createdAt: new Date().toISOString(),
          altText: val.altText || name.replace(/[-_]/g, ' '),
          usages: val.usages,
          isUsed: true
        });
      }
    });

    let items = Array.from(itemsMap.values());

    // Apply Search
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      items = items.filter(i =>
        i.name.toLowerCase().includes(q) ||
        i.altText?.toLowerCase().includes(q) ||
        i.url.toLowerCase().includes(q) ||
        i.usages.some(u => u.title.toLowerCase().includes(q))
      );
    }

    // Apply Bucket Filter
    if (bucket && bucket !== 'all') {
      items = items.filter(i => i.bucket === bucket);
    }

    // Apply Format Filter
    if (format && format !== 'all') {
      items = items.filter(i => i.format === format);
    }

    // Apply Usage Filter
    if (usage === 'in_use') {
      items = items.filter(i => i.isUsed);
    } else if (usage === 'unused') {
      items = items.filter(i => !i.isUsed);
    } else if (usage === 'projects') {
      items = items.filter(i => i.usages.some(u => u.type.startsWith('project')));
    } else if (usage === 'categories') {
      items = items.filter(i => i.usages.some(u => u.type === 'category_cover'));
    }

    // Apply Sorting
    if (sortBy === 'newest') {
      items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === 'oldest') {
      items.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sortBy === 'name_asc') {
      items.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'largest') {
      items.sort((a, b) => (b.size || 0) - (a.size || 0));
    } else if (sortBy === 'smallest') {
      items.sort((a, b) => (a.size || 0) - (b.size || 0));
    }

    return { data: items, count: items.length, error: null };
  } catch (err) {
    console.error('[mediaService] Error fetching media items:', err.message);
    return { data: [], count: 0, error: err };
  }
}

/**
 * Get aggregate statistics across the Media Library
 * @returns {Promise<{
 *   totalImages: number,
 *   totalBytes: number,
 *   projectImagesCount: number,
 *   categoryImagesCount: number,
 *   generalImagesCount: number,
 *   inUseCount: number,
 *   unusedCount: number
 * }>}
 */
export async function getMediaStats() {
  const { data: items } = await getMediaItems();

  let totalBytes = 0;
  let projectImagesCount = 0;
  let categoryImagesCount = 0;
  let generalImagesCount = 0;
  let inUseCount = 0;
  let unusedCount = 0;

  (items || []).forEach(item => {
    if (item.size) totalBytes += item.size;
    if (item.bucket === CATEGORY_STORAGE_BUCKET) {
      categoryImagesCount++;
    } else if (item.usages.some(u => u.type.startsWith('project'))) {
      projectImagesCount++;
    } else {
      generalImagesCount++;
    }

    if (item.isUsed) inUseCount++;
    else unusedCount++;
  });

  return {
    totalImages: items?.length || 0,
    totalBytes,
    projectImagesCount,
    categoryImagesCount,
    generalImagesCount,
    inUseCount,
    unusedCount
  };
}

/**
 * Upload an image file to Supabase Storage with unique filename and validation.
 *
 * @param {File} file
 * @param {Object} [options]
 * @param {string} [options.folder='media/general']
 * @param {string} [options.bucket=PROJECT_BUCKET]
 * @returns {Promise<{ data: Object | null, error: Error | null }>}
 */
export async function uploadMediaImage(file, { folder = 'media/general', bucket = PROJECT_BUCKET } = {}) {
  if (!file) return { data: null, error: new Error('No file provided.') };

  // Validate format
  if (!MEDIA_ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      data: null,
      error: new Error(`Unsupported format (${file.type}). Allowed: JPG, PNG, WebP, SVG, AVIF.`)
    };
  }

  // Validate size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      data: null,
      error: new Error(`File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds 10MB limit.`)
    };
  }

  if (!isSupabaseConfigured) {
    const previewUrl = URL.createObjectURL(file);
    return {
      data: {
        id: `local-${Date.now()}`,
        url: previewUrl,
        name: file.name,
        storagePath: `${folder}/${file.name}`,
        bucket,
        size: file.size,
        format: extractImageFormat(file.name),
        createdAt: new Date().toISOString(),
        altText: file.name.split('.')[0].replace(/[-_]/g, ' '),
        usages: [],
        isUsed: false
      },
      error: null
    };
  }

  try {
    const timestamp = Date.now();
    const cleanName = file.name
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, '-')
      .replace(/-+/g, '-');
    const storagePath = `${folder}/${timestamp}-${cleanName}`;

    let targetBucket = bucket;
    let { error: uploadError } = await supabase.storage
      .from(targetBucket)
      .upload(storagePath, file, {
        cacheControl: '31536000',
        upsert: false
      });

    // Fallback if target bucket doesn't exist
    if (uploadError && uploadError.message?.toLowerCase().includes('bucket not found')) {
      targetBucket = PROJECT_BUCKET;
      const fallbackPath = `${folder}/${timestamp}-${cleanName}`;
      const { error: fallbackErr } = await supabase.storage
        .from(targetBucket)
        .upload(fallbackPath, file, {
          cacheControl: '31536000',
          upsert: false
        });

      if (fallbackErr) throw fallbackErr;

      const { data: urlData } = supabase.storage
        .from(targetBucket)
        .getPublicUrl(fallbackPath);

      return {
        data: {
          id: `storage-${targetBucket}-${fallbackPath}`,
          url: urlData.publicUrl,
          name: file.name,
          storagePath: fallbackPath,
          bucket: targetBucket,
          size: file.size,
          format: extractImageFormat(file.name),
          createdAt: new Date().toISOString(),
          altText: file.name.split('.')[0].replace(/[-_]/g, ' '),
          usages: [],
          isUsed: false
        },
        error: null
      };
    }

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from(targetBucket)
      .getPublicUrl(storagePath);

    return {
      data: {
        id: `storage-${targetBucket}-${storagePath}`,
        url: urlData.publicUrl,
        name: file.name,
        storagePath,
        bucket: targetBucket,
        size: file.size,
        format: extractImageFormat(file.name),
        createdAt: new Date().toISOString(),
        altText: file.name.split('.')[0].replace(/[-_]/g, ' '),
        usages: [],
        isUsed: false
      },
      error: null
    };
  } catch (err) {
    console.error('[mediaService] Error uploading media image:', err.message);
    return { data: null, error: err };
  }
}

/**
 * Upload multiple images with individual progress reporting.
 *
 * @param {FileList|File[]} files
 * @param {Object} [options]
 * @param {Function} [onProgress] - (current, total, currentFileName)
 * @returns {Promise<{ uploaded: Array, failed: Array }>}
 */
export async function uploadMultipleMediaImages(files, options = {}, onProgress = null) {
  const fileArray = Array.from(files || []);
  const uploaded = [];
  const failed = [];

  for (let i = 0; i < fileArray.length; i++) {
    const file = fileArray[i];
    if (onProgress) onProgress(i + 1, fileArray.length, file.name);

    const { data, error } = await uploadMediaImage(file, options);
    if (error || !data) {
      failed.push({ file: file.name, error: error?.message || 'Upload failed' });
    } else {
      uploaded.push(data);
    }
  }

  return { uploaded, failed };
}

/**
 * Update image metadata (Alt Text). Synchronizes changes to project_images or categories.
 *
 * @param {Object} mediaItem
 * @param {Object} updates
 * @param {string} updates.altText
 * @returns {Promise<{ success: boolean, error: Error | null }>}
 */
export async function updateMediaMetadata(mediaItem, { altText }) {
  if (!mediaItem) return { success: false, error: new Error('Media item required.') };

  if (!isSupabaseConfigured) {
    mediaItem.altText = altText;
    return { success: true, error: null };
  }

  try {
    const cleanAlt = altText?.trim() || '';

    // If used in project_images, update all corresponding gallery rows
    const galleryUsages = mediaItem.usages?.filter(u => u.type === 'project_gallery') || [];
    for (const u of galleryUsages) {
      if (u.galleryImageId) {
        await supabase
          .from('project_images')
          .update({ alt_text: cleanAlt })
          .eq('id', u.galleryImageId);
      } else {
        await supabase
          .from('project_images')
          .update({ alt_text: cleanAlt })
          .eq('image_url', mediaItem.url);
      }
    }

    return { success: true, error: null };
  } catch (err) {
    console.error('[mediaService] Error updating metadata:', err.message);
    return { success: false, error: err };
  }
}

/**
 * Safely delete an image.
 * CRITICAL RULE: If image is referenced by ANY project or category, deletion is BLOCKED.
 *
 * @param {Object} mediaItem
 * @returns {Promise<{ success: boolean, blocked?: boolean, message?: string, error: Error | null }>}
 */
export async function deleteMediaItemSafe(mediaItem) {
  if (!mediaItem) return { success: false, error: new Error('Media item required.') };

  // 1. Safety check: Block if used anywhere
  if (mediaItem.usages && mediaItem.usages.length > 0) {
    const firstUsage = mediaItem.usages[0];
    return {
      success: false,
      blocked: true,
      message: `Cannot delete image: It is currently active in "${firstUsage.title}". You must remove or replace it from that content before deleting.`
    };
  }

  if (!isSupabaseConfigured) {
    return { success: true, error: null };
  }

  try {
    // 2. Remove file from storage if path exists
    const storagePath = mediaItem.storagePath || extractStoragePathFromUrl(mediaItem.url);
    if (storagePath && mediaItem.bucket) {
      const { error: storageErr } = await supabase.storage
        .from(mediaItem.bucket)
        .remove([storagePath]);

      if (storageErr) {
        console.warn('[mediaService] Storage remove warning:', storageErr.message);
      }
    }

    // 3. Clean up any unreferenced project_images rows
    await supabase
      .from('project_images')
      .delete()
      .eq('image_url', mediaItem.url);

    return { success: true, error: null };
  } catch (err) {
    console.error('[mediaService] Error deleting media item:', err.message);
    return { success: false, error: err };
  }
}

/**
 * Replace an existing media image with a new file.
 * Uploads new file to storage first, then updates all database references safely.
 *
 * @param {Object} oldItem - Current media item
 * @param {File} newFile - New file to replace with
 * @returns {Promise<{ success: boolean, newItem: Object | null, error: Error | null }>}
 */
export async function replaceMediaImage(oldItem, newFile) {
  if (!oldItem || !newFile) {
    return { success: false, newItem: null, error: new Error('Original item and new file required.') };
  }

  try {
    // 1. Upload new image first
    const folder = oldItem.storagePath ? oldItem.storagePath.split('/')[0] : 'media/general';
    const targetBucket = oldItem.bucket || PROJECT_BUCKET;

    const { data: newUpload, error: uploadErr } = await uploadMediaImage(newFile, {
      folder,
      bucket: targetBucket
    });

    if (uploadErr || !newUpload) throw uploadErr || new Error('Upload failed.');

    const newUrl = newUpload.url;

    if (isSupabaseConfigured) {
      // 2. Update projects.cover_image references
      await supabase
        .from('projects')
        .update({ cover_image: newUrl })
        .eq('cover_image', oldItem.url);

      // 3. Update project_images.image_url references
      await supabase
        .from('project_images')
        .update({ image_url: newUrl })
        .eq('image_url', oldItem.url);

      // 4. Update categories.image_url references
      await supabase
        .from('categories')
        .update({ image_url: newUrl })
        .eq('image_url', oldItem.url);

      // 5. Delete old file from storage safely
      if (oldItem.storagePath && oldItem.bucket) {
        await supabase.storage
          .from(oldItem.bucket)
          .remove([oldItem.storagePath]);
      }
    }

    // Return new item with updated references
    const updatedItem = {
      ...newUpload,
      altText: oldItem.altText,
      usages: oldItem.usages,
      isUsed: (oldItem.usages?.length || 0) > 0
    };

    return { success: true, newItem: updatedItem, error: null };
  } catch (err) {
    console.error('[mediaService] Error replacing media image:', err.message);
    return { success: false, newItem: null, error: err };
  }
}
