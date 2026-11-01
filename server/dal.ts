import 'dotenv/config';
import { db, DbUser, ReportItem } from './db';
import { postgresDal } from './postgresDal';
import {
  Division,
  District,
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

/**
 * Checks whether PostgreSQL connection is configured via DATABASE_URL.
 */
export function isPostgresActive(): boolean {
  return Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.trim().length > 0);
}

/**
 * Validates database environment configuration.
 * Enforces strictly that in production, DATABASE_URL is present and pointing to PostgreSQL / Supabase.
 * Local JSON file persistence fallback is strictly disabled in production.
 */
export function validateDatabaseConfig(): void {
  const isProd = process.env.NODE_ENV === 'production';
  const hasDbUrl = isPostgresActive();

  if (isProd && !hasDbUrl) {
    throw new Error(
      '[DATABASE FATAL]: Production environment requires a valid DATABASE_URL connecting to Supabase PostgreSQL. Local JSON persistence fallback is strictly prohibited in production.'
    );
  }
}

/**
 * JSON-backed Data Access Layer (used strictly for offline development and local regression testing).
 */
class JsonDataAccessLayer {
  async getDivisions(): Promise<Division[]> {
    return db.getSchema().divisions;
  }

  async getDistricts(): Promise<(District & { foodsCount: number })[]> {
    const schema = db.getSchema();
    return schema.districts.map((d) => ({
      ...d,
      foodsCount: schema.foods.filter((f) => f.districtId === d.id && f.isPublished).length,
    }));
  }

  async getDistrictById(id: string): Promise<(District & { foodsCount: number }) | null> {
    const schema = db.getSchema();
    const d = schema.districts.find((x) => x.id === id);
    if (!d) return null;
    return {
      ...d,
      foodsCount: schema.foods.filter((f) => f.districtId === d.id && f.isPublished).length,
    };
  }

  async getCategories(): Promise<CategoryInfo[]> {
    return db.getSchema().categories;
  }

  async getUserById(id: string): Promise<DbUser | null> {
    return db.getSchema().users.find((u) => u.id === id) || null;
  }

  async getUserByEmail(email: string): Promise<DbUser | null> {
    const clean = email.trim().toLowerCase();
    return db.getSchema().users.find((u) => u.email.toLowerCase() === clean) || null;
  }

