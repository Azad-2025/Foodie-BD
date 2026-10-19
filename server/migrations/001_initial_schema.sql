-- ====================================================================
-- Foodie BD (খাদক ম্যাপ) Database Schema Migration 001
-- Target: PostgreSQL / Supabase
-- Description: Core relational schema, constraints, indexes & RLS
-- ====================================================================
--
-- ARCHITECTURE & SECURITY NOTICE:
-- Foodie BD uses server-side HMAC-SHA256 JWT authentication with application-managed
-- user IDs (e.g. 'user_admin_01', 'user_...') stored in VARCHAR(100) columns.
--
-- 1. BACKEND ACCESS: The Express API server connects as the database owner
--    ('postgres') via DATABASE_URL using connection pooling (pg.Pool). In PostgreSQL,
--    the database owner bypasses Row Level Security (RLS) by default, enabling
--    the server-side DAL to perform authorized operations.
--
-- 2. APPLICATION CONTROLS: All authentication (scrypt password hashing with unique
--    salts), JWT verification, role verification (requireAdmin), input validation,
--    and immutable audit logging are strictly enforced by the Express backend.
--
-- 3. DEFENSE-IN-DEPTH (PostgREST / Direct Client Access):
--    - Public reference tables (divisions, districts, categories, published foods,
--      reviews, achievements) permit public read-only (SELECT) access.
--    - Sensitive tables (profiles, user_foods, admin_audit_logs) have RLS enabled
--      with NO public policies, preventing anonymous or unauthenticated PostgREST
--      clients from harvesting password hashes, salts, or private user data.
-- ====================================================================

