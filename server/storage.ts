import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface UploadedImageMeta {
  storagePath: string;
  url: string;
  fileName: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
  uploadedByUserId: string;
}

export interface ValidationResult {
  isValid: boolean;
  errorBn?: string;
  errorEn?: string;
  detectedMime?: string;
  extension?: string;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
export const DEFAULT_STORAGE_BUCKET = 'food-images';

// Ensure local uploads directory exists for caching/fallback
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * Validates actual binary content (magic numbers / file signature)
 * and file size to prevent extension spoofing and oversized payloads.
 */
export function validateImageBuffer(buffer: Buffer): ValidationResult {
  if (!buffer || buffer.length === 0) {
    return {
      isValid: false,
      errorBn: 'কোনো ইমেজ ফাইল পাওয়া যায়নি।',
      errorEn: 'No image file payload provided.',
    };
  }

  if (buffer.length > MAX_FILE_SIZE) {
    return {
      isValid: false,
      errorBn: 'ছবির আকার সর্বোচ্চ ৫ মেগাবাইট (5 MB) হতে পারবে।',
      errorEn: 'File size exceeds the 5 MB limit.',
    };
  }

  // Detect JPEG: FF D8 FF
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return {
      isValid: true,
      detectedMime: 'image/jpeg',
      extension: 'jpg',
    };
  }

  // Detect PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return {
      isValid: true,
      detectedMime: 'image/png',
      extension: 'png',
    };
  }

  // Detect WebP: RIFF .... WEBP
  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return {
      isValid: true,
      detectedMime: 'image/webp',
      extension: 'webp',
    };
  }

  return {
    isValid: false,
    errorBn: 'শুধুমাত্র JPG, PNG বা WebP ফরম্যাটের ছবি আপলোড করা যাবে।',
    errorEn: 'Only JPG, PNG, and WebP image formats are supported.',
  };
}

export class ImageStorageService {
  private uploadsDir: string;
  private supabase: SupabaseClient | null = null;
  private bucketName: string;

  constructor() {
    this.uploadsDir = UPLOADS_DIR;
    this.bucketName = process.env.SUPABASE_STORAGE_BUCKET || DEFAULT_STORAGE_BUCKET;
    this.initSupabaseClient();
  }