  async getAllUsers(): Promise<UserProfile[]> {
    return db.getSchema().users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      avatarUrl: u.avatarUrl,
      homeDistrictId: u.homeDistrictId,
      bio: u.bio,
      createdAt: u.createdAt,
    }));
  }

  async hasAdmin(): Promise<boolean> {
    return db.getSchema().users.some((u) => u.role === 'admin');
  }

  async createUser(user: DbUser): Promise<DbUser> {
    db.getSchema().users.push(user);
    db.save();
    return user;
  }

  async updateUserProfile(id: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    const user = db.getSchema().users.find((u) => u.id === id);
    if (!user) throw new Error('User not found.');
    if (updates.name !== undefined) user.name = updates.name.trim();
    if (updates.avatarUrl !== undefined) user.avatarUrl = updates.avatarUrl.trim() || undefined;
    if (updates.homeDistrictId !== undefined) user.homeDistrictId = updates.homeDistrictId || undefined;
    if (updates.bio !== undefined) user.bio = updates.bio.trim() || undefined;
    db.save();
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
      homeDistrictId: user.homeDistrictId,
      bio: user.bio,
      createdAt: user.createdAt,
    };
  }

  async updateUserPassword(id: string, passwordHash: string, salt: string): Promise<boolean> {
    const user = db.getSchema().users.find((u) => u.id === id);
    if (!user) return false;
    user.passwordHash = passwordHash;
    user.salt = salt;
    db.save();
    return true;
  }

  async updateUserRole(id: string, role: 'admin' | 'user'): Promise<UserProfile> {
    const user = db.getSchema().users.find((u) => u.id === id);
    if (!user) throw new Error('User not found.');
    user.role = role;
    db.save();
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
      homeDistrictId: user.homeDistrictId,
      bio: user.bio,
      createdAt: user.createdAt,
    };
  }

  async getFoods(options: {
    divisionId?: string;
    districtId?: string;
    category?: string;
    dietary?: string;
    search?: string;
    includeDrafts?: boolean;
  } = {}): Promise<Food[]> {
    let list = db.getSchema().foods;
    if (!options.includeDrafts) {
      list = list.filter((f) => f.isPublished);
    }
    if (options.divisionId && options.divisionId !== 'all') {
      list = list.filter((f) => f.divisionId === options.divisionId);
    }
    if (options.districtId && options.districtId !== 'all') {
      list = list.filter((f) => f.districtId === options.districtId);
    }
    if (options.category && options.category !== 'all') {
      list = list.filter((f) => f.category === options.category);
    }
    if (options.dietary && options.dietary !== 'all') {
      list = list.filter((f) => f.dietaryType === options.dietary);
    }
    if (options.search && options.search.trim()) {
      const q = options.search.trim().toLowerCase();
      list = list.filter(
        (f) =>
          f.nameEn.toLowerCase().includes(q) ||
          f.nameBn.includes(q) ||
          f.shortDescription.toLowerCase().includes(q)
      );
    }
    return list;
  }

  async getFoodById(id: string): Promise<Food | null> {
    return db.getSchema().foods.find((f) => f.id === id) || null;
  }

  async createFood(food: Food): Promise<Food> {
    db.getSchema().foods.unshift(food);
    db.save();
    return food;
  }

  async updateFood(id: string, updates: Partial<Food>): Promise<Food> {
    const list = db.getSchema().foods;
    const idx = list.findIndex((f) => f.id === id);
    if (idx === -1) throw new Error('Food not found.');
    list[idx] = {
      ...list[idx],
      ...updates,
      id: list[idx].id,
      updatedAt: new Date().toISOString(),
    };
    db.save();
    return list[idx];
  }

  async togglePublishFood(id: string, isPublished: boolean): Promise<Food> {
    return this.updateFood(id, { isPublished });
  }

  async deleteFood(id: string): Promise<boolean> {
    const schema = db.getSchema();
    const lenBefore = schema.foods.length;
    schema.foods = schema.foods.filter((f) => f.id !== id);
    db.save();
    return schema.foods.length < lenBefore;
  }

  async getSubmissions(options: { userId?: string; status?: string; districtId?: string } = {}): Promise<FoodSubmission[]> {
    let list = db.getSchema().foodSubmissions || [];
    if (options.userId) {
      list = list.filter((s) => s.userId === options.userId);
    }
    if (options.status && options.status !== 'all') {
      list = list.filter((s) => s.status === options.status);
    }
    if (options.districtId && options.districtId !== 'all') {
      list = list.filter((s) => s.districtId === options.districtId);
    }
    return list;
  }

  async getSubmissionById(id: string): Promise<FoodSubmission | null> {
    const list = db.getSchema().foodSubmissions || [];
    return list.find((s) => s.id === id) || null;
  }

  async createSubmission(sub: FoodSubmission): Promise<FoodSubmission> {
    const schema = db.getSchema();
    schema.foodSubmissions = schema.foodSubmissions || [];
    schema.foodSubmissions.unshift(sub);
    db.save();
    return sub;
  }

  async updateSubmission(id: string, updates: Partial<FoodSubmission>): Promise<FoodSubmission> {
    const schema = db.getSchema();
    schema.foodSubmissions = schema.foodSubmissions || [];
    const idx = schema.foodSubmissions.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error('Submission not found.');
    schema.foodSubmissions[idx] = {
      ...schema.foodSubmissions[idx],
      ...updates,
      id: schema.foodSubmissions[idx].id,
      updatedAt: new Date().toISOString(),
    };
    db.save();
    return schema.foodSubmissions[idx];
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
    return this.updateSubmission(id, {
      status: review.status,
      reviewedByUserId: review.reviewedByUserId,
      reviewedByUserName: review.reviewedByUserName,
      reviewedAt: new Date().toISOString(),
      adminFeedback: review.adminFeedback,
      approvedFoodId: review.approvedFoodId,
    });
  }

  async getUserFoods(userId: string): Promise<UserFoodTracking[]> {
    const list = db.getSchema().userFoods || [];
    return list.filter((uf) => uf.userId === userId);
  }

  async getUserFood(userId: string, foodId: string): Promise<UserFoodTracking | null> {
    const list = db.getSchema().userFoods || [];
    return list.find((uf) => uf.userId === userId && uf.foodId === foodId) || null;
  }

  async upsertUserFood(tracking: UserFoodTracking): Promise<UserFoodTracking> {
    const schema = db.getSchema();
    schema.userFoods = schema.userFoods || [];
    const idx = schema.userFoods.findIndex(
      (uf) => uf.userId === tracking.userId && uf.foodId === tracking.foodId
    );
    if (idx >= 0) {
      schema.userFoods[idx] = {
        ...schema.userFoods[idx],
        ...tracking,
        id: schema.userFoods[idx].id,
        updatedAt: new Date().toISOString(),
      };
      db.save();
      return schema.userFoods[idx];
    } else {
      schema.userFoods.push(tracking);
      db.save();
      return tracking;
    }
  }

  async deleteUserFood(userId: string, foodId: string): Promise<boolean> {
    const schema = db.getSchema();
    schema.userFoods = schema.userFoods || [];
    const lenBefore = schema.userFoods.length;
    schema.userFoods = schema.userFoods.filter(
      (uf) => !(uf.userId === userId && uf.foodId === foodId)
    );
    db.save();
    return schema.userFoods.length < lenBefore;
  }

  async getReviews(foodId?: string): Promise<FoodReview[]> {
    let list = db.getSchema().foodReviews || [];
    if (foodId) {
      list = list.filter((r) => r.foodId === foodId);
    }
    return list;
  }

  async getReviewById(id: string): Promise<FoodReview | null> {
    const list = db.getSchema().foodReviews || [];
    return list.find((r) => r.id === id) || null;
  }

  async createReview(review: FoodReview): Promise<FoodReview> {
    const schema = db.getSchema();
    schema.foodReviews = schema.foodReviews || [];
    schema.foodReviews.unshift(review);
    db.save();
    return review;
  }

  async deleteReview(id: string): Promise<boolean> {
    const schema = db.getSchema();
    schema.foodReviews = schema.foodReviews || [];
    const lenBefore = schema.foodReviews.length;
    schema.foodReviews = schema.foodReviews.filter((r) => r.id !== id);
    db.save();
    return schema.foodReviews.length < lenBefore;
  }

  async getAchievements(): Promise<Achievement[]> {
    return db.getSchema().achievements || [];
  }

  async getReports(): Promise<ReportItem[]> {
    return db.getSchema().reports || [];
  }

  async createReport(report: ReportItem): Promise<ReportItem> {
    const schema = db.getSchema();
    schema.reports = schema.reports || [];
    schema.reports.unshift(report);
    db.save();
    return report;
  }

  async updateReportStatus(id: string, status: 'reviewed' | 'dismissed'): Promise<ReportItem> {
    const schema = db.getSchema();
    schema.reports = schema.reports || [];
    const item = schema.reports.find((r) => r.id === id);
    if (!item) throw new Error('Report not found.');
    item.status = status;
    db.save();
    return item;
  }

  async getAuditLogs(limit: number = 50): Promise<AuditLog[]> {
    const list = db.getSchema().auditLogs || [];
    return list.slice(0, limit);
  }

  async logAudit(log: Omit<AuditLog, 'id' | 'createdAt'>): Promise<AuditLog> {
    const entry: AuditLog = {
      ...log,
      id: 'audit_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      createdAt: new Date().toISOString(),
    };
    const schema = db.getSchema();
    schema.auditLogs = schema.auditLogs || [];
    schema.auditLogs.unshift(entry);
    db.save();
    return entry;
  }

  async getPlatformStats(): Promise<PlatformStats> {
    const schema = db.getSchema();
    const userFoods = schema.userFoods || [];
    const activeFoodies = new Set(userFoods.map((uf) => uf.userId));
    return {
      totalDistricts: schema.districts.length,
      totalDivisions: schema.divisions.length,
      totalFoods: schema.foods.filter((f) => f.isPublished).length,
      totalTriedByUsers: userFoods.filter((uf) => uf.status === 'tried').length,
      activeFoodiesCount: activeFoodies.size,
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
    const schema = db.getSchema();
    const foods = schema.foods;
    const published = foods.filter((f) => f.isPublished);
    const drafts = foods.filter((f) => !f.isPublished);
    const coveredDistricts = new Set(published.map((f) => f.districtId));
    const submissions = schema.foodSubmissions || [];

    return {
      totalFoods: foods.length,
      publishedFoods: published.length,
      draftFoods: drafts.length,
      totalDistrictsCovered: coveredDistricts.size,
      totalUsers: schema.users.length,
      totalReviews: (schema.foodReviews || []).length,
      pendingSubmissionsCount: submissions.filter((s) => s.status === 'pending').length,
      totalSubmissionsCount: submissions.length,
      totalReportsCount: (schema.reports || []).length,
    };
  }
}

