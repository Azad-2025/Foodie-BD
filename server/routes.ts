import { Router, Response } from 'express';
import crypto from 'crypto';
import multer from 'multer';
import { createPasswordRecord, verifyPassword, DbUser } from './db';
import { dal } from './dal';
import {
  generateToken,
  authenticate,
  requireAuth,
  requireAdmin,
  AuthenticatedRequest,
} from './auth';
import { Food, FoodSubmission, UserFoodTracking, FoodReview, PlatformStats } from '../src/types';
import { imageStorage, validateImageBuffer } from './storage';
import { isValidFoodImageReference, normalizeFoodImageReference } from '../src/lib/imageUrlHelper';
import { testPostgresConnection } from './postgres';

export { isValidFoodImageReference, normalizeFoodImageReference };

export const apiRouter = Router();

apiRouter.use(authenticate);

// Multer memory storage configuration (5MB ceiling)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
});

// ==================== IMAGE STORAGE & UPLOAD SYSTEM ====================

// GET /api/images/:filename - Public streaming of uploaded food images
apiRouter.get('/images/:filename', async (req: AuthenticatedRequest, res: Response) => {
  const fileName = req.params.filename;
  if (!fileName || fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
    res.status(400).json({ error: 'Invalid file reference.' });
    return;
  }

  const result = await imageStorage.getImage(fileName);
  if (!result) {
    res.status(404).json({ error: 'Image file not found.' });
    return;
  }

  res.setHeader('Content-Type', result.mimeType);
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.send(result.buffer);
});

// POST /api/upload/image - Direct image file upload with binary validation and RBAC
apiRouter.post('/upload/image', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  upload.single('image')(req as any, res as any, async (err: any) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        res.status(400).json({
          error: 'File size exceeds the 5 MB limit. (ছবির আকার সর্বোচ্চ ৫ মেগাবাইট হতে পারবে।)',
        });
        return;
      }
      res.status(400).json({ error: err.message || 'File upload failed.' });
      return;
    }

    const file = (req as any).file;
    if (!file || !file.buffer) {
      res.status(400).json({
        error: 'No image file provided. Please choose a valid image file. (কোনো ইমেজ ফাইল পাওয়া যায়নি।)',
      });
      return;
    }

    const currentUser = req.user!;
    const { context, targetId } = req.body || {};

    // If context is 'food', only administrators can upload or replace catalog images
    if (context === 'food' && currentUser.role !== 'admin') {
      res.status(403).json({
        error: 'Only administrators can upload or replace images for catalog foods.',
      });
      return;
    }

    // If targetId is provided for a submission, enforce ownership
    if (targetId && context === 'submission') {
      const submission = await dal.getSubmissionById(targetId);
      if (submission) {
        if (currentUser.role !== 'admin' && submission.userId !== currentUser.userId) {
          res.status(403).json({
            error: 'You do not have permission to modify another user\'s submission image.',
          });
          return;
        }
        if (currentUser.role !== 'admin' && submission.status !== 'pending') {
          res.status(400).json({
            error: 'Cannot modify image for a submission that is already reviewed.',
          });
          return;
        }
      }
    }

    // Binary signature & magic byte check
    const validation = validateImageBuffer(file.buffer);
    if (!validation.isValid) {
      res.status(400).json({
        error: `${validation.errorEn} (${validation.errorBn})`,
      });
      return;
    }

    try {
      const prefix = context === 'avatar' ? 'avatar' : 'food';
      const meta = await imageStorage.saveImage(
        file.buffer,
        file.originalname || `${prefix}_upload.jpg`,
        currentUser.userId,
        prefix
      );

      const dbUser = await dal.getUserById(currentUser.userId);
      await dal.logAudit({
        action: 'IMAGE_UPLOADED',
        entityType: 'IMAGE',
        entityId: meta.fileName,
        userId: currentUser.userId,
        userName: dbUser?.name || currentUser.email || 'User',
        details: `Uploaded image ${meta.fileName} (${(meta.size / 1024).toFixed(1)} KB, ${meta.mimeType})`,
      });

      res.status(201).json({
        success: true,
        message: 'Image uploaded successfully.',
        imageUrl: meta.url,
        storagePath: meta.storagePath,
        fileName: meta.fileName,
        size: meta.size,
        mimeType: meta.mimeType,
        provider: imageStorage.getStorageProviderName(),
      });
    } catch (saveErr: any) {
      console.error('Failed to save image:', saveErr);
      res.status(500).json({ error: saveErr.message || 'Failed to save uploaded image.' });
    }
  });
});

// DELETE /api/upload/image/:filename - Safe cleanup of unused temporary uploads
apiRouter.delete('/upload/image/:filename', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const fileName = req.params.filename;
  if (!fileName || fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
    res.status(400).json({ error: 'Invalid file reference.' });
    return;
  }

  const fileTarget = `/api/images/${fileName}`;

  // Safety check: is it referenced by any catalog food?
  const allFoods = await dal.getFoods({ includeDrafts: true });
  const isUsedInFoods = allFoods.some((f) => f.imageUrl === fileTarget || f.imageUrl?.endsWith(fileName));
  if (isUsedInFoods && req.user?.role !== 'admin') {
    res.status(403).json({ error: 'Cannot delete image in use by catalog food.' });
    return;
  }

  // Is it referenced by another user's submission?
  const allSubmissions = await dal.getSubmissions();
  const usedInSub = allSubmissions.find((s) => s.imageUrl === fileTarget || s.imageUrl?.endsWith(fileName));
  if (usedInSub && req.user?.role !== 'admin' && usedInSub.userId !== req.user?.userId) {
    res.status(403).json({ error: 'Cannot delete image attached to another user\'s submission.' });
    return;
  }

  const deleted = await imageStorage.deleteImage(fileName);
  if (!deleted) {
    res.status(404).json({ error: 'Image file not found or already removed.' });
    return;
  }

  const dbUser = await dal.getUserById(req.user!.userId);
  await dal.logAudit({
    action: 'IMAGE_DELETED',
    entityType: 'IMAGE',
    entityId: fileName,
    userId: req.user!.userId,
    userName: dbUser?.name || req.user!.email || 'User',
    details: `Deleted image file ${fileName}`,
  });

  res.json({ success: true, message: 'Image deleted successfully.' });
});

// ==================== AUTHENTICATION ====================

