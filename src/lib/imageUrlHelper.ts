/**
 * Image URL analysis, validation, and normalization utilities for Foodie BD
 */

export interface ImageUrlAnalysis {
  isValid: boolean;
  trimmedUrl: string;
  error?: string;
  isWebpageWarning?: boolean;
  warningMessage?: string;
  suggestedDirectUrl?: string;
  detectedHost?: string;
}

/**
 * Normalizes any safe food image reference into a standard browser-loadable path or URL.
 * - Leaves absolute http:// and https:// URLs as is
 * - Leaves /api/images/... and root-relative /... paths as is
 * - Transforms storage paths (uploads/food_123.png, food-images/food_123.png) to /api/images/food_123.png
 * - Transforms bare safe filenames (food_123.png) to /api/images/food_123.png
 */
export function normalizeFoodImageReference(rawRef: unknown): string {
  if (typeof rawRef !== 'string') return '';
  const trimmed = rawRef.trim();
  if (!trimmed) return '';

  // If already starts with /api/images/ or /, return trimmed
  if (trimmed.startsWith('/')) {
    return trimmed;
  }

  // If it is an absolute http:// or https:// URL
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  // If it starts with uploads/ (relative local storage path)
  if (trimmed.startsWith('uploads/')) {
    const filename = trimmed.slice('uploads/'.length);
    return `/api/images/${filename}`;
  }

  // If it starts with food-images/ (Supabase bucket path)
  if (trimmed.startsWith('food-images/')) {
    const filename = trimmed.slice('food-images/'.length);
    return `/api/images/${filename}`;
  }

  // If it is a safe food or avatar image filename (e.g. food_1792...png, avatar_1792...png)
  if (/^(food|avatar)_[a-zA-Z0-9_\-\.]+\.(jpe?g|png|webp|gif|svg)$/i.test(trimmed)) {
    return `/api/images/${trimmed}`;
  }

  return trimmed;
}

/**
 * Trims whitespace and normalizes the URL
 */
export function normalizeImageUrl(url: string): string {
  return normalizeFoodImageReference(url);
}

/**
 * Validates whether a food image reference is safe and valid:
 * - Accepts valid application-managed image paths (e.g. /api/images/food_123.png, /placeholder-food.jpg)
 * - Accepts valid HTTP/HTTPS URLs (e.g. Supabase Storage, Wikimedia, CDNs)
 * - Accepts normalized storage paths (uploads/food_..., food-images/food_..., food_...png)
 * - Allows optional query strings (e.g. cache busters ?t=...)
 * - Strictly rejects path traversal (..), protocol-relative bypasses (//), backslashes (\),
 *   unsupported protocols (javascript:, data:, file:), malformed strings, and non-strings.
 */