const jsonDal = new JsonDataAccessLayer();

/**
 * Unified Data Access Layer (DAL) Dispatcher.
 * Automatically selects PostgreSQL when DATABASE_URL is available,
 * and refuses silent local fallback in production.
 */
class UnifiedDataAccessLayer {
  private get backend() {
    if (isPostgresActive()) {
      return postgresDal;
    }
    return jsonDal;
  }

  public get activeProvider(): 'supabase_postgres' | 'local_json' {
    return isPostgresActive() ? 'supabase_postgres' : 'local_json';
  }

  // Divisions & Districts & Categories
  async getDivisions(): Promise<Division[]> {
    return this.backend.getDivisions();
  }

  async getDistricts(): Promise<(District & { foodsCount: number })[]> {
    return this.backend.getDistricts();
  }

  async getDistrictById(id: string): Promise<(District & { foodsCount: number }) | null> {
    return this.backend.getDistrictById(id);
  }

  async getCategories(): Promise<CategoryInfo[]> {
    return this.backend.getCategories();
  }

  // Users & Auth
  async getUserById(id: string): Promise<DbUser | null> {
    return this.backend.getUserById(id);
  }

  async getUserByEmail(email: string): Promise<DbUser | null> {
    return this.backend.getUserByEmail(email);
  }