  private initSupabaseClient(): void {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && serviceRoleKey) {
      try {
        this.supabase = createClient(supabaseUrl, serviceRoleKey, {
          auth: { persistSession: false },
        });
      } catch (err: any) {
        console.error('[STORAGE WARNING]: Failed to initialize Supabase client:', err.message);
        this.supabase = null;
      }
    } else {
      this.supabase = null;
    }
  }

  /**
   * Returns current active storage provider name.
   */
  public getStorageProviderName(): string {
    if (this.supabase) {
      return `Supabase Storage (bucket: ${this.bucketName})`;
    }
    return 'Persistent Local Storage Engine (./data/uploads)';
  }

  /**
   * Tests reachability of the configured storage provider.
   */
  public async testStorageConnection(): Promise<{
    isAvailable: boolean;
    provider: string;
    bucket?: string;
    error?: string;
  }> {
    if (!this.supabase) {
      return {
        isAvailable: false,
        provider: 'local',
        error: 'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are not configured.',
      };
    }

    try {
      const { data, error } = await this.supabase.storage.getBucket(this.bucketName);
      if (error) {
        return {
          isAvailable: false,
          provider: 'supabase',
          bucket: this.bucketName,
          error: error.message,
        };
      }
      return {
        isAvailable: true,
        provider: 'supabase',
        bucket: data.name,
      };
    } catch (err: any) {
      return {
        isAvailable: false,
        provider: 'supabase',
        bucket: this.bucketName,
        error: err.message,
      };
    }
  }

  /**
   * Idempotently ensures the public food-images storage bucket exists in Supabase.
   */
  public async ensureBucketExists(): Promise<{
    success: boolean;
    created?: boolean;
    message?: string;
  }> {
    if (!this.supabase) {
      return { success: false, message: 'Supabase client is not initialized.' };
    }
    try {
      const { data, error } = await this.supabase.storage.getBucket(this.bucketName);
      if (data && !error) {
        return { success: true, created: false, message: `Bucket "${this.bucketName}" already exists.` };
      }
      const { data: createData, error: createError } = await this.supabase.storage.createBucket(this.bucketName, {
        public: true,
        fileSizeLimit: MAX_FILE_SIZE,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      });
      if (createError) {
        return { success: false, message: `Failed to create bucket "${this.bucketName}": ${createError.message}` };
      }
      return { success: true, created: true, message: `Bucket "${this.bucketName}" created successfully with public access.` };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  /**
   * Stores image buffer safely with binary signature validation and upload to Supabase Storage.
   */
  public async saveImage(
    buffer: Buffer,
    originalName: string,
    userId: string
  ): Promise<UploadedImageMeta> {
    const validation = validateImageBuffer(buffer);
    if (!validation.isValid) {
      throw new Error(validation.errorEn || 'Invalid image file.');
    }

    const ext = validation.extension || 'jpg';
    const randomHex = crypto.randomBytes(8).toString('hex');
    const timestamp = Date.now();
    const safeFileName = `food_${timestamp}_${randomHex}.${ext}`;
    const destinationPath = path.join(this.uploadsDir, safeFileName);

    // If Supabase Storage is configured, upload to bucket
    if (this.supabase) {
      try {
        const { error: uploadError } = await this.supabase.storage
          .from(this.bucketName)
          .upload(safeFileName, buffer, {
            contentType: validation.detectedMime || 'image/jpeg',
            cacheControl: '31536000',
            upsert: false,
          });

        if (uploadError) {
          throw new Error(`Supabase Storage upload failed: ${uploadError.message}`);
        }

        const { data: publicUrlData } = this.supabase.storage
          .from(this.bucketName)
          .getPublicUrl(safeFileName);

        // Also cache locally for fast retrieval
        await fs.promises.writeFile(destinationPath, buffer).catch(() => {});

        return {
          storagePath: `${this.bucketName}/${safeFileName}`,
          url: publicUrlData.publicUrl,
          fileName: safeFileName,
          size: buffer.length,
          mimeType: validation.detectedMime || 'image/jpeg',
          uploadedAt: new Date().toISOString(),
          uploadedByUserId: userId,
        };
      } catch (err: any) {
        if (process.env.NODE_ENV === 'production') {
          throw new Error(`Production image upload failed: ${err.message}`);
        }
        console.warn('[STORAGE NOTICE]: Remote upload failed, falling back to local file:', err.message);
      }
    } else if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'Supabase Storage is required in production. Please configure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'
      );
    }

    // Development local storage fallback
    await fs.promises.writeFile(destinationPath, buffer);
    const relativePath = path.posix.join('uploads', safeFileName);
    const publicUrl = `/api/images/${safeFileName}`;

    return {
      storagePath: relativePath,
      url: publicUrl,
      fileName: safeFileName,
      size: buffer.length,
      mimeType: validation.detectedMime || 'image/jpeg',
      uploadedAt: new Date().toISOString(),
      uploadedByUserId: userId,
    };
  }

  /**
   * Retrieves an image buffer and MIME type by filename.
   */
  public async getImage(
    fileName: string
  ): Promise<{ buffer: Buffer; mimeType: string } | null> {
    const cleanName = path.basename(fileName);
    const filePath = path.join(this.uploadsDir, cleanName);

    // Check local cache first
    if (fs.existsSync(filePath)) {
      const buffer = await fs.promises.readFile(filePath);
      const validation = validateImageBuffer(buffer);
      const mimeType = validation.detectedMime || 'application/octet-stream';
      return { buffer, mimeType };
    }

    // If not in local cache and Supabase is configured, fetch from bucket
    if (this.supabase) {
      try {
        const { data, error } = await this.supabase.storage
          .from(this.bucketName)
          .download(cleanName);

        if (!error && data) {
          const arrayBuffer = await data.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const validation = validateImageBuffer(buffer);
          // Cache locally
          await fs.promises.writeFile(filePath, buffer).catch(() => {});
          return {
            buffer,
            mimeType: validation.detectedMime || data.type || 'image/jpeg',
          };
        }
      } catch {
        return null;
      }
    }

    return null;
  }

  /**
   * Safely deletes an uploaded file if requested.
   */
  public async deleteImage(fileName: string): Promise<boolean> {
    const cleanName = path.basename(fileName);
    const filePath = path.join(this.uploadsDir, cleanName);
    let deleted = false;

    // Remove from local disk
    if (fs.existsSync(filePath)) {
      try {
        await fs.promises.unlink(filePath);
        deleted = true;
      } catch (err) {
        console.error('Error deleting local image file:', err);
      }
    }

    // Remove from Supabase Storage
    if (this.supabase) {
      try {
        const { error } = await this.supabase.storage
          .from(this.bucketName)
          .remove([cleanName]);
        if (!error) deleted = true;
      } catch (err) {
        console.error('Error deleting remote image file from Supabase:', err);
      }
    }

    return deleted;
  }

  /**
   * Helper to check if a file exists locally or in Supabase bucket.
   */
  public fileExists(fileName: string): boolean {
    const cleanName = path.basename(fileName);
    return fs.existsSync(path.join(this.uploadsDir, cleanName));
  }
}

export const imageStorage = new ImageStorageService();
