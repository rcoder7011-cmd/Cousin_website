import { supabase, isSupabaseConfigured } from '../lib/supabase.js';

export const STORAGE_BUCKET = 'project-images';
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];

export const DEFAULT_FALLBACK_IMAGE = '/images/projects/Living Room/78d10c45-348b-4c86-90f8-942b36a10bc9.png';

/**
 * Resolves an image reference into a safe, valid URL.
 * Handles:
 * 1. External URLs (http://, https://)
 * 2. Local public paths (/images/...)
 * 3. Supabase Storage relative paths (e.g. "project-id/image.webp")
 * 4. Fallback placeholder for missing/empty values
 *
 * @param {string} [pathOrUrl]
 * @param {string} [fallback=DEFAULT_FALLBACK_IMAGE]
 * @returns {string}
 */
export function resolveImageUrl(pathOrUrl, fallback = DEFAULT_FALLBACK_IMAGE) {
  if (!pathOrUrl || typeof pathOrUrl !== 'string' || !pathOrUrl.trim()) {
    return fallback;
  }

  const trimmed = pathOrUrl.trim();

  // If already absolute URL or local public path
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/') || trimmed.startsWith('data:')) {
    return trimmed;
  }

  // If it's a Supabase storage path in the 'project-images' bucket
  if (isSupabaseConfigured) {
    try {
      const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(trimmed);
      return data?.publicUrl || fallback;
    } catch {
      return fallback;
    }
  }

  return fallback;
}

/**
 * Fetch all gallery images for a specific project
 * @param {string} projectId - UUID
 * @returns {Promise<{ data: Array, error: Error | null }>}
 */
export async function getImagesByProjectId(projectId) {
  if (!isSupabaseConfigured) {
    return { data: [], error: null };
  }

  try {
    const { data, error } = await supabase
      .from('project_images')
      .select('id, project_id, image_url, alt_text, display_order, created_at')
      .eq('project_id', projectId)
      .order('display_order', { ascending: true });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (err) {
    console.error(`[projectImageService] Error fetching images for project ${projectId}:`, err.message);
    return { data: [], error: err };
  }
}

/**
 * Upload an image file to Supabase Storage in the 'project-images' bucket
 * Organized by project ID folder: `${projectId}/${timestamp}-${cleanFileName}`
 *
 * @param {File} file - Browser File object
 * @param {Object} options
 * @param {string} options.projectId - Target project UUID
 * @param {string} [options.customFileName] - Optional custom name
 * @returns {Promise<{ data: { path: string, publicUrl: string } | null, error: Error | null }>}
 */
export async function uploadProjectImage(file, { projectId, customFileName } = {}) {
  if (!isSupabaseConfigured) {
    return { data: null, error: new Error('Supabase is not configured.') };
  }

  // 1. Validate file existence
  if (!file) {
    return { data: null, error: new Error('No file provided for upload.') };
  }

  // 2. Validate file type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      data: null,
      error: new Error(`Invalid file type (${file.type}). Allowed types: JPEG, PNG, WebP, SVG.`)
    };
  }

  // 3. Validate file size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      data: null,
      error: new Error(`File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds maximum allowed limit of 10MB.`)
    };
  }

  try {
    const projectFolder = projectId || 'general';
    const timestamp = Date.now();
    const cleanFileName = (customFileName || file.name)
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, '-')
      .replace(/-+/g, '-');
    const storagePath = `${projectFolder}/${timestamp}-${cleanFileName}`;

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, file, {
        cacheControl: '31536000', // 1 year cache
        upsert: false
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(storagePath);

    return {
      data: {
        path: storagePath,
        publicUrl: urlData.publicUrl
      },
      error: null
    };
  } catch (err) {
    console.error('[projectImageService] Error uploading image:', err.message);
    return { data: null, error: err };
  }
}

/**
 * Add a record to the project_images database table
 * @param {Object} imageData
 * @param {string} imageData.projectId
 * @param {string} imageData.imageUrl
 * @param {string} [imageData.altText]
 * @param {number} [imageData.displayOrder]
 * @returns {Promise<{ data: Object | null, error: Error | null }>}
 */