  async getAllUsers(): Promise<UserProfile[]> {
    return this.backend.getAllUsers();
  }

  async hasAdmin(): Promise<boolean> {
    return this.backend.hasAdmin();
  }

  async createUser(user: DbUser): Promise<DbUser> {
    return this.backend.createUser(user);
  }

  async updateUserProfile(id: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    return this.backend.updateUserProfile(id, updates);
  }

  async updateUserPassword(id: string, passwordHash: string, salt: string): Promise<boolean> {
    return this.backend.updateUserPassword(id, passwordHash, salt);
  }

  async updateUserRole(id: string, role: 'admin' | 'user'): Promise<UserProfile> {
    return this.backend.updateUserRole(id, role);
  }

  // Foods
  async getFoods(options?: {
    divisionId?: string;
    districtId?: string;
    category?: string;
    dietary?: string;
    search?: string;
    includeDrafts?: boolean;
  }): Promise<Food[]> {
    return this.backend.getFoods(options);
  }

  async getFoodById(id: string): Promise<Food | null> {
    return this.backend.getFoodById(id);
  }

  async createFood(food: Food): Promise<Food> {
    return this.backend.createFood(food);
  }

  async updateFood(id: string, updates: Partial<Food>): Promise<Food> {
    return this.backend.updateFood(id, updates);
  }

  async togglePublishFood(id: string, isPublished: boolean): Promise<Food> {
    return this.backend.togglePublishFood(id, isPublished);
  }

  async deleteFood(id: string): Promise<boolean> {
    return this.backend.deleteFood(id);
  }

  // Food Submissions
  async getSubmissions(options?: { userId?: string; status?: string; districtId?: string }): Promise<FoodSubmission[]> {
    return this.backend.getSubmissions(options);
  }

  async getSubmissionById(id: string): Promise<FoodSubmission | null> {
    return this.backend.getSubmissionById(id);
  }

  async createSubmission(sub: FoodSubmission): Promise<FoodSubmission> {
    return this.backend.createSubmission(sub);
  }

  async updateSubmission(id: string, updates: Partial<FoodSubmission>): Promise<FoodSubmission> {
    return this.backend.updateSubmission(id, updates);
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
    return this.backend.reviewSubmission(id, review);
  }

  // User Foods (Journey)
  async getUserFoods(userId: string): Promise<UserFoodTracking[]> {
    return this.backend.getUserFoods(userId);
  }

  async getUserFood(userId: string, foodId: string): Promise<UserFoodTracking | null> {
    return this.backend.getUserFood(userId, foodId);
  }

  async upsertUserFood(tracking: UserFoodTracking): Promise<UserFoodTracking> {
    return this.backend.upsertUserFood(tracking);
  }

  async deleteUserFood(userId: string, foodId: string): Promise<boolean> {
    return this.backend.deleteUserFood(userId, foodId);
  }

  // Reviews
  async getReviews(foodId?: string): Promise<FoodReview[]> {
    return this.backend.getReviews(foodId);
  }

  async getReviewById(id: string): Promise<FoodReview | null> {
    return this.backend.getReviewById(id);
  }

  async createReview(review: FoodReview): Promise<FoodReview> {
    return this.backend.createReview(review);
  }

  async deleteReview(id: string): Promise<boolean> {
    return this.backend.deleteReview(id);
  }

  // Achievements
  async getAchievements(): Promise<Achievement[]> {
    return this.backend.getAchievements();
  }

  // Reports
  async getReports(): Promise<ReportItem[]> {
    return this.backend.getReports();
  }

  async createReport(report: ReportItem): Promise<ReportItem> {
    return this.backend.createReport(report);
  }

  async updateReportStatus(id: string, status: 'reviewed' | 'dismissed'): Promise<ReportItem> {
    return this.backend.updateReportStatus(id, status);
  }

  // Audit Logs
  async getAuditLogs(limit?: number): Promise<AuditLog[]> {
    return this.backend.getAuditLogs(limit);
  }

  async logAudit(log: Omit<AuditLog, 'id' | 'createdAt'>): Promise<AuditLog> {
    return this.backend.logAudit(log);
  }

  // Stats & Overview
  async getPlatformStats(): Promise<PlatformStats> {
    return this.backend.getPlatformStats();
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
    return this.backend.getAdminOverview();
  }
}

export const dal = new UnifiedDataAccessLayer();
