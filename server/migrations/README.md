# Foodie BD (খাদক ম্যাপ) — Database Migration Guide

This guide describes how to initialize, verify, and populate the PostgreSQL database for Foodie BD on Supabase.

---

## 1. Architecture Overview

- **Authentication Model**: Foodie BD uses server-side HMAC-SHA256 JWT tokens. User IDs are application-managed strings (`user_admin_01`, `user_...`) stored in `VARCHAR(100)` columns.
- **Connection Model**: The Express backend connects to PostgreSQL via `pg.Pool` using `DATABASE_URL` (database owner role `postgres`). In PostgreSQL, the table owner automatically bypasses Row Level Security (RLS) unless `FORCE ROW LEVEL SECURITY` is set.
- **Security & RLS (Defense-in-Depth)**:
  - **Public Reference Tables** (`divisions`, `districts`, `food_categories`, `foods`, `food_reviews`, `achievements`): Allow read-only (`SELECT`) access via PostgREST. Mutations are blocked.
  - **Sensitive Application Tables** (`profiles`, `user_foods`, `admin_audit_logs`, `food_submissions`, `reports`): RLS is enabled with **no public policies**, completely blocking anonymous or unauthenticated PostgREST queries from reading password hashes or private tracking data. All operations must flow through the Express API backend.

---

## 2. Migration Execution Order

### Option A: Consolidated Single-File Run (Recommended for Supabase SQL Editor)
Open the Supabase dashboard -> **SQL Editor** -> create a new query:
1. Paste the entire contents of:
   ```
   server/migrations/supabase_complete_setup.sql
   ```
2. Click **Run**.
   - This script runs inside a single transaction (`BEGIN; ... COMMIT;`), creating all enums, tables, indexes, constraints, 8 divisions, 7 categories, 64 districts, 7 achievements, and setting up RLS defense-in-depth.

### Option B: Step-by-Step Migration (For CI/CD or Manual Runs)
Execute the files in exact numeric sequence:
1. `server/migrations/001_initial_schema.sql` (Creates enums, tables, foreign keys, indexes, and reference RLS)
2. `server/migrations/002_seed_data.sql` (Seeds 8 divisions, 7 categories, 64 districts, and 7 achievements)
3. `server/migrations/003_complete_schema_and_submissions.sql` (Adds submissions, reports, attribution columns, and submissions RLS)

---

## 3. Required Environment Variables

Configure these in your production environment (e.g., Vercel Project Settings -> Environment Variables):

| Variable | Description | Example / Note |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection URI | `postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres` (or port 6543 for transaction pooler) |
| `JWT_SECRET` | Secret key for HMAC-SHA256 JWTs | Minimum 32 characters, randomly generated |
| `SUPABASE_URL` | Supabase project URL | `https://[PROJECT-REF].supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-role secret key | Used exclusively server-side for `food-images` bucket uploads |
| `SUPABASE_STORAGE_BUCKET` | Storage bucket name | `food-images` |
| `NODE_ENV` | Runtime environment | `production` |

---

## 4. Initial Catalog Data Import (CLI)

Once the SQL schema is applied to Supabase, import the 40 verified regional foods and initial accounts from `data/foodie_bd.json`:

```bash
# Step 1: Validate source JSON and foreign keys without writing to the database
npm run migrate:data

# Step 2: Execute transactional migration to PostgreSQL
npm run migrate:data:execute

# Step 3: Verify row counts and data integrity
npm run migrate:data:verify
```

---

## 5. Post-Migration Verification Queries

Run these queries in the Supabase SQL Editor to verify database health:

```sql
-- 1. Verify entity counts
SELECT 'divisions' AS entity, COUNT(*) FROM divisions
UNION ALL
SELECT 'districts', COUNT(*) FROM districts
UNION ALL
SELECT 'food_categories', COUNT(*) FROM food_categories
UNION ALL
SELECT 'achievements', COUNT(*) FROM achievements
UNION ALL
SELECT 'foods', COUNT(*) FROM foods
UNION ALL
SELECT 'profiles', COUNT(*) FROM profiles;

-- Expected baseline after seed data:
-- divisions: 8
-- districts: 64
-- food_categories: 7
-- achievements: 7

-- 2. Verify Row Level Security is active on all tables
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- All public tables should show rowsecurity = true.

-- 3. Verify public read access on published foods
SELECT id, name_en, name_bn, district_id 
FROM foods 
WHERE is_published = true 
LIMIT 5;
```

---

## 6. Rollback Limitations & Recovery

- Migrations use `IF NOT EXISTS` and `ON CONFLICT DO NOTHING`, making them safe for reruns.
- In production, never run `DROP TABLE ... CASCADE` as it destroys user tracking and audit history.
- A full timestamped backup of the initial application data is stored in `data/backups/`.
- If schema rollback is ever required, drop tables in reverse dependency order:
  ```sql
  -- Rollback order (reverse dependency):
  DROP TABLE IF EXISTS reports;
  DROP TABLE IF EXISTS food_submissions;
  DROP TABLE IF EXISTS admin_audit_logs;
  DROP TABLE IF EXISTS food_reviews;
  DROP TABLE IF EXISTS user_foods;
  DROP TABLE IF EXISTS foods;
  DROP TABLE IF EXISTS profiles;
  DROP TABLE IF EXISTS food_categories;
  DROP TABLE IF EXISTS districts;
  DROP TABLE IF EXISTS divisions;
  DROP TABLE IF EXISTS achievements;
  ```
