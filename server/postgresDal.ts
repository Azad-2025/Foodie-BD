import pg from 'pg';
import { query, withTransaction, getPostgresPool } from './postgres';
import {
  Division,
  District,
  FoodCategory,
  CategoryInfo,
  Food,
  FoodSubmission,
  UserFoodTracking,
  UserProfile,
  FoodReview,
  Achievement,
  AuditLog,
  PlatformStats,
} from '../src/types';
import { DbUser, ReportItem } from './db';

// Row mapper helpers
function mapDivisionRow(row: any): Division {
  return {
    id: row.id,
    nameEn: row.name_en,
    nameBn: row.name_bn,
    capitalEn: row.capital_en,
    capitalBn: row.capital_bn,
  };
}

function mapDistrictRow(row: any): District & { foodsCount: number } {
  return {
    id: row.id,
    divisionId: row.division_id,
    nameEn: row.name_en,
    nameBn: row.name_bn,
    shapeName: row.shape_name,
    lat: Number(row.lat),
    lng: Number(row.lng),
    prominentDishEn: row.prominent_dish_en,
    prominentDishBn: row.prominent_dish_bn,
    description: row.description || '',
    foodsCount: Number(row.foods_count || 0),
  };
}

function mapCategoryRow(row: any): CategoryInfo {
  return {
    id: row.id as FoodCategory,
    nameEn: row.name_en,
    nameBn: row.name_bn,
    description: row.description || '',
  };
}

function mapProfileRow(row: any): DbUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    avatarUrl: row.avatar_url || undefined,
    homeDistrictId: row.home_district_id || undefined,
    bio: row.bio || undefined,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    passwordHash: row.password_hash,
    salt: row.salt,
  };
}

function mapFoodRow(row: any): Food {
  return {
    id: row.id,
    nameEn: row.name_en,
    nameBn: row.name_bn,
    shortDescription: row.short_description,
    detailedDescription: row.detailed_description || row.short_description,
    category: row.category_id as FoodCategory,
    districtId: row.district_id,
    divisionId: row.division_id,
    imageUrl: row.image_url,
    originHistory: row.origin_history || '',
    originSource: row.origin_source || '',
    isPublished: Boolean(row.is_published),
    ingredients: Array.isArray(row.ingredients) ? row.ingredients : [],
    approximatePriceBdt: Number(row.approximate_price_bdt || 0),
    dietaryType: row.dietary || 'non-veg',
    submissionId: row.submission_id || undefined,
    submittedByUserId: row.submitted_by_user_id || undefined,
    submittedByUserName: row.submitted_by_user_name || undefined,
    approvedByUserId: row.approved_by_user_id || undefined,
    approvedByUserName: row.approved_by_user_name || undefined,
    approvedAt: row.approved_at ? new Date(row.approved_at).toISOString() : undefined,
    verificationStatus: row.verification_status || 'admin_created',
    researchStatus: row.research_status || undefined,
    citationSources: Array.isArray(row.citation_sources) ? row.citation_sources : [],
    imageCaption: row.image_caption || undefined,
    imageAttribution: row.image_attribution || undefined,
    imageVerified: Boolean(row.image_verified),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
  };
}

function mapSubmissionRow(row: any): FoodSubmission {
  let editHistory: any[] = [];
  if (Array.isArray(row.edit_history)) {
    editHistory = row.edit_history;
  } else if (typeof row.edit_history === 'string') {
    try {
      editHistory = JSON.parse(row.edit_history);
    } catch {}
  }

  return {
    id: row.id,
    nameEn: row.name_en,
    nameBn: row.name_bn,
    shortDescription: row.short_description,
    detailedDescription: row.detailed_description || undefined,
    category: row.category_id as FoodCategory,
    districtId: row.district_id,
    divisionId: row.division_id,
    imageUrl: row.image_url,
    originHistory: row.origin_history || undefined,
    originSource: row.origin_source || undefined,
    approximatePriceBdt: Number(row.approximate_price_bdt || 0),
    dietaryType: row.dietary_type || 'non-veg',
    ingredients: Array.isArray(row.ingredients) ? row.ingredients : [],
    accurateInfoConfirmed: Boolean(row.accurate_info_confirmed),
    userId: row.user_id,
    submitterName: row.submitter_name,
    status: row.status,
    reviewedByUserId: row.reviewed_by_user_id || undefined,
    reviewedByUserName: row.reviewed_by_user_name || undefined,
    reviewedAt: row.reviewed_at ? new Date(row.reviewed_at).toISOString() : undefined,
    adminFeedback: row.admin_feedback || undefined,
    approvedFoodId: row.approved_food_id || undefined,
    editHistory,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
  };
}

