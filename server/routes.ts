import { Router, Response } from 'express';
import crypto from 'crypto';
import multer from 'multer';
import { db, createPasswordRecord, verifyPassword, DbUser } from './db';
import {
  generateToken,
  authenticate,
  requireAuth,
  requireAdmin,
  AuthenticatedRequest,
} from './auth';
import { Food, FoodSubmission, UserFoodTracking, FoodReview, UserProfile, PlatformStats } from '../src/types';
import { imageStorage, validateImageBuffer } from './storage';
import { isValidFoodImageReference } from '../src/lib/imageUrlHelper';
import { testPostgresConnection } from './postgres';

export { isValidFoodImageReference };

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
    const schema = db.getSchema();

    // If context is 'food', only administrators can upload or replace catalog images
    if (context === 'food' && currentUser.role !== 'admin') {
      res.status(403).json({
        error: 'Only administrators can upload or replace images for catalog foods.',
      });
      return;
    }

    // If targetId is provided for a submission, enforce ownership
    if (targetId && context === 'submission') {
      const submission = schema.foodSubmissions?.find((s) => s.id === targetId);
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
      const meta = await imageStorage.saveImage(
        file.buffer,
        file.originalname || 'food_upload.jpg',
        currentUser.userId
      );

      const dbUser = schema.users.find((u) => u.id === currentUser.userId);
      db.logAudit({
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

  const schema = db.getSchema();
  const fileTarget = `/api/images/${fileName}`;

  // Safety check: is it referenced by any catalog food?
  const isUsedInFoods = schema.foods.some((f) => f.imageUrl === fileTarget || f.imageUrl?.endsWith(fileName));
  if (isUsedInFoods && req.user?.role !== 'admin') {
    res.status(403).json({ error: 'Cannot delete image in use by catalog food.' });
    return;
  }

  // Is it referenced by another user's submission?
  const usedInSub = schema.foodSubmissions?.find((s) => s.imageUrl === fileTarget || s.imageUrl?.endsWith(fileName));
  if (usedInSub && req.user?.role !== 'admin' && usedInSub.userId !== req.user?.userId) {
    res.status(403).json({ error: 'Cannot delete image attached to another user\'s submission.' });
    return;
  }

  const deleted = await imageStorage.deleteImage(fileName);
  if (!deleted) {
    res.status(404).json({ error: 'Image file not found or already removed.' });
    return;
  }

  const dbUser = schema.users.find((u) => u.id === req.user!.userId);
  db.logAudit({
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
apiRouter.post('/auth/register', (req: AuthenticatedRequest, res: Response) => {
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
  const schema = db.getSchema();

  const existing = schema.users.find((u) => u.email.toLowerCase() === normalizedEmail);
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

  schema.users.push(newUser);
  db.save();

  db.logAudit({
    action: 'USER_REGISTERED',
    entityType: 'USER',
    entityId: newUser.id,
    userId: newUser.id,
    userName: newUser.name,
    details: `User registered with email ${newUser.email}`,
  });

  const token = generateToken(newUser);
  const { passwordHash, salt: s, ...profile } = newUser;
  res.status(201).json({ token, user: profile });
});

// POST /api/auth/login
apiRouter.post('/auth/login', (req: AuthenticatedRequest, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required.' });
    return;
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const schema = db.getSchema();
  const user = schema.users.find((u) => u.email.toLowerCase() === normalizedEmail);

  if (!user || !verifyPassword(password, user.passwordHash, user.salt)) {
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  const token = generateToken(user);
  const { passwordHash, salt, ...profile } = user;
  res.json({ token, user: profile });
});

// GET /api/auth/me
apiRouter.get('/auth/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const schema = db.getSchema();
  const user = schema.users.find((u) => u.id === req.user?.userId);
  if (!user) {
    res.status(404).json({ error: 'User profile not found.' });
    return;
  }

  const { passwordHash, salt, ...profile } = user;
  res.json({ user: profile });
});

// PATCH /api/auth/profile
apiRouter.patch('/auth/profile', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { name, avatarUrl, homeDistrictId, bio } = req.body;
  const schema = db.getSchema();
  const user = schema.users.find((u) => u.id === req.user?.userId);
  if (!user) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }

  if (name && typeof name === 'string') user.name = name.trim();
  if (avatarUrl && typeof avatarUrl === 'string') user.avatarUrl = avatarUrl;
  if (homeDistrictId && typeof homeDistrictId === 'string') user.homeDistrictId = homeDistrictId;
  if (typeof bio === 'string') user.bio = bio.trim();

  db.save();

  const { passwordHash, salt, ...profile } = user;
  res.json({ user: profile });
});

// ==================== PASSWORD MANAGEMENT & AUTHENTICATED CHANGE ====================

// Handler for authenticated password change
function handleAuthenticatedPasswordChange(req: AuthenticatedRequest, res: Response): void {
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

  const schema = db.getSchema();
  const user = schema.users.find((u) => u.id === req.user?.userId);
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
  user.passwordHash = hash;
  user.salt = salt;
  db.save();

  // Audit log without recording passwords or sensitive credentials
  db.logAudit({
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
apiRouter.post('/auth/change-password', requireAuth, handleAuthenticatedPasswordChange);

// POST /api/auth/reset-password - Rejects unauthenticated resets, accepts only authenticated password changes
apiRouter.post('/auth/reset-password', (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(403).json({
      error: 'Self-service unauthenticated password reset is disabled for security. Please log in to change your password or contact an administrator.',
    });
    return;
  }
  handleAuthenticatedPasswordChange(req, res);
});

// ==================== DIVISIONS & DISTRICTS ====================

// GET /api/divisions
apiRouter.get('/divisions', (_req: AuthenticatedRequest, res: Response) => {
  const schema = db.getSchema();
  res.json(schema.divisions);
});

// GET /api/districts
apiRouter.get('/districts', (_req: AuthenticatedRequest, res: Response) => {
  const schema = db.getSchema();
  // Augment with foods count
  const foodCounts: Record<string, number> = {};
  schema.foods.forEach((f) => {
    if (f.isPublished) {
      foodCounts[f.districtId] = (foodCounts[f.districtId] || 0) + 1;
    }
  });

  const districtsWithStats = schema.districts.map((d) => ({
    ...d,
    foodsCount: foodCounts[d.id] || 0,
  }));

  res.json(districtsWithStats);
});

// GET /api/districts/:id
apiRouter.get('/districts/:id', (req: AuthenticatedRequest, res: Response) => {
  const schema = db.getSchema();
  const district = schema.districts.find((d) => d.id === req.params.id);
  if (!district) {
    res.status(404).json({ error: 'District not found.' });
    return;
  }

  const districtFoods = schema.foods.filter(
    (f) => f.districtId === district.id && f.isPublished
  );
  const division = schema.divisions.find((d) => d.id === district.divisionId);

  res.json({
    district,
    division,
    foods: districtFoods,
  });
});

// GET /api/categories
apiRouter.get('/categories', (_req: AuthenticatedRequest, res: Response) => {
  const schema = db.getSchema();
  res.json(schema.categories);
});

// ==================== FOODS ====================

// GET /api/foods
apiRouter.get('/foods', (req: AuthenticatedRequest, res: Response) => {
  const { division, district, category, search, dietary } = req.query;
  const schema = db.getSchema();

  let foods = schema.foods.filter((f) => f.isPublished);

  if (division && typeof division === 'string' && division !== 'all') {
    foods = foods.filter((f) => f.divisionId === division);
  }

  if (district && typeof district === 'string' && district !== 'all') {
    foods = foods.filter((f) => f.districtId === district);
  }

  if (category && typeof category === 'string' && category !== 'all') {
    foods = foods.filter((f) => f.category === category);
  }

  if (dietary && typeof dietary === 'string' && dietary !== 'all') {
    foods = foods.filter((f) => f.dietaryType === dietary);
  }

  if (search && typeof search === 'string' && search.trim()) {
    const q = search.trim().toLowerCase();
    foods = foods.filter(
      (f) =>
        f.nameEn.toLowerCase().includes(q) ||
        f.nameBn.includes(q) ||
        f.shortDescription.toLowerCase().includes(q) ||
        f.detailedDescription.toLowerCase().includes(q) ||
        (f.originHistory && f.originHistory.toLowerCase().includes(q))
    );
  }

  res.json(foods);
});

// GET /api/foods/:id
apiRouter.get('/foods/:id', (req: AuthenticatedRequest, res: Response) => {
  const schema = db.getSchema();
  const food = schema.foods.find((f) => f.id === req.params.id);
  if (!food || (!food.isPublished && req.user?.role !== 'admin')) {
    res.status(404).json({ error: 'Food delicacy not found.' });
    return;
  }

  const district = schema.districts.find((d) => d.id === food.districtId);
  const division = schema.divisions.find((d) => d.id === food.divisionId);
  const reviews = schema.foodReviews.filter((r) => r.foodId === food.id);

  res.json({
    food,
    district,
    division,
    reviews,
  });
});

// POST /api/foods (Admin only)
apiRouter.post('/foods', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
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

  const schema = db.getSchema();
  const district = schema.districts.find((d) => d.id === districtId.trim());
  if (!district) {
    res.status(400).json({ error: 'Invalid district ID.' });
    return;
  }

  // Division consistency validation: if divisionId is supplied, verify it matches the district's actual division
  const effectiveDivisionId = district.divisionId;
  if (divisionId && divisionId !== effectiveDivisionId) {
    const specifiedDiv = schema.divisions.find((dv) => dv.id === divisionId);
    if (!specifiedDiv || district.divisionId !== divisionId) {
      res.status(400).json({
        error: `District "${district.nameEn}" belongs to division "${district.divisionId}", not "${divisionId}".`,
      });
      return;
    }
  }

  // Image URL validation (must be valid http/https URL or application-managed image path if provided)
  const trimmedImageUrl = typeof imageUrl === 'string' ? imageUrl.trim() : '';
  if (trimmedImageUrl) {
    if (!isValidFoodImageReference(trimmedImageUrl)) {
      res.status(400).json({ error: 'Invalid food image URL format.' });
      return;
    }
  }

  // Duplicate food check: prevent adding duplicate food with identical English name or Bengali name in the same district
  const cleanEn = nameEn.trim().toLowerCase();
  const cleanBn = nameBn.trim();
  const isDuplicate = schema.foods.some(
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
    imageUrl: trimmedImageUrl || '',
    originHistory: (originHistory || '').trim(),
    originSource: (originSource || '').trim(),
    isPublished: isPublished !== false,
    ingredients: Array.isArray(ingredients) ? ingredients : [],
    approximatePriceBdt: Number(approximatePriceBdt) || 0,
    dietaryType: ['non-veg', 'veg', 'sweet'].includes(dietaryType) ? dietaryType : 'non-veg',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  schema.foods.unshift(newFood);
  db.save();

  db.logAudit({
    action: 'CREATE_FOOD',
    entityType: 'FOOD',
    entityId: newFood.id,
    userId: req.user!.userId,
    userName: req.user!.email,
    details: `Added new food: ${newFood.nameEn} (${newFood.nameBn}) in ${district.nameEn} [${newFood.isPublished ? 'Published' : 'Draft'}]`,
  });

  res.status(201).json(newFood);
});

// PUT /api/foods/:id (Admin only)
apiRouter.put('/foods/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const schema = db.getSchema();
  const foodIndex = schema.foods.findIndex((f) => f.id === req.params.id);
  if (foodIndex === -1) {
    res.status(404).json({ error: 'Food not found.' });
    return;
  }

  const existing = schema.foods[foodIndex];
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
    const district = schema.districts.find((d) => d.id === districtId.trim());
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
  if (imageUrl !== undefined && typeof imageUrl === 'string') {
    const trimmedImageUrl = imageUrl.trim();
    if (trimmedImageUrl) {
      if (!isValidFoodImageReference(trimmedImageUrl)) {
        res.status(400).json({ error: 'Invalid food image URL format.' });
        return;
      }
    }
  }

  // Check duplicate conflict on rename/edit
  const finalEn = (nameEn ?? existing.nameEn).trim().toLowerCase();
  const finalBn = (nameBn ?? existing.nameBn).trim();
  const conflict = schema.foods.some(
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

  const updated: Food = {
    ...existing,
    ...(nameEn !== undefined ? { nameEn: nameEn.trim() } : {}),
    ...(nameBn !== undefined ? { nameBn: nameBn.trim() } : {}),
    ...(shortDescription !== undefined ? { shortDescription: shortDescription.trim() } : {}),
    ...(detailedDescription !== undefined ? { detailedDescription: detailedDescription.trim() } : {}),
    ...(category !== undefined ? { category } : {}),
    districtId: effectiveDistrictId,
    divisionId: effectiveDivisionId,
    ...(imageUrl !== undefined ? { imageUrl: imageUrl.trim() } : {}),
    ...(originHistory !== undefined ? { originHistory: originHistory.trim() } : {}),
    ...(originSource !== undefined ? { originSource: originSource.trim() } : {}),
    ...(isPublished !== undefined ? { isPublished: Boolean(isPublished) } : {}),
    ...(ingredients !== undefined ? { ingredients: Array.isArray(ingredients) ? ingredients : [] } : {}),
    ...(approximatePriceBdt !== undefined ? { approximatePriceBdt: Number(approximatePriceBdt) || 0 } : {}),
    ...(dietaryType !== undefined ? { dietaryType } : {}),
    id: existing.id,
    updatedAt: new Date().toISOString(),
  };

  schema.foods[foodIndex] = updated;
  db.save();

  db.logAudit({
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
apiRouter.patch('/foods/:id/publish', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const schema = db.getSchema();
  const food = schema.foods.find((f) => f.id === req.params.id);
  if (!food) {
    res.status(404).json({ error: 'Food not found.' });
    return;
  }

  const { isPublished } = req.body;
  food.isPublished = Boolean(isPublished);
  food.updatedAt = new Date().toISOString();
  db.save();

  db.logAudit({
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
apiRouter.delete('/foods/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const schema = db.getSchema();
  const food = schema.foods.find((f) => f.id === req.params.id);
  if (!food) {
    res.status(404).json({ error: 'Food not found.' });
    return;
  }

  schema.foods = schema.foods.filter((f) => f.id !== req.params.id);
  // Also clean up tracking records
  schema.userFoods = schema.userFoods.filter((uf) => uf.foodId !== req.params.id);
  schema.foodReviews = schema.foodReviews.filter((r) => r.foodId !== req.params.id);
  db.save();

  db.logAudit({
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
const handleCreateSubmission = (req: AuthenticatedRequest, res: Response): void => {
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

  const schema = db.getSchema();
  if (!schema.foodSubmissions) {
    schema.foodSubmissions = [];
  }

  const district = schema.districts.find((d) => d.id === districtId.trim());
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
  if (trimmedImageUrl) {
    if (!isValidFoodImageReference(trimmedImageUrl)) {
      res.status(400).json({ error: 'Invalid food image URL format.' });
      return;
    }
  }

  // Duplicate food check: warn and allow review
  const cleanEn = nameEn.trim().toLowerCase();
  const cleanBn = nameBn.trim();
  const existingCatalogMatch = schema.foods.find(
    (f) =>
      f.districtId === district.id &&
      (f.nameEn.toLowerCase() === cleanEn || f.nameBn.trim() === cleanBn)
  );

  const existingPendingMatch = schema.foodSubmissions.find(
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
  const submitterUser = schema.users.find((u) => u.id === req.user!.userId);
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
    imageUrl: trimmedImageUrl || '',
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

  schema.foodSubmissions.unshift(newSubmission);
  db.save();

  db.logAudit({
    action: 'FOOD_SUBMITTED',
    entityType: 'FOOD_SUBMISSION',
    entityId: newSubmission.id,
    userId: req.user!.userId,
    userName: submitterName,
    details: `User submitted food suggestion: ${newSubmission.nameEn} (${newSubmission.nameBn}) for district ${district.nameEn} [Status: Pending]`,
  });

  res.status(201).json({
    success: true,
    message: 'Your regional food suggestion has been submitted successfully for verification!',
    referenceId: newSubmission.id,
    submission: newSubmission,
  });
};

apiRouter.post('/submissions', requireAuth, handleCreateSubmission);
apiRouter.post('/food-submissions', requireAuth, handleCreateSubmission);

// GET /api/user/submissions - Get authenticated user's food contributions
apiRouter.get('/user/submissions', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const schema = db.getSchema();
  if (!schema.foodSubmissions) {
    schema.foodSubmissions = [];
  }
  const userSubmissions = schema.foodSubmissions.filter((s) => s.userId === req.user!.userId);
  res.json(userSubmissions);
});

// GET /api/user/submissions/:id - Get specific submission by ID (owner or admin)
apiRouter.get('/user/submissions/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const schema = db.getSchema();
  if (!schema.foodSubmissions) {
    schema.foodSubmissions = [];
  }
  const submission = schema.foodSubmissions.find((s) => s.id === req.params.id);
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
apiRouter.put('/user/submissions/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const schema = db.getSchema();
  if (!schema.foodSubmissions) {
    schema.foodSubmissions = [];
  }
  const subIndex = schema.foodSubmissions.findIndex((s) => s.id === req.params.id);
  if (subIndex === -1) {
    res.status(404).json({ error: 'Food submission not found.' });
    return;
  }

  const submission = schema.foodSubmissions[subIndex];

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

  if (districtId) {
    const district = schema.districts.find((d) => d.id === districtId.trim());
    if (!district) {
      res.status(400).json({ error: 'Invalid district ID.' });
      return;
    }
    submission.districtId = district.id;
    submission.divisionId = district.divisionId;
  }

  if (nameEn !== undefined) submission.nameEn = nameEn.trim();
  if (nameBn !== undefined) submission.nameBn = nameBn.trim();
  if (shortDescription !== undefined) submission.shortDescription = shortDescription.trim();
  if (detailedDescription !== undefined) submission.detailedDescription = detailedDescription.trim();
  if (category !== undefined) submission.category = category;
  if (imageUrl !== undefined) {
    const trimmedImageUrl = typeof imageUrl === 'string' ? imageUrl.trim() : '';
    if (trimmedImageUrl && !isValidFoodImageReference(trimmedImageUrl)) {
      res.status(400).json({ error: 'Invalid food image URL format.' });
      return;
    }
    submission.imageUrl = trimmedImageUrl;
  }
  if (originHistory !== undefined) submission.originHistory = originHistory.trim();
  if (originSource !== undefined) submission.originSource = originSource.trim();
  if (approximatePriceBdt !== undefined) submission.approximatePriceBdt = Number(approximatePriceBdt) || 0;
  if (dietaryType !== undefined) submission.dietaryType = dietaryType;
  if (Array.isArray(ingredients)) submission.ingredients = ingredients;

  submission.editHistory = submission.editHistory || [];
  submission.editHistory.push({
    editedAt: new Date().toISOString(),
    summary: req.user!.role === 'admin' ? 'Administrator updated details' : 'User updated submission details',
  });
  submission.updatedAt = new Date().toISOString();

  db.save();

  db.logAudit({
    action: 'FOOD_SUBMISSION_EDITED',
    entityType: 'FOOD_SUBMISSION',
    entityId: submission.id,
    userId: req.user!.userId,
    userName: req.user!.email,
    details: `Updated food submission: ${submission.nameEn} (${submission.nameBn})`,
  });

  res.json(submission);
});

// GET /api/admin/submissions - Admin list all food requests with filtering and duplicate analysis
apiRouter.get('/admin/submissions', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { status, search, district, division } = req.query;
  const schema = db.getSchema();
  if (!schema.foodSubmissions) {
    schema.foodSubmissions = [];
  }

  let list = [...schema.foodSubmissions];

  if (status && typeof status === 'string' && status !== 'all') {
    list = list.filter((s) => s.status === status);
  }

  if (district && typeof district === 'string' && district !== 'all') {
    list = list.filter((s) => s.districtId === district);
  }

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
  const enriched = list.map((sub) => {
    const cleanEn = sub.nameEn.toLowerCase().trim();
    const cleanBn = sub.nameBn.trim();
    const potentialCatalogMatch = schema.foods.find(
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
apiRouter.put('/admin/submissions/:id/review', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const schema = db.getSchema();
  if (!schema.foodSubmissions) {
    schema.foodSubmissions = [];
  }

  const sub = schema.foodSubmissions.find((s) => s.id === req.params.id);
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
      const existingApprovedFood = schema.foods.find((f) => f.id === sub.approvedFoodId);
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

  const adminUser = schema.users.find((u) => u.id === req.user!.userId);
  const adminDisplayName = adminUser?.name || 'Foodie BD Admin';

  if (action === 'approve') {
    // Admin can correct fields during review
    const finalEn = (correctedData?.nameEn || sub.nameEn || '').trim();
    const finalBn = (correctedData?.nameBn || sub.nameBn || '').trim();
    const finalDistrictId = (correctedData?.districtId || sub.districtId || '').trim();
    const district = schema.districts.find((d) => d.id === finalDistrictId);

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

    // Check if an approved food record was already generated for this submission to avoid duplicate catalog foods
    let catalogFood = sub.approvedFoodId
      ? schema.foods.find((f) => f.id === sub.approvedFoodId)
      : undefined;

    if (!catalogFood) {
      const newFoodId = 'food_' + crypto.randomUUID().slice(0, 8);
      catalogFood = {
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

      schema.foods.unshift(catalogFood);
    } else {
      // Update existing catalog food with any corrected data
      catalogFood.nameEn = finalEn;
      catalogFood.nameBn = finalBn;
      catalogFood.districtId = district.id;
      catalogFood.divisionId = district.divisionId;
      catalogFood.isPublished = true;
      catalogFood.updatedAt = new Date().toISOString();
    }

    // Update submission record
    sub.status = 'approved';
    sub.approvedFoodId = catalogFood.id;
    sub.reviewedByUserId = req.user!.userId;
    sub.reviewedByUserName = adminDisplayName;
    sub.reviewedAt = new Date().toISOString();
    sub.adminFeedback = (adminFeedback || 'Approved and published to the Foodie BD regional culinary catalog.').trim();
    sub.updatedAt = new Date().toISOString();

    db.save();

    db.logAudit({
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
      submission: sub,
      food: catalogFood,
    });
    return;
  }

  if (action === 'reject') {
    if (!adminFeedback || !adminFeedback.trim()) {
      res.status(400).json({ error: 'Rejection feedback / reason is required for the user.' });
      return;
    }

    sub.status = 'rejected';
    sub.reviewedByUserId = req.user!.userId;
    sub.reviewedByUserName = adminDisplayName;
    sub.reviewedAt = new Date().toISOString();
    sub.adminFeedback = adminFeedback.trim();
    sub.updatedAt = new Date().toISOString();

    db.save();

    db.logAudit({
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
      submission: sub,
    });
    return;
  }
});

// ==================== USER JOURNEY & TRACKING ====================

// GET /api/user/journey
apiRouter.get('/user/journey', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const schema = db.getSchema();

  const userTrackings = schema.userFoods.filter((uf) => uf.userId === userId);

  // Join with food details
  const joined = userTrackings.map((t) => {
    const food = schema.foods.find((f) => f.id === t.foodId);
    const district = food ? schema.districts.find((d) => d.id === food.districtId) : undefined;
    const division = food ? schema.divisions.find((d) => d.id === food.divisionId) : undefined;
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
apiRouter.post('/user/journey', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const { foodId, status, triedAt, rating, notes, photoUrl } = req.body;

  if (!foodId || !status || !['tried', 'want_to_try'].includes(status)) {
    res.status(400).json({ error: 'Valid foodId and status ("tried" or "want_to_try") are required.' });
    return;
  }

  const schema = db.getSchema();
  const food = schema.foods.find((f) => f.id === foodId);
  if (!food) {
    res.status(404).json({ error: 'Food record not found.' });
    return;
  }

  let tracking = schema.userFoods.find((uf) => uf.userId === userId && uf.foodId === foodId);

  if (tracking) {
    // Update existing
    tracking.status = status;
    if (status === 'tried') {
      tracking.triedAt = triedAt || tracking.triedAt || new Date().toISOString();
      if (rating !== undefined) tracking.rating = Number(rating);
      if (notes !== undefined) tracking.notes = String(notes);
      if (photoUrl !== undefined) tracking.photoUrl = String(photoUrl);
    }
    tracking.updatedAt = new Date().toISOString();
  } else {
    // Create new
    tracking = {
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
    schema.userFoods.push(tracking);
  }

  db.save();
  res.json(tracking);
});

// DELETE /api/user/journey/:foodId
apiRouter.delete('/user/journey/:foodId', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const { foodId } = req.params;
  const schema = db.getSchema();

  const initialCount = schema.userFoods.length;
  schema.userFoods = schema.userFoods.filter(
    (uf) => !(uf.userId === userId && uf.foodId === foodId)
  );

  if (schema.userFoods.length < initialCount) {
    db.save();
  }

  res.json({ success: true, message: 'Removed from journey.' });
});

// GET /api/user/achievements
apiRouter.get('/user/achievements', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const schema = db.getSchema();

  const userTrackings = schema.userFoods.filter((uf) => uf.userId === userId && uf.status === 'tried');
  const triedFoods = userTrackings
    .map((t) => schema.foods.find((f) => f.id === t.foodId))
    .filter((f): f is Food => !!f);

  const totalTried = triedFoods.length;
  const uniqueDistricts = new Set(triedFoods.map((f) => f.districtId)).size;
  const uniqueDivisions = new Set(triedFoods.map((f) => f.divisionId)).size;
  const sweetsCount = triedFoods.filter((f) => f.category === 'sweets_pitha' || f.category === 'dessert').length;
  const dhakaCount = triedFoods.filter((f) => f.divisionId === 'dhaka').length;
  const spicyCount = triedFoods.filter((f) =>
    ['food_ctg_kala_bhuna', 'food_khulna_chui_jhal', 'food_coxsbazar_shutki', 'food_rangpur_shidol'].includes(f.id)
  ).length;

  const evaluated = schema.achievements.map((ach) => {
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
apiRouter.get('/reviews', (req: AuthenticatedRequest, res: Response) => {
  const { foodId } = req.query;
  const schema = db.getSchema();

  if (foodId && typeof foodId === 'string') {
    const reviews = schema.foodReviews.filter((r) => r.foodId === foodId);
    res.json(reviews);
    return;
  }

  res.json(schema.foodReviews);
});

// POST /api/reviews
apiRouter.post('/reviews', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const { foodId, rating, comment } = req.body;

  if (!foodId || !rating || !comment || comment.trim().length < 3) {
    res.status(400).json({ error: 'Valid foodId, rating (1-5), and comment are required.' });
    return;
  }

  const schema = db.getSchema();
  const user = schema.users.find((u) => u.id === userId);
  const food = schema.foods.find((f) => f.id === foodId);

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

  schema.foodReviews.unshift(review);
  db.save();

  res.status(201).json(review);
});

// DELETE /api/reviews/:id (Admin only)
apiRouter.delete('/reviews/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const schema = db.getSchema();
  const initial = schema.foodReviews.length;
  schema.foodReviews = schema.foodReviews.filter((r) => r.id !== req.params.id);

  if (schema.foodReviews.length < initial) {
    db.save();
    db.logAudit({
      action: 'DELETE_REVIEW',
      entityType: 'REVIEW',
      entityId: req.params.id,
      userId: req.user!.userId,
      userName: req.user!.email,
      details: `Moderated and removed review ID: ${req.params.id}`,
    });
  }

  res.json({ success: true, message: 'Review removed by moderator.' });
});

// ==================== PLATFORM STATS ====================

// GET /api/stats
apiRouter.get('/stats', (_req: AuthenticatedRequest, res: Response) => {
  const schema = db.getSchema();
  const totalDistricts = schema.districts.length;
  const totalDivisions = schema.divisions.length;
  const totalFoods = schema.foods.filter((f) => f.isPublished).length;
  const totalTriedByUsers = schema.userFoods.filter((u) => u.status === 'tried').length;
  const activeFoodiesCount = schema.users.length;

  const stats: PlatformStats = {
    totalDistricts,
    totalDivisions,
    totalFoods,
    totalTriedByUsers,
    activeFoodiesCount,
  };

  res.json(stats);
});

// ==================== ADMIN DASHBOARD ====================

// GET /api/admin/foods (Admin only: view all foods including unpublished drafts)
apiRouter.get('/admin/foods', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { division, district, category, search, status } = req.query;
  const schema = db.getSchema();

  let foods = [...schema.foods];

  if (status === 'published') {
    foods = foods.filter((f) => f.isPublished);
  } else if (status === 'draft') {
    foods = foods.filter((f) => !f.isPublished);
  }

  if (division && typeof division === 'string' && division !== 'all') {
    foods = foods.filter((f) => f.divisionId === division);
  }

  if (district && typeof district === 'string' && district !== 'all') {
    foods = foods.filter((f) => f.districtId === district);
  }

  if (category && typeof category === 'string' && category !== 'all') {
    foods = foods.filter((f) => f.category === category);
  }

  if (search && typeof search === 'string' && search.trim()) {
    const q = search.trim().toLowerCase();
    foods = foods.filter(
      (f) =>
        f.nameEn.toLowerCase().includes(q) ||
        f.nameBn.includes(q) ||
        f.shortDescription.toLowerCase().includes(q) ||
        f.detailedDescription.toLowerCase().includes(q) ||
        (f.originHistory && f.originHistory.toLowerCase().includes(q))
    );
  }

  res.json(foods);
});

// GET /api/admin/overview
apiRouter.get('/admin/overview', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const schema = db.getSchema();
  res.json({
    totalUsers: schema.users.length,
    totalFoods: schema.foods.length,
    publishedFoods: schema.foods.filter((f) => f.isPublished).length,
    draftFoods: schema.foods.filter((f) => !f.isPublished).length,
    totalReviews: schema.foodReviews.length,
    totalTrackingEntries: schema.userFoods.length,
    recentAudits: schema.auditLogs.slice(0, 15),
  });
});

// GET /api/admin/users
apiRouter.get('/admin/users', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const schema = db.getSchema();
  const sanitized = schema.users.map(({ passwordHash, salt, ...profile }) => profile);
  res.json(sanitized);
});

// GET /api/admin/audit-logs
apiRouter.get('/admin/audit-logs', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const schema = db.getSchema();
  res.json(schema.auditLogs);
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
    activeDatabase: dbStatus.isConnected ? 'postgresql' : 'local_json',
  });
});

// ==================== RESEARCH-BASED CONTENT AUDIT & CATALOG ENDPOINTS ====================

// GET /api/admin/research/district/:districtId
// Returns verified research dossiers for an unrepresented or targeted district
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
// Returns all 28 research dossiers and full 64-district coverage analysis
apiRouter.get('/admin/research/dossiers', requireAdmin, async (_req: AuthenticatedRequest, res: Response) => {
  const { VERIFIED_DISTRICT_RESEARCH } = await import('./data/verifiedDistrictResearch');
  const schema = db.getSchema();
  const districtFoodMap: Record<string, any[]> = {};
  schema.foods.forEach((f) => {
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

  const totalDistricts = schema.districts.length;
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
// Publishes a researched and verified food dossier into the live food catalog with full provenance
apiRouter.post('/admin/research/publish-dossier', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { districtId, customImageUrl, customPrice } = req.body;
  if (!districtId) {
    res.status(400).json({ error: 'districtId is required.' });
    return;
  }

  const { VERIFIED_DISTRICT_RESEARCH } = await import('./data/verifiedDistrictResearch');
  const dossier = VERIFIED_DISTRICT_RESEARCH[districtId];
  if (!dossier) {
    res.status(404).json({ error: `No verified research entry found for district "${districtId}".` });
    return;
  }

  const schema = db.getSchema();
  const district = schema.districts.find((d) => d.id === districtId);
  if (!district) {
    res.status(404).json({ error: `District "${districtId}" not found in database.` });
    return;
  }

  // Generate safe unique ID
  const safeId = `food_${districtId}_${Date.now().toString(36)}`;
  const currentUser = req.user!;
  const user = schema.users.find((u) => u.id === currentUser.userId);

  const newFood: any = {
    id: safeId,
    nameEn: dossier.foodNameEn,
    nameBn: dossier.foodNameBn,
    shortDescription: dossier.shortDescriptionBn,
    detailedDescription: dossier.detailedDescriptionBn,
    category: dossier.category,
    districtId: dossier.districtId,
    divisionId: dossier.divisionId,
    imageUrl: customImageUrl || '/placeholder-food.jpg',
    originHistory: dossier.historicalContextBn,
    originSource: dossier.primarySource,
    isPublished: true,
    ingredients: dossier.ingredients,
    approximatePriceBdt: customPrice !== undefined ? Number(customPrice) : dossier.approximatePriceBdt,
    dietaryType: dossier.dietaryType,
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

  schema.foods.push(newFood);
  db.save();

  db.logAudit({
    action: 'PUBLISH_RESEARCHED_FOOD',
    entityType: 'FOOD',
    entityId: newFood.id,
    userId: currentUser.userId,
    userName: user?.name || 'Admin',
    details: `Published verified food research "${newFood.nameEn}" (${newFood.nameBn}) for district ${district.nameEn}. Source: ${dossier.primarySource}.`,
  });

  res.status(201).json({
    success: true,
    message: `Successfully published verified food record for ${district.nameEn}.`,
    food: newFood,
  });
});

// ==================== SECURE INITIAL ADMIN BOOTSTRAP ====================
// POST /api/setup/promote-admin
// Strict server-side endpoint guarded by ADMIN_SETUP_KEY.
// Only accessible during initial bootstrapping when NO admin accounts exist yet.
// Once an administrator account exists, this setup endpoint is permanently locked.
apiRouter.post('/setup/promote-admin', (req: AuthenticatedRequest, res: Response) => {
  const configuredKey = process.env.ADMIN_SETUP_KEY;

  // 1. Never allow absent or weak ADMIN_SETUP_KEY (no hardcoded fallback allowed)
  if (!configuredKey || typeof configuredKey !== 'string' || configuredKey.trim().length < 16) {
    res.status(503).json({
      error: 'Administrator setup endpoint is permanently disabled. Configure a secure ADMIN_SETUP_KEY (minimum 16 characters) in server environment.',
    });
    return;
  }

  // 2. Prevent setup endpoint abuse once initial admin bootstrap has already occurred
  const schema = db.getSchema();
  const existingAdmins = schema.users.filter((u) => u.role === 'admin');
  const { email } = req.body || {};
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

  // If administrators already exist in the database, prevent promoting any new users via setup endpoint
  if (existingAdmins.length > 0) {
    const isAlreadyAdmin = existingAdmins.some((a) => a.email.toLowerCase() === normalizedEmail);
    if (!isAlreadyAdmin) {
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

  const user = schema.users.find((u) => u.email.toLowerCase() === normalizedEmail);
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
  user.role = 'admin';
  db.save();

  db.logAudit({
    action: 'PROMOTE_TO_ADMIN',
    entityType: 'USER',
    entityId: user.id,
    userId: user.id,
    userName: user.name,
    details: `Account ${user.email} was promoted to administrator role via initial bootstrap setup. Previous role was ${previousRole}.`,
  });

  const { passwordHash, salt, ...profile } = user;
  res.json({
    success: true,
    message: `Account "${user.email}" has been successfully promoted to the Admin role.`,
    user: profile,
  });
});