export async function createProjectImageRecord({ projectId, imageUrl, altText, displayOrder = 0 }) {
  if (!isSupabaseConfigured) {
    return { data: null, error: new Error('Supabase is not configured.') };
  }

  try {
    const { data, error } = await supabase
      .from('project_images')
      .insert([{
        project_id: projectId,
        image_url: imageUrl,
        alt_text: altText || 'Interior project photograph - Saifi Interior Hub',
        display_order: displayOrder
      }])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    console.error('[projectImageService] Error creating project image record:', err.message);
    return { data: null, error: err };
  }
}

/**
 * Extract relative storage path from a Supabase Storage public URL
 * e.g., "https://.../storage/v1/object/public/project-images/folder/file.jpg" -> "folder/file.jpg"
 * @param {string} url
 * @returns {string|null}
 */
export function extractStoragePathFromUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const marker = `/${STORAGE_BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx !== -1) {
    const rawPath = url.substring(idx + marker.length);
    // Strip query parameters if any
    return rawPath.split('?')[0];
  }
  return null;
}

/**
 * Remove multiple files from the project-images storage bucket safely
 * @param {string[]} paths - Array of relative storage paths
 * @returns {Promise<{ success: boolean, removed: number, error: Error | null }>}
 */
export async function deleteStorageFiles(paths) {
  if (!isSupabaseConfigured || !Array.isArray(paths) || paths.length === 0) {
    return { success: true, removed: 0, error: null };
  }

  // Filter out invalid or non-storage paths
  const validPaths = paths.filter(p => typeof p === 'string' && p.trim().length > 0);
  if (validPaths.length === 0) {
    return { success: true, removed: 0, error: null };
  }

  try {
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove(validPaths);

    if (error) {
      console.warn('[projectImageService] Warning deleting storage files:', error.message);
      return { success: false, removed: 0, error };
    }

    return { success: true, removed: validPaths.length, error: null };
  } catch (err) {
    console.error('[projectImageService] Error deleting storage files:', err.message);
    return { success: false, removed: 0, error: err };
  }
}

/**
 * Delete all files inside a project's storage folder
 * @param {string} projectId
 * @returns {Promise<{ success: boolean, count: number, error: Error | null }>}
 */
export async function deleteProjectStorageFolder(projectId) {
  if (!isSupabaseConfigured || !projectId) {
    return { success: true, count: 0, error: null };
  }

  try {
    const { data: files, error: listError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .list(projectId);

    if (listError) throw listError;

    if (!files || files.length === 0) {
      return { success: true, count: 0, error: null };
    }

    const pathsToDelete = files.map(f => `${projectId}/${f.name}`);
    const { error: removeError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove(pathsToDelete);

    if (removeError) throw removeError;

    return { success: true, count: pathsToDelete.length, error: null };
  } catch (err) {
    console.error(`[projectImageService] Error deleting project folder "${projectId}":`, err.message);
    return { success: false, count: 0, error: err };
  }
}

/**
 * Delete an image: removes the database record and deletes the binary object from Supabase Storage
 * @param {Object} options
 * @param {string} options.imageId - Database row UUID
 * @param {string} [options.storagePath] - Storage object path (if known)
 * @returns {Promise<{ success: boolean, error: Error | null }>}
 */
export async function deleteProjectImage({ imageId, storagePath }) {
  if (!isSupabaseConfigured) {
    return { success: false, error: new Error('Supabase is not configured.') };
  }

  try {
    // 1. Delete file from storage if path provided
    if (storagePath) {
      const { error: storageError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([storagePath]);

      if (storageError) {
        console.warn(`[projectImageService] Storage remove warning for "${storagePath}":`, storageError.message);
      }
    }

    // 2. Delete row from database
    const { error: dbError } = await supabase
      .from('project_images')
      .delete()
      .eq('id', imageId);

    if (dbError) throw dbError;
    return { success: true, error: null };
  } catch (err) {
    console.error(`[projectImageService] Error deleting image ${imageId}:`, err.message);
    return { success: false, error: err };
  }
}