function mapUserFoodRow(row: any): UserFoodTracking {
  return {
    id: row.id,
    userId: row.user_id,
    foodId: row.food_id,
    status: row.status,
    triedAt: row.tried_at ? new Date(row.tried_at).toISOString() : undefined,
    rating: row.rating ? Number(row.rating) : undefined,
    notes: row.notes || undefined,
    photoUrl: row.photo_url || undefined,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
  };
}

function mapReviewRow(row: any): FoodReview {
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name || 'Foodie Member',
    userAvatar: row.user_avatar || undefined,
    foodId: row.food_id,
    rating: Number(row.rating),
    comment: row.comment,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
  };
}

function mapAchievementRow(row: any): Achievement {
  return {
    id: row.id,
    titleEn: row.title_en,
    titleBn: row.title_bn,
    descriptionEn: row.description_en,
    descriptionBn: row.description_bn,
    icon: row.icon,
    category: row.category,
    threshold: Number(row.threshold || 1),
  };
}

function mapReportRow(row: any): ReportItem {
  return {
    id: row.id,
    reporterUserId: row.reporter_user_id,
    foodId: row.food_id || undefined,
    reason: row.reason,
    status: row.status,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
  };
}

function mapAuditLogRow(row: any): AuditLog {
  return {
    id: row.id,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    userId: row.user_id || 'system',
    userName: row.user_name,
    details: row.details,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
  };
}

export class PostgresDataAccessLayer {
  // ----------------------------------------------------
  // Divisions & Districts & Categories
  // ----------------------------------------------------
  async getDivisions(): Promise<Division[]> {
    const res = await query('SELECT * FROM divisions ORDER BY name_en ASC');
    return res.rows.map(mapDivisionRow);
  }

  async getDistricts(): Promise<(District & { foodsCount: number })[]> {
    const sql = `
      SELECT d.*, COUNT(f.id)::int as foods_count
      FROM districts d
      LEFT JOIN foods f ON f.district_id = d.id AND f.is_published = true
      GROUP BY d.id
      ORDER BY d.name_en ASC
    `;
    const res = await query(sql);
    return res.rows.map(mapDistrictRow);
  }

  async getDistrictById(id: string): Promise<(District & { foodsCount: number }) | null> {
    const sql = `
      SELECT d.*, COUNT(f.id)::int as foods_count
      FROM districts d
      LEFT JOIN foods f ON f.district_id = d.id AND f.is_published = true
      WHERE d.id = $1
      GROUP BY d.id
    `;
    const res = await query(sql, [id]);
    if (res.rows.length === 0) return null;
    return mapDistrictRow(res.rows[0]);
  }

  async getCategories(): Promise<CategoryInfo[]> {
    const res = await query('SELECT * FROM food_categories ORDER BY id ASC');
    return res.rows.map(mapCategoryRow);
  }

  // ----------------------------------------------------
  // Users & Authentication
  // ----------------------------------------------------
  async getUserById(id: string): Promise<DbUser | null> {
    const res = await query('SELECT * FROM profiles WHERE id = $1', [id]);
    if (res.rows.length === 0) return null;
    return mapProfileRow(res.rows[0]);
  }