export function isValidFoodImageReference(imageRef: unknown): boolean {
  if (typeof imageRef !== 'string') return false;
  const rawTrimmed = imageRef.trim();
  if (!rawTrimmed) return false;

  // Prevent protocol-relative URLs (//evil.com), path traversal (..), and backslash evasions
  if (rawTrimmed.startsWith('//') || rawTrimmed.includes('..') || rawTrimmed.includes('\\')) {
    return false;
  }

  // Prevent control characters, whitespace, newlines, null bytes
  if (/[\s\0\r\n]/.test(rawTrimmed)) {
    return false;
  }

  // Reject dangerous pseudo-protocols
  if (/^(javascript|data|file|vbscript|about):/i.test(rawTrimmed)) {
    return false;
  }

  const trimmed = normalizeFoodImageReference(rawTrimmed);

  // 1. Application-managed internal image paths
  if (trimmed.startsWith('/')) {
    const cleanPath = trimmed.split('?')[0].split('#')[0];
    // If it is an /api/images/ path, enforce valid filename and extension
    if (cleanPath.startsWith('/api/images/')) {
      const fileName = cleanPath.slice('/api/images/'.length);
      return /^[a-zA-Z0-9_\-\.]+\.(jpe?g|png|webp|gif|svg)$/i.test(fileName);
    }
    // Other root-relative asset paths (e.g. /placeholder-food.jpg, /assets/...)
    return /^\/[a-zA-Z0-9_\-\.\/]+\.(jpe?g|png|webp|gif|svg)$/i.test(cleanPath);
  }

  // 2. Absolute HTTP/HTTPS URLs
  try {
    const parsed = new URL(trimmed);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false;
    }
    if (!parsed.hostname || parsed.hostname.length === 0) {
      return false;
    }
    if (parsed.username || parsed.password) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Analyzes an image URL for validity, protocol, common hosting limitations,
 * and detects webpage preview links (Google Drive, Google Photos, Imgur, Dropbox)
 */
export function analyzeImageUrl(rawUrl: string): ImageUrlAnalysis {
  const trimmed = normalizeImageUrl(rawUrl);

  if (!trimmed) {
    return {
      isValid: false,
      trimmedUrl: '',
      error: 'Image URL cannot be empty.',
    };
  }

  // Direct internal storage paths (e.g. /api/images/food_123.webp)
  if (trimmed.startsWith('/')) {
    if (!isValidFoodImageReference(trimmed)) {
      return {
        isValid: false,
        trimmedUrl: trimmed,
        error: 'Invalid application image path or filename format.',
      };
    }
    return {
      isValid: true,
      trimmedUrl: trimmed,
    };
  }

  // Check valid URL structure
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return {
      isValid: false,
      trimmedUrl: trimmed,
      error: 'Please enter a valid URL (e.g. https://example.com/food.jpg).',
    };
  }

  // Check protocol
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return {
      isValid: false,
      trimmedUrl: trimmed,
      error: 'Image URL must use http:// or https:// protocol.',
    };
  }

  const hostname = parsed.hostname.toLowerCase();
  const pathname = parsed.pathname;

  // 1. Google Drive sharing link detection
  // e.g. https://drive.google.com/file/d/FILE_ID/view?usp=sharing
  // e.g. https://drive.google.com/open?id=FILE_ID
  if (hostname.includes('drive.google.com')) {
    let fileId = '';
    const matchD = pathname.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (matchD && matchD[1]) {
      fileId = matchD[1];
    } else {
      fileId = parsed.searchParams.get('id') || '';
    }

    if (fileId && !pathname.includes('/uc')) {
      const directUrl = `https://lh3.googleusercontent.com/d/${fileId}`;
      return {
        isValid: true,
        trimmedUrl: trimmed,
        isWebpageWarning: true,
        detectedHost: 'Google Drive',
        warningMessage:
          'This is a Google Drive webpage preview link. Standard Drive viewer links cannot load directly as images. Make sure file sharing is set to "Anyone with the link can view", or use the direct link below.',
        suggestedDirectUrl: directUrl,
      };
    }
  }

  // 2. Google Photos album/share links
  // e.g. https://photos.app.goo.gl/... or https://photos.google.com/share/...
  if (hostname.includes('photos.google.com') || hostname.includes('photos.app.goo.gl')) {
    return {
      isValid: true,
      trimmedUrl: trimmed,
      isWebpageWarning: true,
      detectedHost: 'Google Photos',
      warningMessage:
        'Google Photos album links are interactive webpages, not direct images. Right-click the opened photo and select "Copy image address", or upload to a direct image host (e.g. Imgur, Postimages).',
    };
  }

  // 3. Imgur webpage links
  // e.g. https://imgur.com/a/abc or https://imgur.com/gallery/abc or https://imgur.com/abc
  if (hostname === 'imgur.com' || hostname === 'www.imgur.com') {
    const segments = pathname.split('/').filter(Boolean);
    const lastSeg = segments[segments.length - 1];
    if (lastSeg && !lastSeg.includes('.')) {
      const directUrl = `https://i.imgur.com/${lastSeg}.jpg`;
      return {
        isValid: true,
        trimmedUrl: trimmed,
        isWebpageWarning: true,
        detectedHost: 'Imgur',
        warningMessage:
          'This is an Imgur webpage link rather than the direct image file. You can use the direct link below.',
        suggestedDirectUrl: directUrl,
      };
    }
  }

  // 4. Dropbox sharing links
  // e.g. https://www.dropbox.com/s/xyz/photo.jpg?dl=0
  if (hostname.includes('dropbox.com')) {
    if (parsed.searchParams.get('dl') === '0' || !parsed.searchParams.get('raw')) {
      const directUrl = trimmed.replace(/[?&]dl=0/, '').concat(trimmed.includes('?') ? '&raw=1' : '?raw=1');
      return {
        isValid: true,
        trimmedUrl: trimmed,
        isWebpageWarning: true,
        detectedHost: 'Dropbox',
        warningMessage:
          'Dropbox preview links need "?raw=1" to serve the direct image stream rather than the Dropbox web interface.',
        suggestedDirectUrl: directUrl,
      };
    }
  }

  return {
    isValid: true,
    trimmedUrl: trimmed,
    detectedHost: hostname,
  };
}
