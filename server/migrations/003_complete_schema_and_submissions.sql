-- ====================================================================
-- Foodie BD (খাদক ম্যাপ) Schema Migration 003
-- Target: PostgreSQL / Supabase
-- Description: Complete schema addition for food submissions, reports,
--              community attributions, and resilient ID typing.
-- ====================================================================

-- 1. Ensure enum for submission status
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

-- 2. Add community verification & attribution columns to foods table if not already present
ALTER TABLE IF EXISTS foods
    ADD COLUMN IF NOT EXISTS submission_id VARCHAR(100),
    ADD COLUMN IF NOT EXISTS submitted_by_user_id VARCHAR(100),
    ADD COLUMN IF NOT EXISTS submitted_by_user_name VARCHAR(150),
    ADD COLUMN IF NOT EXISTS approved_by_user_id VARCHAR(100),
    ADD COLUMN IF NOT EXISTS approved_by_user_name VARCHAR(150),
    ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS verification_status VARCHAR(50) DEFAULT 'admin_created',
    ADD COLUMN IF NOT EXISTS research_status VARCHAR(50),
    ADD COLUMN IF NOT EXISTS citation_sources TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS image_caption TEXT,
    ADD COLUMN IF NOT EXISTS image_attribution TEXT,
    ADD COLUMN IF NOT EXISTS image_verified BOOLEAN DEFAULT false;

-- 3. Community Food Submissions Table
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

-- 4. User and Content Reports Table
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

-- 5. Row-Level Security (RLS) Policies for Submissions & Reports
ALTER TABLE food_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Submissions Policies:
-- Submitters can view their own submissions; admins can view all submissions
DROP POLICY IF EXISTS "Users can view own submissions" ON food_submissions;
CREATE POLICY "Users can view own submissions"
ON food_submissions FOR SELECT USING (
    user_id = (auth.uid())::text OR 
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (auth.uid())::text AND profiles.role = 'admin')
);

-- Users can insert their own submissions
DROP POLICY IF EXISTS "Users can insert own submissions" ON food_submissions;
CREATE POLICY "Users can insert own submissions"
ON food_submissions FOR INSERT WITH CHECK (
    user_id = (auth.uid())::text
);

-- Users can update own pending submissions; admins can review/update any submission
DROP POLICY IF EXISTS "Users can update own pending submissions" ON food_submissions;
CREATE POLICY "Users can update own pending submissions"
ON food_submissions FOR UPDATE USING (
    (user_id = (auth.uid())::text AND status = 'pending') OR
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (auth.uid())::text AND profiles.role = 'admin')
);

-- Users can delete own pending submissions; admins can delete any submission
DROP POLICY IF EXISTS "Users can delete own pending submissions" ON food_submissions;
CREATE POLICY "Users can delete own pending submissions"
ON food_submissions FOR DELETE USING (
    (user_id = (auth.uid())::text AND status = 'pending') OR
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (auth.uid())::text AND profiles.role = 'admin')
);

-- Reports Policies:
-- Reporters can view their own reports; admins can view all moderation reports
DROP POLICY IF EXISTS "Users can view own reports" ON reports;
CREATE POLICY "Users can view own reports"
ON reports FOR SELECT USING (
    reporter_user_id = (auth.uid())::text OR
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (auth.uid())::text AND profiles.role = 'admin')
);

-- Authenticated users can submit moderation reports
DROP POLICY IF EXISTS "Users can insert reports" ON reports;
CREATE POLICY "Users can insert reports"
ON reports FOR INSERT WITH CHECK (
    reporter_user_id = (auth.uid())::text
);

-- Only admins can review and update report status (e.g. reviewed, dismissed)
DROP POLICY IF EXISTS "Admins can update reports" ON reports;
CREATE POLICY "Admins can update reports"
ON reports FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (auth.uid())::text AND profiles.role = 'admin')
);

-- Only admins can delete reports
DROP POLICY IF EXISTS "Admins can delete reports" ON reports;
CREATE POLICY "Admins can delete reports"
ON reports FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (auth.uid())::text AND profiles.role = 'admin')
);