-- 1. Enum Types (Safe & Idempotent)
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('guest', 'user', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE journey_status AS ENUM ('want_to_try', 'tried');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE dietary_type AS ENUM ('non-veg', 'veg', 'sweet');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Divisions Table (8 Divisions of Bangladesh)
CREATE TABLE IF NOT EXISTS divisions (
    id VARCHAR(50) PRIMARY KEY,
    name_en VARCHAR(100) NOT NULL,
    name_bn VARCHAR(100) NOT NULL,
    capital_en VARCHAR(100) NOT NULL,
    capital_bn VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Districts Table (64 Districts of Bangladesh)
CREATE TABLE IF NOT EXISTS districts (
    id VARCHAR(50) PRIMARY KEY,
    division_id VARCHAR(50) NOT NULL REFERENCES divisions(id) ON DELETE CASCADE,
    name_en VARCHAR(100) NOT NULL,
    name_bn VARCHAR(100) NOT NULL,
    shape_name VARCHAR(100) NOT NULL UNIQUE, -- Stable identifier mapping to GeoJSON boundary
    lat NUMERIC(9, 6) NOT NULL,
    lng NUMERIC(9, 6) NOT NULL,
    prominent_dish_en VARCHAR(255) NOT NULL,
    prominent_dish_bn VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_districts_division ON districts(division_id);

-- 4. Food Categories Table
CREATE TABLE IF NOT EXISTS food_categories (
    id VARCHAR(50) PRIMARY KEY,
    name_en VARCHAR(100) NOT NULL,
    name_bn VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. User Profiles Table
-- NOTE: Stores application-managed user accounts with scrypt password hashes and salts.
-- Public PostgREST access is strictly forbidden by RLS to protect credentials.
CREATE TABLE IF NOT EXISTS profiles (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    salt VARCHAR(64) NOT NULL,
    role user_role DEFAULT 'user' NOT NULL,
    avatar_url TEXT,
    home_district_id VARCHAR(50) REFERENCES districts(id) ON DELETE SET NULL,
    bio TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- 6. Foods Table
CREATE TABLE IF NOT EXISTS foods (
    id VARCHAR(100) PRIMARY KEY,
    name_en VARCHAR(200) NOT NULL,
    name_bn VARCHAR(200) NOT NULL,
    short_description TEXT NOT NULL,
    detailed_description TEXT NOT NULL,
    category_id VARCHAR(50) NOT NULL REFERENCES food_categories(id) ON DELETE RESTRICT,
    district_id VARCHAR(50) NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
    division_id VARCHAR(50) NOT NULL REFERENCES divisions(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    origin_history TEXT,
    origin_source TEXT,
    approximate_price_bdt NUMERIC(10, 2) DEFAULT 0,
    dietary dietary_type DEFAULT 'non-veg',
    is_published BOOLEAN DEFAULT true NOT NULL,
    ingredients TEXT[] DEFAULT '{}',
    submission_id VARCHAR(100),
    submitted_by_user_id VARCHAR(100),
    submitted_by_user_name VARCHAR(150),
    approved_by_user_id VARCHAR(100),
    approved_by_user_name VARCHAR(150),
    approved_at TIMESTAMPTZ,
    verification_status VARCHAR(50) DEFAULT 'admin_created',
    research_status VARCHAR(50),
    citation_sources TEXT[] DEFAULT '{}',
    image_caption TEXT,
    image_attribution TEXT,
    image_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_foods_district ON foods(district_id);
CREATE INDEX IF NOT EXISTS idx_foods_division ON foods(division_id);
CREATE INDEX IF NOT EXISTS idx_foods_category ON foods(category_id);
CREATE INDEX IF NOT EXISTS idx_foods_published ON foods(is_published);

-- 7. User Foods / Food Journey Tracking
CREATE TABLE IF NOT EXISTS user_foods (
    id VARCHAR(100) PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    food_id VARCHAR(100) NOT NULL REFERENCES foods(id) ON DELETE CASCADE,
    status journey_status NOT NULL,
    tried_at TIMESTAMPTZ,
    rating SMALLINT CHECK (rating >= 1 AND rating <= 5),
    notes TEXT,
    photo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_user_food UNIQUE(user_id, food_id)
);

CREATE INDEX IF NOT EXISTS idx_user_foods_user ON user_foods(user_id);
CREATE INDEX IF NOT EXISTS idx_user_foods_status ON user_foods(user_id, status);

-- 8. Food Reviews
CREATE TABLE IF NOT EXISTS food_reviews (
    id VARCHAR(100) PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    food_id VARCHAR(100) NOT NULL REFERENCES foods(id) ON DELETE CASCADE,
    rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_food_reviews_food ON food_reviews(food_id);

-- 9. Achievements Definition Table
CREATE TABLE IF NOT EXISTS achievements (
    id VARCHAR(50) PRIMARY KEY,
    title_en VARCHAR(150) NOT NULL,
    title_bn VARCHAR(150) NOT NULL,
    description_en TEXT NOT NULL,
    description_bn TEXT NOT NULL,
    icon VARCHAR(50) NOT NULL,
    category VARCHAR(50) NOT NULL,
    threshold INT NOT NULL DEFAULT 1
);

-- 10. Admin Audit Logs Table
CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id VARCHAR(100) PRIMARY KEY,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    user_id VARCHAR(100) REFERENCES profiles(id) ON DELETE SET NULL,
    user_name VARCHAR(150) NOT NULL,
    details TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON admin_audit_logs(created_at DESC);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

-- A. Public Read-Only Reference Tables
-- Anyone can view divisions, districts, categories, published foods, reviews, and achievements.
-- Direct PostgREST mutations (INSERT/UPDATE/DELETE) are blocked.

ALTER TABLE divisions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view divisions" ON divisions;
CREATE POLICY "Public can view divisions" ON divisions FOR SELECT USING (true);

ALTER TABLE districts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view districts" ON districts;
CREATE POLICY "Public can view districts" ON districts FOR SELECT USING (true);

ALTER TABLE food_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view food categories" ON food_categories;
CREATE POLICY "Public can view food categories" ON food_categories FOR SELECT USING (true);

ALTER TABLE foods ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view published foods" ON foods;
CREATE POLICY "Public can view published foods" ON foods FOR SELECT USING (is_published = true);

ALTER TABLE food_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view food reviews" ON food_reviews;
CREATE POLICY "Public can view food reviews" ON food_reviews FOR SELECT USING (true);

ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view achievements" ON achievements;
CREATE POLICY "Public can view achievements" ON achievements FOR SELECT USING (true);

-- B. Sensitive Application Data Tables
-- RLS is enabled with NO permissive policies for PostgREST roles (anon, authenticated).
-- Direct PostgREST access is completely blocked to protect password hashes, salts,
-- and private user journey tracking. All interactions MUST go through the Express API backend.

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;
