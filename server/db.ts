import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { DIVISIONS, DISTRICTS, FOOD_CATEGORIES } from '../src/data/divisionsAndDistricts';
import { SEED_FOODS } from '../src/data/seedFoods';
import { SYSTEM_ACHIEVEMENTS } from '../src/data/achievements';
import { Food, FoodSubmission, UserProfile, UserFoodTracking, FoodReview, AuditLog } from '../src/types';

export interface DbUser extends UserProfile {
  passwordHash: string;
  salt: string;
}

export interface ReportItem {
  id: string;
  reporterUserId: string;
  foodId?: string;
  reason: string;
  status: 'pending' | 'reviewed' | 'dismissed';
  createdAt: string;
}

export interface DatabaseSchema {
  users: DbUser[];
  divisions: typeof DIVISIONS;
  districts: typeof DISTRICTS;
  categories: typeof FOOD_CATEGORIES;
  foods: Food[];
  foodSubmissions: FoodSubmission[];
  userFoods: UserFoodTracking[];
  foodReviews: FoodReview[];
  achievements: typeof SYSTEM_ACHIEVEMENTS;
  reports: ReportItem[];
  auditLogs: AuditLog[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'foodie_bd.json');

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

export function createPasswordRecord(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = hashPassword(password, salt);
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const calculated = hashPassword(password, salt);
  return crypto.timingSafeEqual(Buffer.from(calculated, 'hex'), Buffer.from(hash, 'hex'));
}

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.init();
  }

  private init(): DatabaseSchema {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(fileContent);
        // Ensure all required collections exist
        parsed.divisions = DIVISIONS;
        parsed.districts = DISTRICTS;
        parsed.categories = FOOD_CATEGORIES;
        if (!parsed.foods || parsed.foods.length === 0) parsed.foods = SEED_FOODS;
        if (!parsed.foodSubmissions) parsed.foodSubmissions = [];
        if (!parsed.userFoods) parsed.userFoods = [];
        if (!parsed.foodReviews) parsed.foodReviews = [];
        if (!parsed.achievements) parsed.achievements = SYSTEM_ACHIEVEMENTS;
        if (!parsed.reports) parsed.reports = [];
        if (!parsed.auditLogs) parsed.auditLogs = [];
        return parsed;
      } catch (err) {
        console.error('Error reading db file, re-initializing database:', err);
      }
    }

    // Initialize with verified seeds
    const adminPass = createPasswordRecord('AdminPass123!');
    const demoUserPass = createPasswordRecord('Foodie123!');

    const initialUsers: DbUser[] = [
      {
        id: 'user_admin_01',
        name: 'Foodie BD Admin',
        email: 'admin@foodiebd.com',
        role: 'admin',
        passwordHash: adminPass.hash,
        salt: adminPass.salt,
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        homeDistrictId: 'dhaka',
        bio: 'Head curator of Foodie BD culinary preservation registry.',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'user_demo_01',
        name: 'Tanvir Hossain',
        email: 'foodie@example.com',
        role: 'user',
        passwordHash: demoUserPass.hash,
        salt: demoUserPass.salt,
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
        homeDistrictId: 'chattogram',
        bio: 'Passionate food explorer on a mission to taste all 64 districts!',
        createdAt: new Date().toISOString(),
      },
    ];

    const initialUserFoods: UserFoodTracking[] = [
      {
        id: 'uf_01',
        userId: 'user_demo_01',
        foodId: 'food_dhaka_kacchi',
        status: 'tried',
        triedAt: '2025-01-10T14:30:00.000Z',
        rating: 5,
        notes: 'Unbelievably tender mutton with melt-in-the-mouth potato. The aroma of saffron and ghee is unbeatable!',
        photoUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80',
        updatedAt: '2025-01-10T14:30:00.000Z',
      },
      {
        id: 'uf_02',
        userId: 'user_demo_01',
        foodId: 'food_ctg_kala_bhuna',
        status: 'tried',
        triedAt: '2025-01-12T20:00:00.000Z',
        rating: 5,
        notes: 'Smoky, intensely spiced beef with crisp outer bark. Best with hot tandoori ruti.',
        photoUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80',
        updatedAt: '2025-01-12T20:00:00.000Z',
      },
      {
        id: 'uf_03',
        userId: 'user_demo_01',
        foodId: 'food_bogura_doi',
        status: 'tried',
        triedAt: '2025-01-15T16:00:00.000Z',
        rating: 5,
        notes: 'Pure heaven in an earthen cup. Caramelized sweetness without any artificial aftertaste.',
        updatedAt: '2025-01-15T16:00:00.000Z',
      },
      {
        id: 'uf_04',
        userId: 'user_demo_01',
        foodId: 'food_cumilla_rasmalai',
        status: 'want_to_try',
        updatedAt: '2025-01-16T10:00:00.000Z',
      },
      {
        id: 'uf_05',
        userId: 'user_demo_01',
        foodId: 'food_khulna_chui_jhal',
        status: 'want_to_try',
        updatedAt: '2025-01-16T11:00:00.000Z',
      },
    ];

    const initialReviews: FoodReview[] = [
      {
        id: 'rev_01',
        userId: 'user_demo_01',
        userName: 'Tanvir Hossain',
        userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
        foodId: 'food_dhaka_kacchi',
        rating: 5,
        comment: 'Authentic Old Dhaka kacchi biryani has a distinct richness you simply cannot replicate anywhere else.',
        createdAt: '2025-01-10T15:00:00.000Z',
      },
      {
        id: 'rev_02',
        userId: 'user_demo_01',
        userName: 'Tanvir Hossain',
        userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
        foodId: 'food_ctg_kala_bhuna',
        rating: 5,
        comment: 'Spices cling to the meat perfectly. An absolute must-eat when visiting Chittagong.',
        createdAt: '2025-01-12T20:15:00.000Z',
      },
    ];

    const initialAudit: AuditLog[] = [
      {
        id: 'audit_01',
        action: 'INITIALIZE_SYSTEM',
        entityType: 'SYSTEM',
        entityId: 'seed',
        userId: 'user_admin_01',
        userName: 'Foodie BD Admin',
        details: 'Initial database bootstrap with verified 8 divisions, 64 districts, and core culinary catalog.',
        createdAt: new Date().toISOString(),
      },
    ];

    const schema: DatabaseSchema = {
      users: initialUsers,
      divisions: DIVISIONS,
      districts: DISTRICTS,
      categories: FOOD_CATEGORIES,
      foods: SEED_FOODS,
      foodSubmissions: [],
      userFoods: initialUserFoods,
      foodReviews: initialReviews,
      achievements: SYSTEM_ACHIEVEMENTS,
      reports: [],
      auditLogs: initialAudit,
    };

    fs.writeFileSync(DB_FILE, JSON.stringify(schema, null, 2), 'utf-8');
    return schema;
  }

  public save(): void {
    fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
  }

  public getSchema(): DatabaseSchema {
    return this.data;
  }

  public logAudit(log: Omit<AuditLog, 'id' | 'createdAt'>): void {
    const entry: AuditLog = {
      ...log,
      id: 'audit_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      createdAt: new Date().toISOString(),
    };
    this.data.auditLogs.unshift(entry);
    this.save();
  }
}

export const db = new Database();
