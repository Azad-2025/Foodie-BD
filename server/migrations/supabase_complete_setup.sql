-- ====================================================================
-- Foodie BD (খাদক ম্যাপ) — Consolidated Supabase Complete Setup
-- Target: Supabase SQL Editor / PostgreSQL 15+
-- Description: Complete schema, constraints, indexes, reference seed data,
--              community submissions, moderation reports, and defense-in-depth RLS.
-- Execution: Paste this entire file into the Supabase SQL Editor and click "Run".
-- ====================================================================

BEGIN;

-- ====================================================================
-- PART 1: CORE SCHEMA, ENUMS, TABLES & INDEXES (Migration 001)
-- ====================================================================

-- 1.1 Enum Types
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

DO $$ BEGIN
    CREATE TYPE submission_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE report_status AS ENUM ('pending', 'reviewed', 'dismissed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1.2 Divisions Table (8 Divisions of Bangladesh)
CREATE TABLE IF NOT EXISTS divisions (
    id VARCHAR(50) PRIMARY KEY,
    name_en VARCHAR(100) NOT NULL,
    name_bn VARCHAR(100) NOT NULL,
    capital_en VARCHAR(100) NOT NULL,
    capital_bn VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.3 Districts Table (64 Districts of Bangladesh)
CREATE TABLE IF NOT EXISTS districts (
    id VARCHAR(50) PRIMARY KEY,
    division_id VARCHAR(50) NOT NULL REFERENCES divisions(id) ON DELETE CASCADE,
    name_en VARCHAR(100) NOT NULL,
    name_bn VARCHAR(100) NOT NULL,
    shape_name VARCHAR(100) NOT NULL UNIQUE,
    lat NUMERIC(9, 6) NOT NULL,
    lng NUMERIC(9, 6) NOT NULL,
    prominent_dish_en VARCHAR(255) NOT NULL,
    prominent_dish_bn VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_districts_division ON districts(division_id);

-- 1.4 Food Categories Table
CREATE TABLE IF NOT EXISTS food_categories (
    id VARCHAR(50) PRIMARY KEY,
    name_en VARCHAR(100) NOT NULL,
    name_bn VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.5 User Profiles Table
-- Stores application-managed accounts (scrypt password hashes + random salts).
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

-- 1.6 Foods Table
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

-- 1.7 User Foods / Food Journey Tracking
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

-- 1.8 Food Reviews
CREATE TABLE IF NOT EXISTS food_reviews (
    id VARCHAR(100) PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    food_id VARCHAR(100) NOT NULL REFERENCES foods(id) ON DELETE CASCADE,
    rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_food_reviews_food ON food_reviews(food_id);

-- 1.9 Achievements Definition Table
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

-- 1.10 Admin Audit Logs Table
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

-- 1.11 Community Food Submissions Table (Migration 003)
CREATE TABLE IF NOT EXISTS food_submissions (
    id VARCHAR(100) PRIMARY KEY,
    name_en VARCHAR(200) NOT NULL,
    name_bn VARCHAR(200) NOT NULL,
    short_description TEXT NOT NULL,
    detailed_description TEXT,
    category_id VARCHAR(50) NOT NULL REFERENCES food_categories(id) ON DELETE RESTRICT,
    district_id VARCHAR(50) NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
    division_id VARCHAR(50) NOT NULL REFERENCES divisions(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    origin_history TEXT,
    origin_source TEXT,
    approximate_price_bdt NUMERIC(10, 2) DEFAULT 0,
    dietary_type VARCHAR(50) DEFAULT 'non-veg',
    ingredients TEXT[] DEFAULT '{}',
    accurate_info_confirmed BOOLEAN DEFAULT false NOT NULL,

    -- Submitter details
    user_id VARCHAR(100) NOT NULL,
    submitter_name VARCHAR(150) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Review & Approval metadata
    status submission_status DEFAULT 'pending' NOT NULL,
    reviewed_by_user_id VARCHAR(100),
    reviewed_by_user_name VARCHAR(150),
    reviewed_at TIMESTAMPTZ,
    admin_feedback TEXT,
    approved_food_id VARCHAR(100),
    edit_history JSONB DEFAULT '[]'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_food_submissions_user ON food_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_food_submissions_status ON food_submissions(status);
CREATE INDEX IF NOT EXISTS idx_food_submissions_district ON food_submissions(district_id);

-- 1.12 User and Content Reports Table (Migration 003)
CREATE TABLE IF NOT EXISTS reports (
    id VARCHAR(100) PRIMARY KEY,
    reporter_user_id VARCHAR(100) NOT NULL,
    food_id VARCHAR(100),
    reason TEXT NOT NULL,
    status report_status DEFAULT 'pending' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON reports(reporter_user_id);

-- ====================================================================
-- PART 2: REFERENCE SEED DATA (Migration 002)
-- ====================================================================

-- 2.1 Insert 8 Divisions
INSERT INTO divisions (id, name_en, name_bn, capital_en, capital_bn) VALUES
('dhaka', 'Dhaka', 'ঢাকা', 'Dhaka', 'ঢাকা'),
('chattogram', 'Chattogram', 'চট্টগ্রাম', 'Chattogram', 'চট্টগ্রাম'),
('rajshahi', 'Rajshahi', 'রাজশাহী', 'Rajshahi', 'রাজশাহী'),
('khulna', 'Khulna', 'খুলনা', 'Khulna', 'খুলনা'),
('barishal', 'Barishal', 'বরিশাল', 'Barishal', 'বরিশাল'),
('sylhet', 'Sylhet', 'সিলেট', 'Sylhet', 'সিলেট'),
('rangpur', 'Rangpur', 'রংপুর', 'Rangpur', 'রংপুর'),
('mymensingh', 'Mymensingh', 'ময়মনসিংহ', 'Mymensingh', 'ময়মনসিংহ')
ON CONFLICT (id) DO NOTHING;

-- 2.2 Insert Food Categories (7)
INSERT INTO food_categories (id, name_en, name_bn, description) VALUES
('main_course', 'Main Course', 'প্রধান খাবার', 'Rich biryanis, mezban curries, and regional rice delicacies'),
('sweets_pitha', 'Sweets & Pitha', 'মিষ্টি ও পিঠা', 'Heritage mishti, curd, and seasonal handmade pithas'),
('traditional', 'Traditional Food', 'ঐতিহ্যবাহী খাবার', 'Century-old heritage recipes passed through generations'),
('street_food', 'Street Food', 'পথখাবার', 'Famous bazaar snacks, chotpoti, fuchka, and street kebabs'),
('snacks', 'Snacks & Bakes', 'নাস্তা ও বেকারি', 'Bakarkhani, savory chanachur, and evening tea companions'),
('dessert', 'Dessert', 'মিষ্টান্ন', 'Cooling puddings, kulfi, firni, and sweet curd'),
('drinks', 'Drinks & Beverages', 'পানীয়', 'Seven-color tea, matha, borhani, and fresh fruit sherbets')
ON CONFLICT (id) DO NOTHING;

-- 2.3 Insert 64 Administrative Districts
INSERT INTO districts (id, division_id, name_en, name_bn, shape_name, lat, lng, prominent_dish_en, prominent_dish_bn, description) VALUES
-- Dhaka Division (13)
('dhaka', 'dhaka', 'Dhaka', 'ঢাকা', 'Dhaka', 23.8103, 90.4125, 'Kacchi Biryani & Bakarkhani', 'কাচ্চি বিরিয়ানি ও বাকরখানি', 'Capital city famed for Mughal culinary heritage in Old Dhaka.'),
('gazipur', 'dhaka', 'Gazipur', 'গাজীপুর', 'Gazipur', 24.0023, 90.4264, 'Kathal (Jackfruit) Delicacies', 'কাঁঠালের সুস্বাদু পদ', 'Known for prime national fruit jackfruit dishes.'),
('narayanganj', 'dhaka', 'Narayanganj', 'নারায়ণগঞ্জ', 'Narayanganj', 23.6238, 90.5000, 'Murabba & Sonargaon Sweets', 'মোরব্বা ও সোনারগাঁয়ের মিষ্টি', 'Historic ancient capital Sonargaon with rich fruit preserves.'),
('narsingdi', 'dhaka', 'Narsingdi', 'নরসিংদী', 'Narsingdi', 23.9322, 90.7154, 'Amriti & Sagar Kola', 'অমৃতি ও সাগর কলা', 'Renowned for aromatic Amriti sweets dipped in syrup.'),
('munshiganj', 'dhaka', 'Munshiganj', 'মুন্সীগঞ্জ', 'Munshiganj', 23.5422, 90.5305, 'Bhagyakul Mistanna & Aloor Dum', 'ভাগ্যকূলের মিষ্টান্ন ও আলুর দম', 'Home to Bikrampur royal dairy sweets.'),
('manikganj', 'dhaka', 'Manikganj', 'মানিকগঞ্জ', 'Manikganj', 23.8617, 90.0003, 'Jholir Gur Sandesh', 'ঝোলির গুড়ের সন্দেশ', 'Famous for organic date palm liquid jaggery.'),
('tangail', 'dhaka', 'Tangail', 'টাঙ্গাইল', 'Tangail', 24.2513, 89.9167, 'Porabari Chomchom', 'পোড়াবাড়ির চমচম', 'Birthplace of the celebrated Porabari Chomchom.'),
('kishoreganj', 'dhaka', 'Kishoreganj', 'কিশোরগঞ্জ', 'Kishoreganj', 24.4449, 90.7766, 'Balish Mishti & Haor Fish', 'বালিশ মিষ্টি ও হাওরের মাছ', 'Pillow-shaped jumbo sweets soaked in malai.'),
('faridpur', 'dhaka', 'Faridpur', 'ফরিদপুর', 'Faridpur', 23.6071, 89.8429, 'Khejur Gurer Payesh', 'খেজুর গুড়ের পায়েস', 'Famed date palm molasses used in winter rice pudding.'),
('gopalganj', 'dhaka', 'Gopalganj', 'গোপালগঞ্জ', 'Gopalganj', 23.0051, 89.8267, 'Rosogolla & Til-er Khaja', 'রসগোল্লা ও তিলের খাজা', 'Spongy pure cow-milk Rosogolla and crunchy sesame brittle.'),
('madaripur', 'dhaka', 'Madaripur', 'মাদারীপুর', 'Madaripur', 23.1641, 90.1897, 'Khejur Rosh Sweets', 'খেজুর রসের মিষ্টি', 'Artisan sweetmakers utilizing authentic date sap.'),
('rajbari', 'dhaka', 'Rajbari', 'রাজবাড়ী', 'Rajbari', 23.7574, 89.6445, 'Chamcham & Kheer Sandesh', 'চমচম ও ক্ষীর সন্দেশ', 'Historic Padma crossing famous for golden chamcham.'),
('shariatpur', 'dhaka', 'Shariatpur', 'শরীয়তপুর', 'Shariatpur', 23.2423, 90.4348, 'Bibikhana Pitha', 'বিবিখানা পিঠা', 'Baked rice-cake Bibikhana pitha made with jaggery.'),

-- Chattogram Division (11)
('chattogram', 'chattogram', 'Chattogram', 'চট্টগ্রাম', 'Chittagong', 22.3569, 91.7832, 'Mezban Gosht & Kala Bhuna', 'মেজবানি গোশত ও কালা ভুনা', 'Home to legendary spicy slow-roasted Kala Bhuna.'),
('coxs_bazar', 'chattogram', 'Cox''s Bazar', 'কক্সবাজার', 'Cox''s Bazar', 21.4272, 92.0058, 'Chhuri Shutki & Coral Fish', 'ছুরি শুঁটকি ভর্তা ও কোরাল মাছ', 'Sun-dried spicy ribbon fish and grilled coastal catch.'),
('cumilla', 'chattogram', 'Cumilla', 'কুমিল্লা', 'Comilla', 23.4607, 91.1809, 'Matri Bhander Rasmalai', 'মাতৃভাণ্ডারের রসমালাই', 'Iconic national home of authentic Rasmalai.'),
('brahmanbaria', 'chattogram', 'Brahmanbaria', 'ব্রাহ্মণবাড়িয়া', 'Brahamanbaria', 23.9571, 91.1115, 'Chanar Mukhi', 'ছানার মুখী', 'GI-tagged sweet confection coated in sugar.'),
('chandpur', 'chattogram', 'Chandpur', 'চাঁদপুর', 'Chandpur', 23.2333, 90.6667, 'Padma-Meghna Ilish Paturi', 'পদ্মা-মেঘনার রূপালি ইলিশ পাতুরি', 'Premier national capital of Hilsa fish.'),
('feni', 'chattogram', 'Feni', 'ফেনী', 'Feni', 23.0159, 91.3976, 'Khondol-er Mishti', 'খন্দলের মিষ্টি', 'Historic sweet treats prepared in Khondol bazaar.'),
('lakshmipur', 'chattogram', 'Lakshmipur', 'লক্ষ্মীপুর', 'Lakshmipur', 22.9425, 90.8412, 'Moyish-er Doi', 'মহিষের দুধের দই', 'Dense, naturally set coastal buffalo milk curd.'),
('noakhali', 'chattogram', 'Noakhali', 'নোয়াখালী', 'Noakhali', 22.8696, 91.0991, 'Narikel Naru & Khola Jaal Pitha', 'নারকেল নাড়ু ও খোলাজা পিঠা', 'Paper-thin lacey egg crepe and coconut sweets.'),
('bandarban', 'chattogram', 'Bandarban', 'বান্দরবান', 'Bandarban', 22.1953, 92.2184, 'Bamboo Chicken & Mundi', 'বাঁশ মুরগি ও মুন্দি নুডুলস', 'Country chicken steamed inside green bamboo stalks.'),
('rangamati', 'chattogram', 'Rangamati', 'রাঙ্গামাটি', 'Rangamati', 22.7324, 92.2985, 'Hezon & Kaptai Lake Fish', 'হেজন ও কাপ্তাই লেকের তাজা মাছ', 'Delicacies cooked with bamboo shoot and lake fish.'),
('khagrachhari', 'chattogram', 'Khagrachhari', 'খাগড়াছড়ি', 'Khagrachhari', 23.1193, 91.9847, 'Pachon & Indigenous Herbs', 'পাজন তরকারি ও পাহাড়ি শাক', 'Festive dish made with 30 varieties of wild herbs.'),

-- Rajshahi Division (8)
('rajshahi', 'rajshahi', 'Rajshahi', 'রাজশাহী', 'Rajshahi', 24.3636, 88.6241, 'Kalai Ruti & Fazli Mango Delicacies', 'কালাই রুটি ও ফজলি আমের মিষ্টান্ন', 'Earthen-pan toasted black gram Kalai Ruti.'),
('bogura', 'rajshahi', 'Bogura', 'বগুড়া', 'Bogra', 24.8465, 89.3777, 'Bogurar Mishti Doi', 'বগুড়ার বিখ্যাত মিষ্টি দই', 'Internationally celebrated red-clay pottery sweet curd.'),
('pabna', 'rajshahi', 'Pabna', 'পাবনা', 'Pabna', 24.0044, 89.2372, 'Pabnar Peda & Ghee Sandesh', 'পাবনার প্যারা ও খাঁটি ঘিয়ের সন্দেশ', 'Dense melt-in-mouth milk Peda and pure ghee.'),
('sirajganj', 'rajshahi', 'Sirajganj', 'সিরাজগঞ্জ', 'Sirajganj', 24.4534, 89.7008, 'Sirajganj-er Ponir', 'সিরাজগঞ্জের খাঁটি পনির', 'Artisanal cow milk cheese wheel aged naturally.'),
('natore', 'rajshahi', 'Natore', 'নাটোর', 'Natore', 24.4206, 88.9324, 'Natorer Kachagolla', 'নাটোরের খাঁটি কাঁচাগোল্লা', 'Fresh un-cooked chhana infused with light sugar syrup.'),
('naogaon', 'rajshahi', 'Naogaon', 'নওগাঁ', 'Naogaon', 24.8108, 88.9416, 'Peda & Chhana Mishti', 'নওগাঁর প্যারা সন্দেশ', 'Condensed milk peda and aromatic Miniket rice.'),
('chapai_nawabganj', 'rajshahi', 'Chapai Nawabganj', 'চাঁপাইনবাবগঞ্জ', 'Nawabganj', 24.5965, 88.2775, 'Shibganj Chomchom & Mangoes', 'শিবগঞ্জের চমচম ও খিরসাপাত আম', 'The mango capital with golden Shibganj Chomchom.'),
('joypurhat', 'rajshahi', 'Joypurhat', 'জয়পুরহাট', 'Joypurhat', 25.1015, 89.0277, 'Bel-er Shorbot & Pitha', 'বেলের শরবত ও পিঠাপুলি', 'Wood-apple nectar and seasonal rural winter pithas.'),

-- Khulna Division (10)
('khulna', 'khulna', 'Khulna', 'খুলনা', 'Khulna', 22.8456, 89.5403, 'Chui Jhal Khasir Mangsho', 'চুইঝাল দিয়ে খাসির মাংস', 'Southern delicacy cooked with Piper chaba vine stem.'),
('bagerhat', 'khulna', 'Bagerhat', 'বাগেরহাট', 'Bagerhat', 22.6602, 89.7895, 'Sundarbans Honey & Mud Crab', 'সুন্দরবনের খাঁটি মধু ও কাঁকড়া ভুনা', 'Wild mangrove honey treats and spicy coastal mud crab.'),
('satkhira', 'khulna', 'Satkhira', 'সাতক্ষীরা', 'Satkhira', 22.7185, 89.0705, 'Satkhirar Sandesh & Golda Chingri', 'সাতক্ষীরার সন্দেশ ও গলদা চিংড়ি', 'Pure cow milk sandesh and freshwater jumbo prawns.'),
('jashore', 'khulna', 'Jashore', 'যশোর', 'Jessore', 23.1664, 89.2081, 'Jamtolar Mishti & Patali Gur', 'জামতলার মিষ্টি ও নলেন পাটালি গুড়', 'Home of date palm jaggery and century-old Jamtola sweets.'),
('jhenaidah', 'khulna', 'Jhenaidah', 'ঝিনাইদহ', 'Jhenaidah', 23.5450, 89.1726, 'Khejur Rosh Pitha & Sweets', 'খেজুর রসের পিঠা ও মিষ্টান্ন', 'Fresh date sap winter festivals and chhana creations.'),
('magura', 'khulna', 'Magura', 'মাগুরা', 'Magura', 23.4873, 89.4198, 'Batasa & Kadma', 'বাতাসা ও কদমা', 'Artisanal confectionery crafters making airy batasa.'),
('narail', 'khulna', 'Narail', 'নড়াইল', 'Narail', 23.1725, 89.5127, 'Chhit Ruti & Deshi Chitol', 'ছিট রুটি ও দেশি চিতল মাছ', 'River Chitra delicacies including Chhit Ruti and chitol.'),
('kushtia', 'khulna', 'Kushtia', 'কুষ্টিয়া', 'Kushtia', 23.9013, 89.1205, 'Tiler Khaja & Kulfi Malai', 'তিলের খাজা ও কুলফি মালাই', 'Paper-crisp sesame brittle and creamy pistachio Kulfi.'),
('chuadanga', 'khulna', 'Chuadanga', 'চুয়াডাঙ্গা', 'Chuadanga', 23.6402, 88.8418, 'Sarbhaja & Sarpuria', 'সরভাজা ও সরপুরিয়া', 'Layered milk-skin delicacies in saffron syrup.'),
('meherpur', 'khulna', 'Meherpur', 'মেহেরপুর', 'Meherpur', 23.7751, 88.6318, 'Sabitri & Roshkodom', 'সাবিত্রী ও রসকদম', 'Heritage dry sweet known for lasting weeks at room temperature.'),

-- Barishal Division (6)
('barishal', 'barishal', 'Barishal', 'বরিশাল', 'Barisal', 22.7010, 90.3535, 'Balam Rice & Ilish Bhapa', 'বালাম চালের ভাত ও ইলিশ ভাপা', 'Sweet aromatic Balam rice and steaming mustard Hilsa.'),
('bhola', 'barishal', 'Bhola', 'ভোলা', 'Bhola', 22.6859, 90.6481, 'Moyish-er Doodher Doi', 'মহিষের কাঁচা দুধের দই', 'Thick curd set naturally in wild hogla clay bowls.'),
('jhalokati', 'barishal', 'Jhalokati', 'ঝালকাঠি', 'Jhalokati', 22.6406, 90.1987, 'Guava & Chhana Sweets', 'ভাসমান বাজারের পেয়ারা ও ছানার মিষ্টি', 'Floating guava market delicacies and dairy sweets.'),
('pirojpur', 'barishal', 'Pirojpur', 'পিরোজপুর', 'Pirojpur', 22.5841, 89.9720, 'Amra Morobba & Pitha', 'আমড়া মোরব্বা ও বিভিন্ন পিঠা', 'Hog plum preserves and coconut-infused river delta pitha.'),
('barguna', 'barishal', 'Barguna', 'বরগুনা', 'Barguna', 22.1523, 90.1259, 'Chui Jhal River Fish', 'চুইঝালে নদীর টাটকা মাছ', 'Coastal river catches simmered in spicy Chui wood.'),
('patuakhali', 'barishal', 'Patuakhali', 'পটুয়াখালী', 'Patuakhali', 22.3596, 90.3299, 'Kuakata Seafood & Shutki Paturi', 'কুয়াকাটার সামুদ্রিক মাছ ও শুঁটকি পাতুরি', 'Roasted marine fish and banana-leaf wrapped dried fish.'),

-- Sylhet Division (4)
('sylhet', 'sylhet', 'Sylhet', 'সিলেট', 'Sylhet', 24.8949, 91.8687, 'Shatkora Beef & Nunor Pitha', 'সাতকড়া গরুর মাংস ও নুনর পিঠা', 'Wild citrus Shatkora beef curry and savory Nunor pitha.'),
('moulvibazar', 'sylhet', 'Moulvibazar', 'মৌলভীবাজার', 'Maulvibazar', 24.4829, 91.7774, 'Seven Color Tea & Manipuri Pitha', 'সাত রঙের চা ও মণিপুরি পিঠা', 'World-famous multi-layered Seven-Color Tea in Sreemangal.'),
('sunamganj', 'sylhet', 'Sunamganj', 'সুনামগঞ্জ', 'Sunamganj', 25.0658, 91.3950, 'Tanguar Haor Fresh Fish', 'টাঙ্গুয়ার হাওরের তাজা মাছের পদ', 'Wetland wild Boal, Pabda, and Rui fish curries.'),
('habiganj', 'sylhet', 'Habiganj', 'হবিগঞ্জ', 'Habiganj', 24.3749, 91.4155, 'Bipul-er Cha & Haor Duck Curry', 'বিপুলের চা ও হাওরের হাঁসের মাংস', 'Spiced tea blends and winter Haor duck curry with garlic.'),

-- Rangpur Division (8)
('rangpur', 'rangpur', 'Rangpur', 'রংপুর', 'Rangpur', 25.7439, 89.2752, 'Haribhanga Mango & Shidol', 'হাঁড়িভাঙা আম ও সিদল ভর্তা', 'Juicy Haribhanga mangoes and fermented fish Shidol.'),
('dinajpur', 'rangpur', 'Dinajpur', 'দিনাজপুর', 'Dinajpur', 25.6279, 88.6332, 'Kataribhog Rice & Litchi', 'কাটারিভোগ চালের পোলাও ও বেদানা লিচু', 'Aromatic Kataribhog grain and succulent sweet Bedana litchis.'),
('panchagarh', 'rangpur', 'Panchagarh', 'পঞ্চগড়', 'Panchagarh', 26.3411, 88.5541, 'Plainland Tea & Deshi Murgi', 'সমতলের চা ও দেশি হাঁস-মুরগি', 'Organic plainland teas and claypot poultry curries.'),
('thakurgaon', 'rangpur', 'Thakurgaon', 'ঠাকুরগাঁও', 'Thakurgaon', 26.0337, 88.4617, 'Shidol & Sura Pitha', 'সিদল ও সুরা পিঠা', 'Fiery crushed Shidol and tender steamed rice dumplings.'),
('gaibandha', 'rangpur', 'Gaibandha', 'গাইবান্ধা', 'Gaibandha', 25.3288, 89.5408, 'Rasmanjari', 'গাইবান্ধার রসমঞ্জরী', 'Mini golden chhana globes bathed in reduced cardamom malai.'),
('kurigram', 'rangpur', 'Kurigram', 'কুড়িগ্রাম', 'Kurigram', 25.8054, 89.6362, 'Kheer Chomchom & Char Fish', 'ক্ষীর চমচম ও চরের মাছ', 'Brahmaputra river delta thick milk skin sweets.'),
('lalmonirhat', 'rangpur', 'Lalmonirhat', 'লালমনিরহাট', 'Lalmonirhat', 25.9923, 89.2847, 'Shidol Vapa & Teesta Fish', 'সিদল ভাপা ও তিস্তার বৈরালী মাছ', 'Sparkling Bairali fish and steamed spicy Shidol.'),
('nilphamari', 'rangpur', 'Nilphamari', 'নীলফামারী', 'Nilphamari', 25.9318, 88.8560, 'Saidpur Beef Kebab & Petha', 'সৈয়দপুরের গরুর কাবাব ও পেঠা মিষ্টি', 'Spiced beef seekh kebabs and heritage ash-gourd sweets.'),

-- Mymensingh Division (4)
('mymensingh', 'mymensingh', 'Mymensingh', 'ময়মনসিংহ', 'Mymensingh', 24.7471, 90.4203, 'Muktagachar Monda', 'মুক্তাগাছার মণ্ডা', 'Two-century-old royal confection of pure chhana discs.'),
('jamalpur', 'mymensingh', 'Jamalpur', 'জামালপুর', 'Jamalpur', 24.9375, 89.9378, 'Milam Morobba & Pitha', 'মিলন মোরব্বা ও জামালপুরের পিঠা', 'Sweet preserves prepared with wax gourd and sugar.'),
('netrakona', 'mymensingh', 'Netrakona', 'নেত্রকোণা', 'Netrakona', 24.8709, 90.7279, 'Balish Mishti (Goyanath)', 'গয়ানাথের বালিশ মিষ্টি', 'Giant pillow-shaped sweets soaked in thick cream.'),
('sherpur', 'mymensingh', 'Sherpur', 'শেরপুর', 'Sherpur', 25.0205, 90.0153, 'Chhanar Payesh & Tiler Pitha', 'ছানার পায়েস ও তিলের পিঠা', 'Rich chhana payesh pudding and roasted sesame pithas.')
ON CONFLICT (id) DO NOTHING;

-- 2.4 Insert Standard Achievement Definitions (7)
INSERT INTO achievements (id, title_en, title_bn, description_en, description_bn, icon, category, threshold) VALUES
('first_bite', 'First Bite of Bengal', 'বাংলার প্রথম স্বাদ', 'Logged your very first Bangladeshi food experience.', 'আপনার প্রথম খাবার ট্র্যাকিং সম্পন্ন করেছেন।', 'Utensils', 'count', 1),
('sweet_tooth', 'Misti Moghol (Sweet Connoisseur)', 'মিষ্টি মোঘল', 'Tasted at least 3 heritage Bengali sweets or pithas.', 'কমপক্ষে ৩টি ঐতিহ্যবাহী মিষ্টি বা পিঠা চেখে দেখেছেন।', 'Cake', 'specialty', 3),
('dhaka_foodie', 'Old Dhaka Foodie', 'ঢাকাইয়া খাদক', 'Experienced 3 authentic foods from Dhaka division.', 'ঢাকা বিভাগের ৩টি ঐতিহ্যবাহী খাবার উপভোগ করেছেন।', 'Crown', 'division', 3),
('spice_chaser', 'Spicy Explorer', 'ঝাল প্রেমী খাদক', 'Tried Kala Bhuna or Chui Jhal delicacies.', 'কালা ভুনা বা চুইঝালের মতো ঝাল খাবার চেখেছেন।', 'Flame', 'specialty', 2),
('five_districts', 'District Hopper', 'জেলা পরিভ্রমণকারী', 'Explored foods from 5 different districts.', '৫টি ভিন্ন জেলার খাবার আবিষ্কার করেছেন।', 'Compass', 'count', 5),
('ten_districts', 'True Khadok (Food Adventurer)', 'খাঁটি খাদক', 'Explored foods from 10 different districts.', '১০টি ভিন্ন জেলার সুস্বাদু পদ ট্র্যাকিং করেছেন।', 'Award', 'count', 10),
('division_master', 'All-Divisions Connoisseur', 'অষ্টবিভাগ জয়ী', 'Tasted at least one dish from all 8 divisions of Bangladesh.', 'বাংলাদেশের ৮টি বিভাগের প্রতিটি থেকেই খাবার চেখে দেখেছেন।', 'MapPin', 'division', 8)
ON CONFLICT (id) DO NOTHING;

-- ====================================================================
-- PART 3: ROW LEVEL SECURITY POLICIES (Defense-in-Depth)
-- ====================================================================

-- 3.1 Public Read-Only Reference Tables
-- Direct PostgREST SELECT is allowed. INSERT/UPDATE/DELETE are blocked.
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

-- 3.2 Sensitive Application Data Tables
-- RLS enabled with NO permissive policies for unauthenticated or PostgREST roles.
-- Direct PostgREST queries are blocked. All authenticated operations flow through
-- the Express backend via DATABASE_URL where JWT verification is enforced.
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

COMMIT;