  async getUserByEmail(email: string): Promise<DbUser | null> {
    const res = await query('SELECT * FROM profiles WHERE LOWER(email) = LOWER($1)', [email.trim()]);
    if (res.rows.length === 0) return null;
    return mapProfileRow(res.rows[0]);
  }

  async getAllUsers(): Promise<UserProfile[]> {
    const res = await query('SELECT id, name, email, role, avatar_url, home_district_id, bio, created_at FROM profiles ORDER BY created_at DESC');
    return res.rows.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      role: r.role,
      avatarUrl: r.avatar_url || undefined,
      homeDistrictId: r.home_district_id || undefined,
      bio: r.bio || undefined,
      createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
    }));
  }

  async hasAdmin(): Promise<boolean> {
    const res = await query("SELECT EXISTS(SELECT 1 FROM profiles WHERE role = 'admin') as has_admin");
    return Boolean(res.rows[0]?.has_admin);
  }

  async createUser(user: DbUser): Promise<DbUser> {
    const sql = `
      INSERT INTO profiles (
        id, name, email, password_hash, salt, role, avatar_url, home_district_id, bio, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;
    const params = [
      user.id,
      user.name,
      user.email,
      user.passwordHash,
      user.salt,
      user.role,
      user.avatarUrl || null,
      user.homeDistrictId || null,
      user.bio || null,
      user.createdAt || new Date().toISOString(),
      new Date().toISOString(),
    ];
    const res = await query(sql, params);
    return mapProfileRow(res.rows[0]);
  }

  async updateUserProfile(id: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    const sql = `
      UPDATE profiles
      SET name = COALESCE($2, name),
          avatar_url = COALESCE($3, avatar_url),
          home_district_id = COALESCE($4, home_district_id),
          bio = COALESCE($5, bio),
          updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    const params = [
      id,
      updates.name !== undefined ? updates.name : null,
      updates.avatarUrl !== undefined ? updates.avatarUrl : null,
      updates.homeDistrictId !== undefined ? updates.homeDistrictId : null,
      updates.bio !== undefined ? updates.bio : null,
    ];
    const res = await query(sql, params);
    if (res.rows.length === 0) throw new Error('User profile not found.');
    const u = mapProfileRow(res.rows[0]);
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      avatarUrl: u.avatarUrl,
      homeDistrictId: u.homeDistrictId,
      bio: u.bio,
      createdAt: u.createdAt,
    };
  }

  async updateUserPassword(id: string, passwordHash: string, salt: string): Promise<boolean> {
    const res = await query('UPDATE profiles SET password_hash = $2, salt = $3, updated_at = NOW() WHERE id = $1', [
      id,
      passwordHash,
      salt,
    ]);
    return (res.rowCount ?? 0) > 0;
  }

  async updateUserRole(id: string, role: 'admin' | 'user'): Promise<UserProfile> {
    const res = await query('UPDATE profiles SET role = $2, updated_at = NOW() WHERE id = $1 RETURNING *', [id, role]);
    if (res.rows.length === 0) throw new Error('User not found.');
    const u = mapProfileRow(res.rows[0]);
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      avatarUrl: u.avatarUrl,
      homeDistrictId: u.homeDistrictId,
      bio: u.bio,
      createdAt: u.createdAt,
    };
  }

  // ----------------------------------------------------
  // Foods
  // ----------------------------------------------------
  async getFoods(options: {
    divisionId?: string;
    districtId?: string;
    category?: string;
    dietary?: string;
    search?: string;
    includeDrafts?: boolean;
  } = {}): Promise<Food[]> {
    let sql = 'SELECT * FROM foods WHERE 1=1';
    const params: any[] = [];
    let pIdx = 1;

    if (!options.includeDrafts) {
      sql += ` AND is_published = true`;
    }
    if (options.divisionId && options.divisionId !== 'all') {
      sql += ` AND division_id = $${pIdx++}`;
      params.push(options.divisionId);
    }
    if (options.districtId && options.districtId !== 'all') {
      sql += ` AND district_id = $${pIdx++}`;
      params.push(options.districtId);
    }
    if (options.category && options.category !== 'all') {
      sql += ` AND category_id = $${pIdx++}`;
      params.push(options.category);
    }
    if (options.dietary && options.dietary !== 'all') {
      sql += ` AND dietary = $${pIdx++}`;
      params.push(options.dietary);
    }
    if (options.search && options.search.trim()) {
      const q = `%${options.search.trim().toLowerCase()}%`;
      sql += ` AND (LOWER(name_en) LIKE $${pIdx} OR name_bn LIKE $${pIdx} OR LOWER(short_description) LIKE $${pIdx})`;
      params.push(q);
      pIdx++;
    }

    sql += ' ORDER BY created_at DESC';
    const res = await query(sql, params);
    return res.rows.map(mapFoodRow);
  }

  async getFoodById(id: string): Promise<Food | null> {
    const res = await query('SELECT * FROM foods WHERE id = $1', [id]);
    if (res.rows.length === 0) return null;
    return mapFoodRow(res.rows[0]);
  }

  async createFood(food: Food): Promise<Food> {
    const sql = `
      INSERT INTO foods (
        id, name_en, name_bn, short_description, detailed_description,
        category_id, district_id, division_id, image_url, origin_history,
        origin_source, approximate_price_bdt, dietary, is_published, ingredients,
        submission_id, submitted_by_user_id, submitted_by_user_name,
        approved_by_user_id, approved_by_user_name, approved_at, verification_status,
        research_status, citation_sources, image_caption, image_attribution, image_verified,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29)
      RETURNING *
    `;
    const params = [
      food.id,
      food.nameEn,
      food.nameBn,
      food.shortDescription,
      food.detailedDescription,
      food.category,
      food.districtId,
      food.divisionId,
      food.imageUrl,
      food.originHistory || '',
      food.originSource || '',
      food.approximatePriceBdt || 0,
      food.dietaryType || 'non-veg',
      food.isPublished ?? true,
      food.ingredients || [],
      food.submissionId || null,
      food.submittedByUserId || null,
      food.submittedByUserName || null,
      food.approvedByUserId || null,
      food.approvedByUserName || null,
      food.approvedAt || null,
      food.verificationStatus || 'admin_created',
      food.researchStatus || null,
      food.citationSources || [],
      food.imageCaption || null,
      food.imageAttribution || null,
      Boolean(food.imageVerified),
      food.createdAt || new Date().toISOString(),
      food.updatedAt || new Date().toISOString(),
    ];
    const res = await query(sql, params);
    return mapFoodRow(res.rows[0]);
  }

  async updateFood(id: string, updates: Partial<Food>): Promise<Food> {
    const existing = await this.getFoodById(id);
    if (!existing) throw new Error('Food record not found.');

    const sql = `
      UPDATE foods
      SET name_en = COALESCE($2, name_en),
          name_bn = COALESCE($3, name_bn),
          short_description = COALESCE($4, short_description),
          detailed_description = COALESCE($5, detailed_description),
          category_id = COALESCE($6, category_id),
          district_id = COALESCE($7, district_id),
          division_id = COALESCE($8, division_id),
          image_url = COALESCE($9, image_url),
          origin_history = COALESCE($10, origin_history),
          origin_source = COALESCE($11, origin_source),
          approximate_price_bdt = COALESCE($12, approximate_price_bdt),
          dietary = COALESCE($13, dietary),
          is_published = COALESCE($14, is_published),
          ingredients = COALESCE($15, ingredients),
          updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    const params = [
      id,
      updates.nameEn !== undefined ? updates.nameEn : null,
      updates.nameBn !== undefined ? updates.nameBn : null,
      updates.shortDescription !== undefined ? updates.shortDescription : null,
      updates.detailedDescription !== undefined ? updates.detailedDescription : null,
      updates.category !== undefined ? updates.category : null,
      updates.districtId !== undefined ? updates.districtId : null,
      updates.divisionId !== undefined ? updates.divisionId : null,
      updates.imageUrl !== undefined ? updates.imageUrl : null,
      updates.originHistory !== undefined ? updates.originHistory : null,
      updates.originSource !== undefined ? updates.originSource : null,
      updates.approximatePriceBdt !== undefined ? updates.approximatePriceBdt : null,
      updates.dietaryType !== undefined ? updates.dietaryType : null,
      updates.isPublished !== undefined ? updates.isPublished : null,
      updates.ingredients !== undefined ? updates.ingredients : null,
    ];
    const res = await query(sql, params);
    return mapFoodRow(res.rows[0]);
  }

  async togglePublishFood(id: string, isPublished: boolean): Promise<Food> {
    const res = await query('UPDATE foods SET is_published = $2, updated_at = NOW() WHERE id = $1 RETURNING *', [
      id,
      isPublished,
    ]);
    if (res.rows.length === 0) throw new Error('Food record not found.');
    return mapFoodRow(res.rows[0]);
  }

  async deleteFood(id: string): Promise<boolean> {
    const res = await query('DELETE FROM foods WHERE id = $1', [id]);
    return (res.rowCount ?? 0) > 0;
  }

  // ----------------------------------------------------
  // Food Submissions
  // ----------------------------------------------------
  async getSubmissions(options: { userId?: string; status?: string; districtId?: string } = {}): Promise<FoodSubmission[]> {
    let sql = 'SELECT * FROM food_submissions WHERE 1=1';
    const params: any[] = [];
    let pIdx = 1;

    if (options.userId) {
      sql += ` AND user_id = $${pIdx++}`;
      params.push(options.userId);
    }
    if (options.status && options.status !== 'all') {
      sql += ` AND status = $${pIdx++}`;
      params.push(options.status);
    }
    if (options.districtId && options.districtId !== 'all') {
      sql += ` AND district_id = $${pIdx++}`;
      params.push(options.districtId);
    }

    sql += ' ORDER BY created_at DESC';
    const res = await query(sql, params);
    return res.rows.map(mapSubmissionRow);
  }

  async getSubmissionById(id: string): Promise<FoodSubmission | null> {
    const res = await query('SELECT * FROM food_submissions WHERE id = $1', [id]);
    if (res.rows.length === 0) return null;
    return mapSubmissionRow(res.rows[0]);
  }

  async createSubmission(sub: FoodSubmission): Promise<FoodSubmission> {
    const sql = `
      INSERT INTO food_submissions (
        id, name_en, name_bn, short_description, detailed_description,
        category_id, district_id, division_id, image_url, origin_history,
        origin_source, approximate_price_bdt, dietary_type, ingredients,
        accurate_info_confirmed, user_id, submitter_name, status,
        reviewed_by_user_id, reviewed_by_user_name, reviewed_at, admin_feedback,
        approved_food_id, edit_history, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)
      RETURNING *
    `;
    const params = [
      sub.id,
      sub.nameEn,
      sub.nameBn,
      sub.shortDescription,
      sub.detailedDescription || null,
      sub.category,
      sub.districtId,
      sub.divisionId,
      sub.imageUrl,
      sub.originHistory || null,
      sub.originSource || null,
      sub.approximatePriceBdt || 0,
      sub.dietaryType || 'non-veg',
      sub.ingredients || [],
      sub.accurateInfoConfirmed ?? true,
      sub.userId,
      sub.submitterName,
      sub.status || 'pending',
      sub.reviewedByUserId || null,
      sub.reviewedByUserName || null,
      sub.reviewedAt || null,
      sub.adminFeedback || null,
      sub.approvedFoodId || null,
      JSON.stringify(sub.editHistory || []),
      sub.createdAt || new Date().toISOString(),
      sub.updatedAt || new Date().toISOString(),
    ];
    const res = await query(sql, params);
    return mapSubmissionRow(res.rows[0]);
  }

  async updateSubmission(id: string, updates: Partial<FoodSubmission>): Promise<FoodSubmission> {
    const existing = await this.getSubmissionById(id);
    if (!existing) throw new Error('Submission not found.');

    const sql = `
      UPDATE food_submissions
      SET name_en = COALESCE($2, name_en),
          name_bn = COALESCE($3, name_bn),
          short_description = COALESCE($4, short_description),
          detailed_description = COALESCE($5, detailed_description),
          category_id = COALESCE($6, category_id),
          district_id = COALESCE($7, district_id),
          division_id = COALESCE($8, division_id),
          image_url = COALESCE($9, image_url),
          origin_history = COALESCE($10, origin_history),
          origin_source = COALESCE($11, origin_source),
          approximate_price_bdt = COALESCE($12, approximate_price_bdt),
          dietary_type = COALESCE($13, dietary_type),
          ingredients = COALESCE($14, ingredients),
          edit_history = COALESCE($15, edit_history),
          updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    const params = [
      id,
      updates.nameEn !== undefined ? updates.nameEn : null,
      updates.nameBn !== undefined ? updates.nameBn : null,
      updates.shortDescription !== undefined ? updates.shortDescription : null,
      updates.detailedDescription !== undefined ? updates.detailedDescription : null,
      updates.category !== undefined ? updates.category : null,
      updates.districtId !== undefined ? updates.districtId : null,
      updates.divisionId !== undefined ? updates.divisionId : null,
      updates.imageUrl !== undefined ? updates.imageUrl : null,
      updates.originHistory !== undefined ? updates.originHistory : null,
      updates.originSource !== undefined ? updates.originSource : null,
      updates.approximatePriceBdt !== undefined ? updates.approximatePriceBdt : null,
      updates.dietaryType !== undefined ? updates.dietaryType : null,
      updates.ingredients !== undefined ? updates.ingredients : null,
      updates.editHistory !== undefined ? JSON.stringify(updates.editHistory) : null,
    ];
    const res = await query(sql, params);
    return mapSubmissionRow(res.rows[0]);
  }

  async reviewSubmission(
    id: string,
    review: {
      status: 'approved' | 'rejected';
      reviewedByUserId: string;
      reviewedByUserName: string;
      adminFeedback?: string;
      approvedFoodId?: string;
    }
  ): Promise<FoodSubmission> {
    const sql = `
      UPDATE food_submissions
      SET status = $2,
          reviewed_by_user_id = $3,
          reviewed_by_user_name = $4,
          reviewed_at = NOW(),
          admin_feedback = $5,
          approved_food_id = $6,
          updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    const params = [
      id,
      review.status,
      review.reviewedByUserId,
      review.reviewedByUserName,
      review.adminFeedback || null,
      review.approvedFoodId || null,
    ];
    const res = await query(sql, params);
    if (res.rows.length === 0) throw new Error('Submission not found.');
    return mapSubmissionRow(res.rows[0]);
  }

  // ----------------------------------------------------
  // User Food Tracking (Journey)
  // ----------------------------------------------------
  async getUserFoods(userId: string): Promise<UserFoodTracking[]> {
    const res = await query('SELECT * FROM user_foods WHERE user_id = $1 ORDER BY updated_at DESC', [userId]);
    return res.rows.map(mapUserFoodRow);
  }

  async getUserFood(userId: string, foodId: string): Promise<UserFoodTracking | null> {
    const res = await query('SELECT * FROM user_foods WHERE user_id = $1 AND food_id = $2', [userId, foodId]);
    if (res.rows.length === 0) return null;
    return mapUserFoodRow(res.rows[0]);
  }

  async upsertUserFood(tracking: UserFoodTracking): Promise<UserFoodTracking> {
    const sql = `
      INSERT INTO user_foods (id, user_id, food_id, status, tried_at, rating, notes, photo_url, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (user_id, food_id) DO UPDATE
      SET status = EXCLUDED.status,
          tried_at = EXCLUDED.tried_at,
          rating = EXCLUDED.rating,
          notes = EXCLUDED.notes,
          photo_url = EXCLUDED.photo_url,
          updated_at = NOW()
      RETURNING *
    `;
    const params = [
      tracking.id,
      tracking.userId,
      tracking.foodId,
      tracking.status,
      tracking.triedAt || null,
      tracking.rating || null,
      tracking.notes || null,
      tracking.photoUrl || null,
      tracking.updatedAt || new Date().toISOString(),
    ];
    const res = await query(sql, params);
    return mapUserFoodRow(res.rows[0]);
  }

  async deleteUserFood(userId: string, foodId: string): Promise<boolean> {
    const res = await query('DELETE FROM user_foods WHERE user_id = $1 AND food_id = $2', [userId, foodId]);
    return (res.rowCount ?? 0) > 0;
  }

  // ----------------------------------------------------
  // Reviews
  // ----------------------------------------------------
  async getReviews(foodId?: string): Promise<FoodReview[]> {
    let sql = `
      SELECT fr.*, p.name as user_name, p.avatar_url as user_avatar
      FROM food_reviews fr
      LEFT JOIN profiles p ON fr.user_id = p.id
    `;
    const params: any[] = [];
    if (foodId) {
      sql += ' WHERE fr.food_id = $1';
      params.push(foodId);
    }
    sql += ' ORDER BY fr.created_at DESC';
    const res = await query(sql, params);
    return res.rows.map(mapReviewRow);
  }

  async getReviewById(id: string): Promise<FoodReview | null> {
    const sql = `
      SELECT fr.*, p.name as user_name, p.avatar_url as user_avatar
      FROM food_reviews fr
      LEFT JOIN profiles p ON fr.user_id = p.id
      WHERE fr.id = $1
    `;
    const res = await query(sql, [id]);
    if (res.rows.length === 0) return null;
    return mapReviewRow(res.rows[0]);
  }

  async createReview(review: FoodReview): Promise<FoodReview> {
    const sql = `
      INSERT INTO food_reviews (id, user_id, food_id, rating, comment, created_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const params = [
      review.id,
      review.userId,
      review.foodId,
      review.rating,
      review.comment,
      review.createdAt || new Date().toISOString(),
    ];
    const res = await query(sql, params);
    const created = res.rows[0];
    return {
      id: created.id,
      userId: created.user_id,
      userName: review.userName,
      userAvatar: review.userAvatar,
      foodId: created.food_id,
      rating: Number(created.rating),
      comment: created.comment,
      createdAt: created.created_at ? new Date(created.created_at).toISOString() : new Date().toISOString(),
    };
  }

  async deleteReview(id: string): Promise<boolean> {
    const res = await query('DELETE FROM food_reviews WHERE id = $1', [id]);
    return (res.rowCount ?? 0) > 0;
  }

  // ----------------------------------------------------
  // Achievements
  // ----------------------------------------------------
  async getAchievements(): Promise<Achievement[]> {
    const res = await query('SELECT * FROM achievements ORDER BY id ASC');
    return res.rows.map(mapAchievementRow);
  }

  // ----------------------------------------------------
  // Reports
  // ----------------------------------------------------
  async getReports(): Promise<ReportItem[]> {
    const res = await query('SELECT * FROM reports ORDER BY created_at DESC');
    return res.rows.map(mapReportRow);
  }

  async createReport(report: ReportItem): Promise<ReportItem> {
    const sql = `
      INSERT INTO reports (id, reporter_user_id, food_id, reason, status, created_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const params = [
      report.id,
      report.reporterUserId,
      report.foodId || null,
      report.reason,
      report.status || 'pending',
      report.createdAt || new Date().toISOString(),
    ];
    const res = await query(sql, params);
    return mapReportRow(res.rows[0]);
  }

  async updateReportStatus(id: string, status: 'reviewed' | 'dismissed'): Promise<ReportItem> {
    const res = await query('UPDATE reports SET status = $2 WHERE id = $1 RETURNING *', [id, status]);
    if (res.rows.length === 0) throw new Error('Report not found.');
    return mapReportRow(res.rows[0]);
  }

  // ----------------------------------------------------
  // Audit Logs
  // ----------------------------------------------------
  async getAuditLogs(limit: number = 50): Promise<AuditLog[]> {
    const res = await query('SELECT * FROM admin_audit_logs ORDER BY created_at DESC LIMIT $1', [limit]);
    return res.rows.map(mapAuditLogRow);
  }

  async logAudit(log: Omit<AuditLog, 'id' | 'createdAt'>): Promise<AuditLog> {
    const id = 'audit_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
    const createdAt = new Date().toISOString();
    const sql = `
      INSERT INTO admin_audit_logs (id, action, entity_type, entity_id, user_id, user_name, details, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    const params = [
      id,
      log.action,
      log.entityType,
      log.entityId,
      log.userId || null,
      log.userName || 'System',
      log.details || '',
      createdAt,
    ];
    const res = await query(sql, params);
    return mapAuditLogRow(res.rows[0]);
  }

  // ----------------------------------------------------
  // Platform Stats & Overview
  // ----------------------------------------------------
  async getPlatformStats(): Promise<PlatformStats> {
    const sql = `
      SELECT
        (SELECT COUNT(*)::int FROM districts) as total_districts,
        (SELECT COUNT(*)::int FROM divisions) as total_divisions,
        (SELECT COUNT(*)::int FROM foods WHERE is_published = true) as total_foods,
        (SELECT COUNT(*)::int FROM user_foods WHERE status = 'tried') as total_tried,
        (SELECT COUNT(DISTINCT user_id)::int FROM user_foods) as active_foodies
    `;
    const res = await query(sql);
    const r = res.rows[0] || {};
    return {
      totalDistricts: Number(r.total_districts || 64),
      totalDivisions: Number(r.total_divisions || 8),
      totalFoods: Number(r.total_foods || 0),
      totalTriedByUsers: Number(r.total_tried || 0),
      activeFoodiesCount: Number(r.active_foodies || 0),
    };
  }

  async getAdminOverview(): Promise<{
    totalFoods: number;
    publishedFoods: number;
    draftFoods: number;
    totalDistrictsCovered: number;
    totalUsers: number;
    totalReviews: number;
    pendingSubmissionsCount: number;
    totalSubmissionsCount: number;
    totalReportsCount: number;
  }> {
    const sql = `
      SELECT
        (SELECT COUNT(*)::int FROM foods) as total_foods,
        (SELECT COUNT(*)::int FROM foods WHERE is_published = true) as published_foods,
        (SELECT COUNT(*)::int FROM foods WHERE is_published = false) as draft_foods,
        (SELECT COUNT(DISTINCT district_id)::int FROM foods WHERE is_published = true) as districts_covered,
        (SELECT COUNT(*)::int FROM profiles) as total_users,
        (SELECT COUNT(*)::int FROM food_reviews) as total_reviews,
        (SELECT COUNT(*)::int FROM food_submissions WHERE status = 'pending') as pending_submissions,
        (SELECT COUNT(*)::int FROM food_submissions) as total_submissions,
        (SELECT COUNT(*)::int FROM reports WHERE status = 'pending') as total_reports
    `;
    const res = await query(sql);
    const r = res.rows[0] || {};
    return {
      totalFoods: Number(r.total_foods || 0),
      publishedFoods: Number(r.published_foods || 0),
      draftFoods: Number(r.draft_foods || 0),
      totalDistrictsCovered: Number(r.districts_covered || 0),
      totalUsers: Number(r.total_users || 0),
      totalReviews: Number(r.total_reviews || 0),
      pendingSubmissionsCount: Number(r.pending_submissions || 0),
      totalSubmissionsCount: Number(r.total_submissions || 0),
      totalReportsCount: Number(r.total_reports || 0),
    };
  }
}

export const postgresDal = new PostgresDataAccessLayer();