// POST /api/auth/register
apiRouter.post('/auth/register', async (req: AuthenticatedRequest, res: Response) => {
  const { name, email, password, homeDistrictId } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    res.status(400).json({ error: 'Valid name is required (minimum 2 characters).' });
    return;
  }

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    res.status(400).json({ error: 'Valid email address is required.' });
    return;
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();

  const existing = await dal.getUserByEmail(normalizedEmail);
  if (existing) {
    res.status(409).json({ error: 'An account with this email address already exists.' });
    return;
  }

  // Security: Public registration must never grant Admin role
  const { hash, salt } = createPasswordRecord(password);
  const newUser: DbUser = {
    id: 'user_' + crypto.randomUUID().slice(0, 8),
    name: name.trim(),
    email: normalizedEmail,
    role: 'user', // Always user, never admin
    passwordHash: hash,
    salt,
    avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name.trim())}`,
    homeDistrictId: homeDistrictId || 'dhaka',
    createdAt: new Date().toISOString(),
  };

  const createdUser = await dal.createUser(newUser);

  await dal.logAudit({
    action: 'USER_REGISTERED',
    entityType: 'USER',
    entityId: createdUser.id,
    userId: createdUser.id,
    userName: createdUser.name,
    details: `User registered with email ${createdUser.email}`,
  });

  const token = generateToken(createdUser);
  const { passwordHash, salt: s, ...profile } = createdUser;
  res.status(201).json({ token, user: profile });
});

// POST /api/auth/login
apiRouter.post('/auth/login', async (req: AuthenticatedRequest, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required.' });
    return;
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const user = await dal.getUserByEmail(normalizedEmail);

  if (!user || !verifyPassword(password, user.passwordHash, user.salt)) {
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  const token = generateToken(user);
  const { passwordHash, salt, ...profile } = user;
  res.json({ token, user: profile });
});

// GET /api/auth/me
apiRouter.get('/auth/me', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const user = await dal.getUserById(req.user!.userId);
  if (!user) {
    res.status(404).json({ error: 'User profile not found.' });
    return;
  }

  const { passwordHash, salt, ...profile } = user;
  res.json({ user: profile });
});

// PATCH /api/auth/profile
apiRouter.patch('/auth/profile', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { name, avatarUrl, homeDistrictId, bio } = req.body;

  try {
    const updated = await dal.updateUserProfile(req.user!.userId, {
      name: typeof name === 'string' ? name.trim() : undefined,
      avatarUrl: typeof avatarUrl === 'string' ? avatarUrl : undefined,
      homeDistrictId: typeof homeDistrictId === 'string' ? homeDistrictId : undefined,
      bio: typeof bio === 'string' ? bio.trim() : undefined,
    });
    res.json({ user: updated });
  } catch (err: any) {
    res.status(404).json({ error: err.message || 'User not found.' });
  }
});

// ==================== PASSWORD MANAGEMENT & AUTHENTICATED CHANGE ====================

// Handler for authenticated password change
async function handleAuthenticatedPasswordChange(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({
      error: 'Authentication required. Self-service unauthenticated password reset is disabled for security.',
    });
    return;
  }

  const { currentPassword, newPassword } = req.body || {};

  if (!currentPassword || !newPassword) {
    res.status(400).json({
      error: 'Both current password and new password are required.',
    });
    return;
  }

  if (typeof newPassword !== 'string' || newPassword.length < 6) {
    res.status(400).json({
      error: 'New password must be at least 6 characters long.',
    });
    return;
  }

  const user = await dal.getUserById(req.user.userId);
  if (!user) {
    res.status(404).json({ error: 'User account not found.' });
    return;
  }

  // Security: Verify current password before allowing password update
  if (!verifyPassword(currentPassword, user.passwordHash, user.salt)) {
    res.status(401).json({ error: 'Incorrect current password.' });
    return;
  }

  // Update password for authenticated user only (strictly ignores any client-supplied email or userId)
  const { hash, salt } = createPasswordRecord(newPassword);
  await dal.updateUserPassword(user.id, hash, salt);

  // Audit log without recording passwords or sensitive credentials
  await dal.logAudit({
    action: 'PASSWORD_CHANGED',
    entityType: 'USER',
    entityId: user.id,
    userId: user.id,
    userName: user.name,
    details: 'User successfully changed their account password via authenticated verification.',
  });

  res.json({
    success: true,
    message: 'Your password has been updated successfully.',
  });
}

// POST /api/auth/change-password - Authenticated password change
apiRouter.post('/auth/change-password', requireAuth, (req, res) => {
  handleAuthenticatedPasswordChange(req, res).catch((err) => {
    res.status(500).json({ error: err.message || 'Internal server error.' });
  });
});

// POST /api/auth/reset-password - Rejects unauthenticated resets, accepts only authenticated password changes
apiRouter.post('/auth/reset-password', (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(403).json({
      error: 'Self-service unauthenticated password reset is disabled for security. Please log in to change your password or contact an administrator.',
    });
    return;
  }
  handleAuthenticatedPasswordChange(req, res).catch((err) => {
    res.status(500).json({ error: err.message || 'Internal server error.' });
  });
});

// ==================== DIVISIONS & DISTRICTS ====================

// GET /api/divisions
apiRouter.get('/divisions', async (_req: AuthenticatedRequest, res: Response) => {
  const divisions = await dal.getDivisions();
  res.json(divisions);
});

// GET /api/districts
apiRouter.get('/districts', async (_req: AuthenticatedRequest, res: Response) => {
  const districts = await dal.getDistricts();
  res.json(districts);
});

// GET /api/districts/:id
apiRouter.get('/districts/:id', async (req: AuthenticatedRequest, res: Response) => {
  const district = await dal.getDistrictById(req.params.id);
  if (!district) {
    res.status(404).json({ error: 'District not found.' });
    return;
  }

  const divisions = await dal.getDivisions();
  const division = divisions.find((d) => d.id === district.divisionId);
  const districtFoods = await dal.getFoods({ districtId: district.id });

  res.json({
    district,
    division,
    foods: districtFoods,
  });
});

// GET /api/categories
apiRouter.get('/categories', async (_req: AuthenticatedRequest, res: Response) => {
  const categories = await dal.getCategories();
  res.json(categories);
});

// ==================== FOODS ====================

// GET /api/foods
apiRouter.get('/foods', async (req: AuthenticatedRequest, res: Response) => {
  const { division, district, category, search, dietary } = req.query;

  const foods = await dal.getFoods({
    divisionId: division && division !== 'all' ? String(division) : undefined,
    districtId: district && district !== 'all' ? String(district) : undefined,
    category: category && category !== 'all' ? String(category) : undefined,
    dietary: dietary && dietary !== 'all' ? String(dietary) : undefined,
    search: search ? String(search) : undefined,
    includeDrafts: false,
  });

  res.json(foods);
});

// GET /api/foods/:id
apiRouter.get('/foods/:id', async (req: AuthenticatedRequest, res: Response) => {
  const food = await dal.getFoodById(req.params.id);
  if (!food || (!food.isPublished && req.user?.role !== 'admin')) {
    res.status(404).json({ error: 'Food delicacy not found.' });
    return;
  }

  const district = await dal.getDistrictById(food.districtId);
  const divisions = await dal.getDivisions();
  const division = divisions.find((d) => d.id === food.divisionId);
  const reviews = await dal.getReviews(food.id);

  res.json({
    food,
    district,
    division,
    reviews,
  });
});

// POST /api/foods (Admin only)
apiRouter.post('/foods', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const {
    nameEn,
    nameBn,
    shortDescription,
    detailedDescription,
    category,
    districtId,
    divisionId,
    imageUrl,
    originHistory,
    originSource,
    isPublished,
    ingredients,
    approximatePriceBdt,
    dietaryType,
  } = req.body;

  // Bengali food name is strictly required
  if (!nameBn || typeof nameBn !== 'string' || !nameBn.trim()) {
    res.status(400).json({ error: 'Bengali food name (বাংলা নাম) is required.' });
    return;
  }

  // English food name is required where appropriate
  if (!nameEn || typeof nameEn !== 'string' || !nameEn.trim()) {
    res.status(400).json({ error: 'English food name is required.' });
    return;
  }

  if (!districtId || typeof districtId !== 'string') {
    res.status(400).json({ error: 'District is required.' });
    return;
  }

  const district = await dal.getDistrictById(districtId.trim());
  if (!district) {
    res.status(400).json({ error: 'Invalid district ID.' });
    return;
  }

  // Division consistency validation
  const effectiveDivisionId = district.divisionId;
  if (divisionId && divisionId !== effectiveDivisionId) {
    res.status(400).json({
      error: `District "${district.nameEn}" belongs to division "${district.divisionId}", not "${divisionId}".`,
    });
    return;
  }

  // Image URL validation (must be valid http/https URL or application-managed image path if provided)
  const trimmedImageUrl = typeof imageUrl === 'string' ? imageUrl.trim() : '';
  let finalImageUrl = '';
  if (trimmedImageUrl) {
    if (!isValidFoodImageReference(trimmedImageUrl)) {
      res.status(400).json({ error: 'Invalid food image URL format.' });
      return;
    }
    finalImageUrl = normalizeFoodImageReference(trimmedImageUrl);
  }

  // Duplicate food check: prevent adding duplicate food with identical English name or Bengali name in the same district
  const cleanEn = nameEn.trim().toLowerCase();
  const cleanBn = nameBn.trim();
  const districtFoods = await dal.getFoods({ districtId: district.id, includeDrafts: true });
  const isDuplicate = districtFoods.some(
    (f) =>
      f.districtId === district.id &&
      (f.nameEn.toLowerCase() === cleanEn || f.nameBn.trim() === cleanBn)
  );

  if (isDuplicate) {
    res.status(409).json({
      error: `A food record named "${nameEn.trim()}" / "${nameBn.trim()}" already exists for district "${district.nameEn}".`,
    });
    return;
  }

  const validCategories = [
    'main_course',
    'traditional',
    'street_food',
    'snacks',
    'dessert',
    'drinks',
    'sweets_pitha',
  ];
  const effectiveCategory = validCategories.includes(category) ? category : 'traditional';

  const newFood: Food = {
    id: 'food_' + crypto.randomUUID().slice(0, 8),
    nameEn: nameEn.trim(),
    nameBn: nameBn.trim(),
    shortDescription: (shortDescription || `${nameEn.trim()} (${nameBn.trim()}) from ${district.nameEn}`).trim(),
    detailedDescription: (detailedDescription || shortDescription || `${nameEn.trim()} (${nameBn.trim()}) is a regional culinary specialty of ${district.nameEn}, Bangladesh.`).trim(),
    category: effectiveCategory as any,
    districtId: district.id,
    divisionId: effectiveDivisionId,
    imageUrl: finalImageUrl || '',
    originHistory: (originHistory || '').trim(),
    originSource: (originSource || '').trim(),
    isPublished: isPublished !== false,
    ingredients: Array.isArray(ingredients) ? ingredients : [],
    approximatePriceBdt: Number(approximatePriceBdt) || 0,
    dietaryType: ['non-veg', 'veg', 'sweet'].includes(dietaryType) ? dietaryType : 'non-veg',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const createdFood = await dal.createFood(newFood);

  await dal.logAudit({
    action: 'CREATE_FOOD',
    entityType: 'FOOD',
    entityId: createdFood.id,
    userId: req.user!.userId,
    userName: req.user!.email,
    details: `Added new food: ${createdFood.nameEn} (${createdFood.nameBn}) in ${district.nameEn} [${createdFood.isPublished ? 'Published' : 'Draft'}]`,
  });

  res.status(201).json(createdFood);
});

// PUT /api/foods/:id (Admin only)
apiRouter.put('/foods/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const existing = await dal.getFoodById(req.params.id);
  if (!existing) {
    res.status(404).json({ error: 'Food not found.' });
    return;
  }

  const {
    nameEn,
    nameBn,
    shortDescription,
    detailedDescription,
    category,
    districtId,
    divisionId,
    imageUrl,
    originHistory,
    originSource,
    isPublished,
    ingredients,
    approximatePriceBdt,
    dietaryType,
  } = req.body;

  // Validation
  if (nameBn !== undefined && (!nameBn || typeof nameBn !== 'string' || !nameBn.trim())) {
    res.status(400).json({ error: 'Bengali food name (বাংলা নাম) cannot be empty.' });
    return;
  }
  if (nameEn !== undefined && (!nameEn || typeof nameEn !== 'string' || !nameEn.trim())) {
    res.status(400).json({ error: 'English food name cannot be empty.' });
    return;
  }

  let effectiveDistrictId = existing.districtId;
  let effectiveDivisionId = existing.divisionId;

  if (districtId) {
    const district = await dal.getDistrictById(districtId.trim());
    if (!district) {
      res.status(400).json({ error: 'Invalid district ID.' });
      return;
    }
    effectiveDistrictId = district.id;
    effectiveDivisionId = district.divisionId;

    if (divisionId && divisionId !== district.divisionId) {
      res.status(400).json({
        error: `District "${district.nameEn}" belongs to division "${district.divisionId}".`,
      });
      return;
    }
  }

  // Validate image URL if provided
  let normalizedUpdatedImageUrl: string | undefined = undefined;
  if (imageUrl !== undefined && typeof imageUrl === 'string') {
    const trimmedImageUrl = imageUrl.trim();
    if (trimmedImageUrl) {
      if (!isValidFoodImageReference(trimmedImageUrl)) {
        res.status(400).json({ error: 'Invalid food image URL format.' });
        return;
      }
      normalizedUpdatedImageUrl = normalizeFoodImageReference(trimmedImageUrl);
    } else {
      normalizedUpdatedImageUrl = '';
    }
  }

  // Check duplicate conflict on rename/edit
  const finalEn = (nameEn ?? existing.nameEn).trim().toLowerCase();
  const finalBn = (nameBn ?? existing.nameBn).trim();
  const districtFoods = await dal.getFoods({ districtId: effectiveDistrictId, includeDrafts: true });
  const conflict = districtFoods.some(
    (f) =>
      f.id !== existing.id &&
      f.districtId === effectiveDistrictId &&
      (f.nameEn.toLowerCase() === finalEn || f.nameBn.trim() === finalBn)
  );
  if (conflict) {
    res.status(409).json({
      error: `Another food record named "${finalEn}" / "${finalBn}" already exists for this district.`,
    });
    return;
  }

  const updates: Partial<Food> = {
    ...(nameEn !== undefined ? { nameEn: nameEn.trim() } : {}),
    ...(nameBn !== undefined ? { nameBn: nameBn.trim() } : {}),
    ...(shortDescription !== undefined ? { shortDescription: shortDescription.trim() } : {}),
    ...(detailedDescription !== undefined ? { detailedDescription: detailedDescription.trim() } : {}),
    ...(category !== undefined ? { category } : {}),
    districtId: effectiveDistrictId,
    divisionId: effectiveDivisionId,
    ...(normalizedUpdatedImageUrl !== undefined ? { imageUrl: normalizedUpdatedImageUrl } : {}),
    ...(originHistory !== undefined ? { originHistory: originHistory.trim() } : {}),
    ...(originSource !== undefined ? { originSource: originSource.trim() } : {}),
    ...(isPublished !== undefined ? { isPublished: Boolean(isPublished) } : {}),
    ...(ingredients !== undefined ? { ingredients: Array.isArray(ingredients) ? ingredients : [] } : {}),
    ...(approximatePriceBdt !== undefined ? { approximatePriceBdt: Number(approximatePriceBdt) || 0 } : {}),
    ...(dietaryType !== undefined ? { dietaryType } : {}),
  };

  const updated = await dal.updateFood(existing.id, updates);

  await dal.logAudit({
    action: 'UPDATE_FOOD',
    entityType: 'FOOD',
    entityId: existing.id,
    userId: req.user!.userId,
    userName: req.user!.email,
    details: `Updated food: ${updated.nameEn} (${updated.nameBn}) [${updated.isPublished ? 'Published' : 'Draft'}]`,
  });

  res.json(updated);
});

// PATCH /api/foods/:id/publish (Admin only)
apiRouter.patch('/foods/:id/publish', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const existing = await dal.getFoodById(req.params.id);
  if (!existing) {
    res.status(404).json({ error: 'Food not found.' });
    return;
  }

  const { isPublished } = req.body;
  const food = await dal.togglePublishFood(req.params.id, Boolean(isPublished));

  await dal.logAudit({
    action: food.isPublished ? 'PUBLISH_FOOD' : 'UNPUBLISH_FOOD',
    entityType: 'FOOD',
    entityId: food.id,
    userId: req.user!.userId,
    userName: req.user!.email,
    details: `${food.isPublished ? 'Published' : 'Unpublished'} food: ${food.nameEn} (${food.nameBn})`,
  });

  res.json(food);
});

// DELETE /api/foods/:id (Admin only)
apiRouter.delete('/foods/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const food = await dal.getFoodById(req.params.id);
  if (!food) {
    res.status(404).json({ error: 'Food not found.' });
    return;
  }

  await dal.deleteFood(req.params.id);

  await dal.logAudit({
    action: 'DELETE_FOOD',
    entityType: 'FOOD',
    entityId: food.id,
    userId: req.user!.userId,
    userName: req.user!.email,
    details: `Deleted food: ${food.nameEn}`,
  });

  res.json({ success: true, message: 'Food item deleted successfully.' });
});

// ==================== COMMUNITY FOOD SUBMISSIONS & ADMIN APPROVAL ====================

// POST /api/submissions (or /api/food-submissions) - Submit food suggestion (Authenticated User)
const handleCreateSubmission = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const {
    nameEn,
    nameBn,
    shortDescription,
    detailedDescription,
    category,
    districtId,
    imageUrl,
    originHistory,
    originSource,
    approximatePriceBdt,
    dietaryType,
    ingredients,
    accurateInfoConfirmed,
    confirmDuplicateOverride,
  } = req.body;

  if (!nameBn || typeof nameBn !== 'string' || !nameBn.trim()) {
    res.status(400).json({ error: 'Bengali food name (বাংলা নাম) is required.' });
    return;
  }

  if (!nameEn || typeof nameEn !== 'string' || !nameEn.trim()) {
    res.status(400).json({ error: 'English food name is required.' });
    return;
  }

  if (!districtId || typeof districtId !== 'string') {
    res.status(400).json({ error: 'District is required.' });
    return;
  }

  const district = await dal.getDistrictById(districtId.trim());
  if (!district) {
    res.status(400).json({ error: 'Invalid district ID selected.' });
    return;
  }

  if (!shortDescription || typeof shortDescription !== 'string' || !shortDescription.trim()) {
    res.status(400).json({ error: 'Short description is required.' });
    return;
  }

  if (!accurateInfoConfirmed) {
    res.status(400).json({
      error: 'Please confirm that the submitted information is accurate to the best of your knowledge.',
    });
    return;
  }

  // Image URL validation if provided
  const trimmedImageUrl = typeof imageUrl === 'string' ? imageUrl.trim() : '';
  let finalSubmissionImageUrl = '';
  if (trimmedImageUrl) {
    if (!isValidFoodImageReference(trimmedImageUrl)) {
      res.status(400).json({ error: 'Invalid food image URL format.' });
      return;
    }
    finalSubmissionImageUrl = normalizeFoodImageReference(trimmedImageUrl);
  }

  // Duplicate food check: warn and allow review
  const cleanEn = nameEn.trim().toLowerCase();
  const cleanBn = nameBn.trim();
  const catalogFoods = await dal.getFoods({ districtId: district.id, includeDrafts: true });
  const existingCatalogMatch = catalogFoods.find(
    (f) =>
      f.districtId === district.id &&
      (f.nameEn.toLowerCase() === cleanEn || f.nameBn.trim() === cleanBn)
  );

  const pendingSubmissions = await dal.getSubmissions({ districtId: district.id, status: 'pending' });
  const existingPendingMatch = pendingSubmissions.find(
    (s) =>
      s.status === 'pending' &&
      s.districtId === district.id &&
      (s.nameEn.toLowerCase() === cleanEn || s.nameBn.trim() === cleanBn)
  );

  if ((existingCatalogMatch || existingPendingMatch) && !confirmDuplicateOverride) {
    res.status(409).json({
      error: `A food named "${nameEn.trim()}" / "${nameBn.trim()}" already exists or has a pending submission in ${district.nameEn}.`,
      isDuplicate: true,
      existingCatalogId: existingCatalogMatch ? existingCatalogMatch.id : undefined,
      existingCatalogFood: existingCatalogMatch,
      existingPendingId: existingPendingMatch ? existingPendingMatch.id : undefined,
    });
    return;
  }

  const validCategories = [
    'main_course',
    'traditional',
    'street_food',
    'snacks',
    'dessert',
    'drinks',
    'sweets_pitha',
  ];
  const effectiveCategory = validCategories.includes(category) ? category : 'traditional';

  // Submitter public name snapshot
  const submitterUser = await dal.getUserById(req.user!.userId);
  const submitterName = submitterUser?.name || req.user!.email.split('@')[0];

  const newSubmission: FoodSubmission = {
    id: 'sub_' + crypto.randomUUID().slice(0, 8),
    nameEn: nameEn.trim(),
    nameBn: nameBn.trim(),
    shortDescription: shortDescription.trim(),
    detailedDescription: (detailedDescription || shortDescription).trim(),
    category: effectiveCategory as any,
    districtId: district.id,
    divisionId: district.divisionId,
    imageUrl: finalSubmissionImageUrl || '',
    originHistory: (originHistory || '').trim(),
    originSource: (originSource || '').trim(),
    approximatePriceBdt: Number(approximatePriceBdt) || 0,
    dietaryType: ['non-veg', 'veg', 'sweet'].includes(dietaryType) ? dietaryType : 'non-veg',
    ingredients: Array.isArray(ingredients) ? ingredients : [],
    accurateInfoConfirmed: true,
    userId: req.user!.userId,
    submitterName,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'pending',
    editHistory: [],
  };

  const created = await dal.createSubmission(newSubmission);

  await dal.logAudit({
    action: 'FOOD_SUBMITTED',
    entityType: 'FOOD_SUBMISSION',
    entityId: created.id,
    userId: req.user!.userId,
    userName: submitterName,
    details: `User submitted food suggestion: ${created.nameEn} (${created.nameBn}) for district ${district.nameEn} [Status: Pending]`,
  });

  res.status(201).json({
    success: true,
    message: 'Your regional food suggestion has been submitted successfully for verification!',
    referenceId: created.id,
    submission: created,
  });
};

apiRouter.post('/submissions', requireAuth, (req, res) => {
  handleCreateSubmission(req, res).catch((err) => res.status(500).json({ error: err.message || 'Submission failed.' }));
});
apiRouter.post('/food-submissions', requireAuth, (req, res) => {
  handleCreateSubmission(req, res).catch((err) => res.status(500).json({ error: err.message || 'Submission failed.' }));
});

// GET /api/user/submissions - Get authenticated user's food contributions
apiRouter.get('/user/submissions', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userSubmissions = await dal.getSubmissions({ userId: req.user!.userId });
  res.json(userSubmissions);
});

// GET /api/user/submissions/:id - Get specific submission by ID (owner or admin)
apiRouter.get('/user/submissions/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const submission = await dal.getSubmissionById(req.params.id);
  if (!submission) {
    res.status(404).json({ error: 'Food submission not found.' });
    return;
  }

  // Security: only owner or admin can access
  if (submission.userId !== req.user!.userId && req.user!.role !== 'admin') {
    res.status(403).json({ error: 'Access denied. You can only view your own submissions.' });
    return;
  }

  res.json(submission);
});

// PUT /api/user/submissions/:id - Edit pending submission (owner only)
apiRouter.put('/user/submissions/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const submission = await dal.getSubmissionById(req.params.id);
  if (!submission) {
    res.status(404).json({ error: 'Food submission not found.' });
    return;
  }

  // Security: only owner can edit their submission
  if (submission.userId !== req.user!.userId && req.user!.role !== 'admin') {
    res.status(403).json({ error: 'Access denied. You can only edit your own submissions.' });
    return;
  }

  // An already approved or rejected submission cannot be edited
  if (submission.status !== 'pending') {
    res.status(400).json({
      error: `Cannot edit a submission that has already been ${submission.status}.`,
    });
    return;
  }

  const {
    nameEn,
    nameBn,
    shortDescription,
    detailedDescription,
    category,
    districtId,
    imageUrl,
    originHistory,
    originSource,
    approximatePriceBdt,
    dietaryType,
    ingredients,
  } = req.body;

  if (nameBn !== undefined && (!nameBn || !nameBn.trim())) {
    res.status(400).json({ error: 'Bengali food name cannot be empty.' });
    return;
  }
  if (nameEn !== undefined && (!nameEn || !nameEn.trim())) {
    res.status(400).json({ error: 'English food name cannot be empty.' });
    return;
  }

  let finalDistrictId = submission.districtId;
  let finalDivisionId = submission.divisionId;
  if (districtId) {
    const district = await dal.getDistrictById(districtId.trim());
    if (!district) {
      res.status(400).json({ error: 'Invalid district ID.' });
      return;
    }
    finalDistrictId = district.id;
    finalDivisionId = district.divisionId;
  }

  let normalizedSubImageUrl: string | undefined = undefined;
  if (imageUrl !== undefined) {
    const trimmedImageUrl = typeof imageUrl === 'string' ? imageUrl.trim() : '';
    if (trimmedImageUrl) {
      if (!isValidFoodImageReference(trimmedImageUrl)) {
        res.status(400).json({ error: 'Invalid food image URL format.' });
        return;
      }
      normalizedSubImageUrl = normalizeFoodImageReference(trimmedImageUrl);
    } else {
      normalizedSubImageUrl = '';
    }
  }

  const editHistory = submission.editHistory || [];
  editHistory.push({
    editedAt: new Date().toISOString(),
    summary: req.user!.role === 'admin' ? 'Administrator updated details' : 'User updated submission details',
  });

  const updates: Partial<FoodSubmission> = {
    districtId: finalDistrictId,
    divisionId: finalDivisionId,
    ...(nameEn !== undefined ? { nameEn: nameEn.trim() } : {}),
    ...(nameBn !== undefined ? { nameBn: nameBn.trim() } : {}),
    ...(shortDescription !== undefined ? { shortDescription: shortDescription.trim() } : {}),
    ...(detailedDescription !== undefined ? { detailedDescription: detailedDescription.trim() } : {}),
    ...(category !== undefined ? { category } : {}),
    ...(normalizedSubImageUrl !== undefined ? { imageUrl: normalizedSubImageUrl } : {}),
    ...(originHistory !== undefined ? { originHistory: originHistory.trim() } : {}),
    ...(originSource !== undefined ? { originSource: originSource.trim() } : {}),
    ...(approximatePriceBdt !== undefined ? { approximatePriceBdt: Number(approximatePriceBdt) || 0 } : {}),
    ...(dietaryType !== undefined ? { dietaryType } : {}),
    ...(Array.isArray(ingredients) ? { ingredients } : {}),
    editHistory,
  };

  const updated = await dal.updateSubmission(submission.id, updates);

  await dal.logAudit({
    action: 'FOOD_SUBMISSION_EDITED',
    entityType: 'FOOD_SUBMISSION',
    entityId: updated.id,
    userId: req.user!.userId,
    userName: req.user!.email,
    details: `Updated food submission: ${updated.nameEn} (${updated.nameBn})`,
  });

  res.json(updated);
});

// GET /api/admin/submissions - Admin list all food requests with filtering and duplicate analysis
apiRouter.get('/admin/submissions', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { status, search, district, division } = req.query;

  let list = await dal.getSubmissions({
    status: status && status !== 'all' ? String(status) : undefined,
    districtId: district && district !== 'all' ? String(district) : undefined,
  });

  if (division && typeof division === 'string' && division !== 'all') {
    list = list.filter((s) => s.divisionId === division);
  }

  if (search && typeof search === 'string') {
    const term = search.toLowerCase().trim();
    list = list.filter(
      (s) =>
        s.nameEn.toLowerCase().includes(term) ||
        s.nameBn.toLowerCase().includes(term) ||
        s.submitterName.toLowerCase().includes(term) ||
        s.id.toLowerCase().includes(term)
    );
  }

  // Attach potential catalog duplicate info to aid the reviewing admin
  const allFoods = await dal.getFoods({ includeDrafts: true });
  const enriched = list.map((sub) => {
    const cleanEn = sub.nameEn.toLowerCase().trim();
    const cleanBn = sub.nameBn.trim();
    const potentialCatalogMatch = allFoods.find(
      (f) =>
        f.districtId === sub.districtId &&
        (f.nameEn.toLowerCase() === cleanEn || f.nameBn.trim() === cleanBn)
    );
    return {
      ...sub,
      potentialDuplicate: potentialCatalogMatch
        ? {
            id: potentialCatalogMatch.id,
            nameEn: potentialCatalogMatch.nameEn,
            nameBn: potentialCatalogMatch.nameBn,
            districtId: potentialCatalogMatch.districtId,
          }
        : null,
    };
  });

  res.json(enriched);
});

// PUT /api/admin/submissions/:id/review - Review submission (Approve or Reject)
apiRouter.put('/admin/submissions/:id/review', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const sub = await dal.getSubmissionById(req.params.id);
  if (!sub) {
    res.status(404).json({ error: 'Food submission not found.' });
    return;
  }

  const { action, adminFeedback, correctedData, overrideReviewed } = req.body;

  if (!action || !['approve', 'reject'].includes(action)) {
    res.status(400).json({ error: 'Valid review action ("approve" or "reject") is required.' });
    return;
  }

  // Prevent duplicate review without explicit override
  if (sub.status !== 'pending' && !overrideReviewed) {
    // If it's already approved, return the approved record idempotently
    if (sub.status === 'approved' && sub.approvedFoodId) {
      const existingApprovedFood = await dal.getFoodById(sub.approvedFoodId);
      res.json({
        success: true,
        message: 'Submission was already approved.',
        submission: sub,
        food: existingApprovedFood,
      });
      return;
    }

    res.status(400).json({
      error: `This submission has already been reviewed (${sub.status}) on ${sub.reviewedAt || 'earlier date'}.`,
    });
    return;
  }

  const adminUser = await dal.getUserById(req.user!.userId);
  const adminDisplayName = adminUser?.name || 'Foodie BD Admin';

  if (action === 'approve') {
    // Admin can correct fields during review
    const finalEn = (correctedData?.nameEn || sub.nameEn || '').trim();
    const finalBn = (correctedData?.nameBn || sub.nameBn || '').trim();
    const finalDistrictId = (correctedData?.districtId || sub.districtId || '').trim();
    const district = await dal.getDistrictById(finalDistrictId);

    if (!finalBn) {
      res.status(400).json({ error: 'Bengali food name cannot be empty for approval.' });
      return;
    }
    if (!finalEn) {
      res.status(400).json({ error: 'English food name cannot be empty for approval.' });
      return;
    }
    if (!district) {
      res.status(400).json({ error: 'Valid district is required for approval.' });
      return;
    }

    let catalogFood: Food | null = null;
    if (sub.approvedFoodId) {
      catalogFood = await dal.getFoodById(sub.approvedFoodId);
    }

    if (!catalogFood) {
      const newFoodId = 'food_' + crypto.randomUUID().slice(0, 8);
      const newFoodItem: Food = {
        id: newFoodId,
        nameEn: finalEn,
        nameBn: finalBn,
        shortDescription: (correctedData?.shortDescription || sub.shortDescription || `${finalEn} (${finalBn}) from ${district.nameEn}`).trim(),
        detailedDescription: (correctedData?.detailedDescription || sub.detailedDescription || sub.shortDescription || `${finalEn} is a traditional regional delicacy from ${district.nameEn}.`).trim(),
        category: (correctedData?.category || sub.category || 'traditional') as any,
        districtId: district.id,
        divisionId: district.divisionId,
        imageUrl: (correctedData?.imageUrl !== undefined ? correctedData.imageUrl : sub.imageUrl).trim(),
        originHistory: (correctedData?.originHistory || sub.originHistory || '').trim(),
        originSource: (correctedData?.originSource || sub.originSource || '').trim(),
        isPublished: true, // Approved food is immediately published in public catalog
        ingredients: Array.isArray(correctedData?.ingredients) ? correctedData.ingredients : sub.ingredients || [],
        approximatePriceBdt: Number(correctedData?.approximatePriceBdt !== undefined ? correctedData.approximatePriceBdt : sub.approximatePriceBdt) || 0,
        dietaryType: correctedData?.dietaryType || sub.dietaryType || 'non-veg',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),

        // Attribution & Community Verification
        submissionId: sub.id,
        submittedByUserId: sub.userId,
        submittedByUserName: sub.submitterName,
        approvedByUserId: req.user!.userId,
        approvedByUserName: adminDisplayName,
        approvedAt: new Date().toISOString(),
        verificationStatus: 'verified',
      };

      catalogFood = await dal.createFood(newFoodItem);
    } else {
      // Update existing catalog food with any corrected data
      catalogFood = await dal.updateFood(catalogFood.id, {
        nameEn: finalEn,
        nameBn: finalBn,
        districtId: district.id,
        divisionId: district.divisionId,
        isPublished: true,
      });
    }

    const reviewedSub = await dal.reviewSubmission(sub.id, {
      status: 'approved',
      reviewedByUserId: req.user!.userId,
      reviewedByUserName: adminDisplayName,
      adminFeedback: (adminFeedback || 'Approved and published to the Foodie BD regional culinary catalog.').trim(),
      approvedFoodId: catalogFood.id,
    });

    await dal.logAudit({
      action: 'FOOD_SUBMISSION_APPROVED',
      entityType: 'FOOD_SUBMISSION',
      entityId: sub.id,
      userId: req.user!.userId,
      userName: adminDisplayName,
      details: `Approved food suggestion "${catalogFood.nameEn}" (${catalogFood.nameBn}) by ${sub.submitterName}. Created catalog food ID: ${catalogFood.id}`,
    });

    res.json({
      success: true,
      message: `Food submission "${sub.nameEn}" successfully approved and published!`,
      submission: reviewedSub,
      food: catalogFood,
    });
    return;
  }

  if (action === 'reject') {
    if (!adminFeedback || !adminFeedback.trim()) {
      res.status(400).json({ error: 'Rejection feedback / reason is required for the user.' });
      return;
    }

    const reviewedSub = await dal.reviewSubmission(sub.id, {
      status: 'rejected',
      reviewedByUserId: req.user!.userId,
      reviewedByUserName: adminDisplayName,
      adminFeedback: adminFeedback.trim(),
    });

    await dal.logAudit({
      action: 'FOOD_SUBMISSION_REJECTED',
      entityType: 'FOOD_SUBMISSION',
      entityId: sub.id,
      userId: req.user!.userId,
      userName: adminDisplayName,
      details: `Rejected food suggestion "${sub.nameEn}" (${sub.nameBn}) by ${sub.submitterName}. Reason: ${adminFeedback.trim()}`,
    });

    res.json({
      success: true,
      message: `Food submission "${sub.nameEn}" was rejected.`,
      submission: reviewedSub,
    });
    return;
  }
});

// ==================== USER JOURNEY & TRACKING ====================

// GET /api/user/journey
apiRouter.get('/user/journey', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const userTrackings = await dal.getUserFoods(userId);

  const allFoods = await dal.getFoods({ includeDrafts: true });
  const allDistricts = await dal.getDistricts();
  const allDivisions = await dal.getDivisions();

  // Join with food details
  const joined = userTrackings.map((t) => {
    const food = allFoods.find((f) => f.id === t.foodId);
    const district = food ? allDistricts.find((d) => d.id === food.districtId) : undefined;
    const division = food ? allDivisions.find((d) => d.id === food.divisionId) : undefined;
    return {
      ...t,
      food,
      district,
      division,
    };
  });

  res.json(joined);
});

// POST /api/user/journey (Track food: tried or want_to_try)
apiRouter.post('/user/journey', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const { foodId, status, triedAt, rating, notes, photoUrl } = req.body;

  if (!foodId || !status || !['tried', 'want_to_try'].includes(status)) {
    res.status(400).json({ error: 'Valid foodId and status ("tried" or "want_to_try") are required.' });
    return;
  }

  const food = await dal.getFoodById(foodId);
  if (!food) {
    res.status(404).json({ error: 'Food record not found.' });
    return;
  }

  const tracking: UserFoodTracking = {
    id: 'uf_' + crypto.randomUUID().slice(0, 8),
    userId,
    foodId,
    status,
    triedAt: status === 'tried' ? (triedAt || new Date().toISOString()) : undefined,
    rating: rating ? Number(rating) : undefined,
    notes: notes ? String(notes) : undefined,
    photoUrl: photoUrl ? String(photoUrl) : undefined,
    updatedAt: new Date().toISOString(),
  };

  const saved = await dal.upsertUserFood(tracking);
  res.json(saved);
});

// DELETE /api/user/journey/:foodId
apiRouter.delete('/user/journey/:foodId', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const { foodId } = req.params;

  await dal.deleteUserFood(userId, foodId);
  res.json({ success: true, message: 'Removed from journey.' });
});

// GET /api/user/achievements
apiRouter.get('/user/achievements', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const userTrackings = await dal.getUserFoods(userId);
  const triedTrackings = userTrackings.filter((uf) => uf.status === 'tried');

  const allFoods = await dal.getFoods({ includeDrafts: true });
  const triedFoods = triedTrackings
    .map((t) => allFoods.find((f) => f.id === t.foodId))
    .filter((f): f is Food => !!f);

  const totalTried = triedFoods.length;
  const uniqueDistricts = new Set(triedFoods.map((f) => f.districtId)).size;
  const uniqueDivisions = new Set(triedFoods.map((f) => f.divisionId)).size;
  const sweetsCount = triedFoods.filter((f) => f.category === 'sweets_pitha' || f.category === 'dessert').length;
  const dhakaCount = triedFoods.filter((f) => f.divisionId === 'dhaka').length;
  const spicyCount = triedFoods.filter((f) =>
    ['food_ctg_kala_bhuna', 'food_khulna_chui_jhal', 'food_coxsbazar_shutki', 'food_rangpur_shidol'].includes(f.id)
  ).length;

  const achievements = await dal.getAchievements();
  const evaluated = achievements.map((ach) => {
    let currentVal = 0;
    if (ach.id === 'first_bite') currentVal = totalTried;
    else if (ach.id === 'sweet_tooth') currentVal = sweetsCount;
    else if (ach.id === 'dhaka_foodie') currentVal = dhakaCount;
    else if (ach.id === 'spice_chaser') currentVal = spicyCount;
    else if (ach.id === 'five_districts') currentVal = uniqueDistricts;
    else if (ach.id === 'ten_districts') currentVal = uniqueDistricts;
    else if (ach.id === 'division_master') currentVal = uniqueDivisions;

    const isUnlocked = currentVal >= ach.threshold;
    return {
      ...ach,
      progress: Math.min(100, Math.round((currentVal / ach.threshold) * 100)),
      isUnlocked,
    };
  });

  res.json(evaluated);
});

// ==================== REVIEWS ====================

// GET /api/reviews?foodId=...
apiRouter.get('/reviews', async (req: AuthenticatedRequest, res: Response) => {
  const { foodId } = req.query;
  const reviews = await dal.getReviews(foodId ? String(foodId) : undefined);
  res.json(reviews);
});

// POST /api/reviews
apiRouter.post('/reviews', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const { foodId, rating, comment } = req.body;

  if (!foodId || !rating || !comment || comment.trim().length < 3) {
    res.status(400).json({ error: 'Valid foodId, rating (1-5), and comment are required.' });
    return;
  }

  const user = await dal.getUserById(userId);
  const food = await dal.getFoodById(foodId);

  if (!user || !food) {
    res.status(404).json({ error: 'User or food item not found.' });
    return;
  }

  const review: FoodReview = {
    id: 'rev_' + crypto.randomUUID().slice(0, 8),
    userId,
    userName: user.name,
    userAvatar: user.avatarUrl,
    foodId,
    rating: Math.min(5, Math.max(1, Number(rating))),
    comment: comment.trim(),
    createdAt: new Date().toISOString(),
  };

  const created = await dal.createReview(review);
  res.status(201).json(created);
});

// DELETE /api/reviews/:id (Admin only)
apiRouter.delete('/reviews/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  await dal.deleteReview(req.params.id);

  await dal.logAudit({
    action: 'DELETE_REVIEW',
    entityType: 'REVIEW',
    entityId: req.params.id,
    userId: req.user!.userId,
    userName: req.user!.email,
    details: `Moderated and removed review ID: ${req.params.id}`,
  });

  res.json({ success: true, message: 'Review removed by moderator.' });
});

// ==================== REPORTS & MODERATION ====================

// POST /api/reports - Authenticated report submission
apiRouter.post('/reports', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { foodId, reason } = req.body;
  if (!reason || typeof reason !== 'string' || reason.trim().length < 5) {
    res.status(400).json({ error: 'Please provide a descriptive reason for reporting (minimum 5 characters).' });
    return;
  }

  const report = await dal.createReport({
    id: 'rep_' + crypto.randomUUID().slice(0, 8),
    reporterUserId: req.user!.userId,
    foodId: foodId ? String(foodId) : undefined,
    reason: reason.trim(),
    status: 'pending',
    createdAt: new Date().toISOString(),
  });

  res.status(201).json({ success: true, message: 'Report submitted successfully.', report });
});

// GET /api/admin/reports - Admin review of reports
apiRouter.get('/admin/reports', requireAdmin, async (_req: AuthenticatedRequest, res: Response) => {
  const reports = await dal.getReports();
  res.json(reports);
});

// PATCH /api/admin/reports/:id - Admin moderation of report status
apiRouter.patch('/admin/reports/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { status } = req.body;
  if (!status || !['reviewed', 'dismissed'].includes(status)) {
    res.status(400).json({ error: 'Valid status ("reviewed" or "dismissed") is required.' });
    return;
  }

  try {
    const updated = await dal.updateReportStatus(req.params.id, status);
    res.json(updated);
  } catch (err: any) {
    res.status(404).json({ error: err.message || 'Report not found.' });
  }
});

// ==================== PLATFORM STATS ====================

// GET /api/stats
apiRouter.get('/stats', async (_req: AuthenticatedRequest, res: Response) => {
  const stats = await dal.getPlatformStats();
  res.json(stats);
});

// ==================== ADMIN DASHBOARD ====================

// GET /api/admin/foods (Admin only: view all foods including unpublished drafts)
apiRouter.get('/admin/foods', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { division, district, category, search, status } = req.query;

  const foods = await dal.getFoods({
    divisionId: division && division !== 'all' ? String(division) : undefined,
    districtId: district && district !== 'all' ? String(district) : undefined,
    category: category && category !== 'all' ? String(category) : undefined,
    search: search ? String(search) : undefined,
    includeDrafts: status !== 'published',
  });

  let filtered = foods;
  if (status === 'published') {
    filtered = foods.filter((f) => f.isPublished);
  } else if (status === 'draft') {
    filtered = foods.filter((f) => !f.isPublished);
  }

  res.json(filtered);
});

// GET /api/admin/overview
apiRouter.get('/admin/overview', requireAdmin, async (_req: AuthenticatedRequest, res: Response) => {
  const overview = await dal.getAdminOverview();
  const recentAudits = await dal.getAuditLogs(15);

  res.json({
    ...overview,
    recentAudits,
  });
});

// GET /api/admin/users
apiRouter.get('/admin/users', requireAdmin, async (_req: AuthenticatedRequest, res: Response) => {
  const users = await dal.getAllUsers();
  res.json(users);
});

// GET /api/admin/audit-logs
apiRouter.get('/admin/audit-logs', requireAdmin, async (_req: AuthenticatedRequest, res: Response) => {
  const logs = await dal.getAuditLogs(50);
  res.json(logs);
});

// GET /api/admin/infra-status - Safe, read-only connectivity and status ping (Admin only)
apiRouter.get('/admin/infra-status', requireAdmin, async (_req: AuthenticatedRequest, res: Response) => {
  const dbStatus = await testPostgresConnection();
  const storageStatus = await imageStorage.testStorageConnection();

  res.json({
    database: {
      isConnected: dbStatus.isConnected,
      provider: dbStatus.provider,
      database: dbStatus.database,
      error: dbStatus.error,
    },
    storage: {
      isAvailable: storageStatus.isAvailable,
      provider: storageStatus.provider,
      bucket: storageStatus.bucket,
      error: storageStatus.error,
    },
    activeDatabase: dbStatus.isConnected ? 'postgresql' : dal.activeProvider,
  });
});

// ==================== RESEARCH-BASED CONTENT AUDIT & CATALOG ENDPOINTS ====================

// GET /api/admin/research/district/:districtId
apiRouter.get('/admin/research/district/:districtId', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { districtId } = req.params;
  const { VERIFIED_DISTRICT_RESEARCH } = await import('./data/verifiedDistrictResearch');
  const entry = VERIFIED_DISTRICT_RESEARCH[districtId];
  if (!entry) {
    res.status(404).json({ error: `No research dossier found for district "${districtId}".` });
    return;
  }
  res.json(entry);
});

// GET /api/admin/research/dossiers
apiRouter.get('/admin/research/dossiers', requireAdmin, async (_req: AuthenticatedRequest, res: Response) => {
  const { VERIFIED_DISTRICT_RESEARCH } = await import('./data/verifiedDistrictResearch');
  const allFoods = await dal.getFoods({ includeDrafts: true });
  const allDistricts = await dal.getDistricts();

  const districtFoodMap: Record<string, any[]> = {};
  allFoods.forEach((f) => {
    if (!districtFoodMap[f.districtId]) districtFoodMap[f.districtId] = [];
    districtFoodMap[f.districtId].push(f);
  });

  const dossiers = Object.values(VERIFIED_DISTRICT_RESEARCH).map((r) => {
    const existing = districtFoodMap[r.districtId] || [];
    return {
      ...r,
      hasCatalogFood: existing.length > 0,
      existingCatalogFoodsCount: existing.length,
    };
  });

  const totalDistricts = allDistricts.length;
  const representedDistricts = Object.keys(districtFoodMap).length;
  const unrepresentedDistricts = totalDistricts - representedDistricts;

  res.json({
    totalDistricts,
    representedDistricts,
    unrepresentedDistricts,
    dossiersCount: dossiers.length,
    dossiers,
  });
});

// POST /api/admin/research/publish-dossier
apiRouter.post('/admin/research/publish-dossier', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { districtId, customImageUrl, customPrice } = req.body;
  if (!districtId) {
    res.status(400).json({ error: 'districtId is required.' });
    return;
  }

  if (customImageUrl) {
    if (!isValidFoodImageReference(customImageUrl)) {
      res.status(400).json({ error: 'Invalid food image URL format.' });
      return;
    }
  }

  const { VERIFIED_DISTRICT_RESEARCH } = await import('./data/verifiedDistrictResearch');
  const dossier = VERIFIED_DISTRICT_RESEARCH[districtId];
  if (!dossier) {
    res.status(404).json({ error: `No verified research entry found for district "${districtId}".` });
    return;
  }

  const district = await dal.getDistrictById(districtId);
  if (!district) {
    res.status(404).json({ error: `District "${districtId}" not found in database.` });
    return;
  }

  const safeId = `food_${districtId}_${Date.now().toString(36)}`;
  const currentUser = req.user!;
  const user = await dal.getUserById(currentUser.userId);

  const newFood: Food = {
    id: safeId,
    nameEn: dossier.foodNameEn,
    nameBn: dossier.foodNameBn,
    shortDescription: dossier.shortDescriptionBn,
    detailedDescription: dossier.detailedDescriptionBn,
    category: dossier.category as any,
    districtId: dossier.districtId,
    divisionId: dossier.divisionId,
    imageUrl: customImageUrl ? normalizeFoodImageReference(customImageUrl) : '/placeholder-food.jpg',
    originHistory: dossier.historicalContextBn,
    originSource: dossier.primarySource,
    isPublished: true,
    ingredients: dossier.ingredients,
    approximatePriceBdt: customPrice !== undefined ? Number(customPrice) : dossier.approximatePriceBdt,
    dietaryType: dossier.dietaryType as any,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    verificationStatus: 'research_verified',
    researchStatus: dossier.researchStatus,
    citationSources: dossier.citationSources,
    imageCaption: dossier.imageSuggestionPrompt,
    imageAttribution: dossier.imageAttribution,
    imageVerified: Boolean(customImageUrl),
    approvedByUserId: currentUser.userId,
    approvedByUserName: user?.name || 'Administrator',
    approvedAt: new Date().toISOString(),
  };

  const createdFood = await dal.createFood(newFood);

  await dal.logAudit({
    action: 'PUBLISH_RESEARCHED_FOOD',
    entityType: 'FOOD',
    entityId: createdFood.id,
    userId: currentUser.userId,
    userName: user?.name || 'Admin',
    details: `Published verified food research "${createdFood.nameEn}" (${createdFood.nameBn}) for district ${district.nameEn}. Source: ${dossier.primarySource}.`,
  });

  res.status(201).json({
    success: true,
    message: `Successfully published verified food record for ${district.nameEn}.`,
    food: createdFood,
  });
});

// ==================== SECURE INITIAL ADMIN BOOTSTRAP ====================
// POST /api/setup/promote-admin
apiRouter.post('/setup/promote-admin', async (req: AuthenticatedRequest, res: Response) => {
  const configuredKey = process.env.ADMIN_SETUP_KEY;

  // 1. Never allow absent or weak ADMIN_SETUP_KEY
  if (!configuredKey || typeof configuredKey !== 'string' || configuredKey.trim().length < 16) {
    res.status(503).json({
      error: 'Administrator setup endpoint is permanently disabled. Configure a secure ADMIN_SETUP_KEY (minimum 16 characters) in server environment.',
    });
    return;
  }

  // 2. Prevent setup endpoint abuse once initial admin bootstrap has already occurred
  const hasExistingAdmin = await dal.hasAdmin();
  const { email } = req.body || {};
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

  if (hasExistingAdmin) {
    const existingUser = await dal.getUserByEmail(normalizedEmail);
    if (!existingUser || existingUser.role !== 'admin') {
      res.status(403).json({
        error: 'Forbidden: Initial administrator bootstrap has already been completed. Role modifications must be performed by an authenticated administrator via the Admin Dashboard.',
      });
      return;
    }
  }

  // 3. Constant-time / timing-safe verification of the setup key
  const setupKey = req.headers['x-admin-setup-key'] || req.body?.setupKey;
  if (!setupKey || typeof setupKey !== 'string') {
    res.status(403).json({
      error: 'Forbidden: Missing administrator setup authorization key.',
    });
    return;
  }

  const setupKeyBuf = Buffer.from(setupKey.trim());
  const configuredKeyBuf = Buffer.from(configuredKey.trim());

  if (
    setupKeyBuf.length !== configuredKeyBuf.length ||
    !crypto.timingSafeEqual(setupKeyBuf, configuredKeyBuf)
  ) {
    res.status(403).json({
      error: 'Forbidden: Invalid administrator setup authorization key.',
    });
    return;
  }

  // 4. Validate email
  if (!normalizedEmail || !normalizedEmail.includes('@')) {
    res.status(400).json({ error: 'Valid email address is required.' });
    return;
  }

  const user = await dal.getUserByEmail(normalizedEmail);
  if (!user) {
    res.status(404).json({
      error: `Account with email "${normalizedEmail}" was not found. Please register the account first in the app.`,
    });
    return;
  }

  // Idempotent: If user is already an admin, return success without altering anything
  if (user.role === 'admin') {
    const { passwordHash, salt, ...profile } = user;
    res.json({
      success: true,
      message: `Account "${user.email}" is already an authorized Administrator.`,
      user: profile,
    });
    return;
  }

  // Promotion is only permitted if bootstrap was not completed
  const previousRole = user.role;
  const updatedProfile = await dal.updateUserRole(user.id, 'admin');

  await dal.logAudit({
    action: 'PROMOTE_TO_ADMIN',
    entityType: 'USER',
    entityId: user.id,
    userId: user.id,
    userName: user.name,
    details: `Account ${user.email} was promoted to administrator role via initial bootstrap setup. Previous role was ${previousRole}.`,
  });

  res.json({
    success: true,
    message: `Account "${user.email}" has been successfully promoted to the Admin role.`,
    user: updatedProfile,
  });
});
