import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { getPostgresPool, withTransaction, testPostgresConnection } from '../server/postgres';

export interface MigrationReport {
  timestamp: string;
  sourceFile: string;
  sourceCounts: Record<string, number>;
  insertedCounts: Record<string, number>;
  skippedCounts: Record<string, number>;
  success: boolean;
  dryRun: boolean;
  errors: string[];
}

/**
 * Validates and migrates existing JSON data (data/foodie_bd.json) into PostgreSQL / Supabase
 * with full transactional safety, idempotency, and foreign-key order resolution.
 *
 * NOTE: By default this runs in DRY-RUN mode unless dryRun === false.
 * Real remote database execution requires explicit user authorization.
 */
export async function runJsonToPostgresMigration(options: {
  jsonFilePath?: string;
  dryRun?: boolean;
}): Promise<MigrationReport> {
  const filePath = options.jsonFilePath || path.resolve(process.cwd(), 'data/foodie_bd.json');
  const dryRun = options.dryRun !== false;

  const report: MigrationReport = {
    timestamp: new Date().toISOString(),
    sourceFile: filePath,
    sourceCounts: {},
    insertedCounts: {},
    skippedCounts: {},
    success: false,
    dryRun,
    errors: [],
  };

  // 1. Verify source JSON file exists and is valid
  if (!fs.existsSync(filePath)) {
    report.errors.push(`Source data file not found at ${filePath}`);
    return report;
  }

  let data: any;
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    data = JSON.parse(raw);
  } catch (err: any) {
    report.errors.push(`Failed to parse source JSON: ${err.message}`);
    return report;
  }

  // 2. Count and validate source entities
  const entities = [
    'divisions',
    'categories',
    'districts',
    'users',
    'foods',
    'userFoods',
    'foodReviews',
    'achievements',
    'reports',
    'auditLogs',
    'foodSubmissions',
  ];

  for (const entity of entities) {
    report.sourceCounts[entity] = Array.isArray(data[entity]) ? data[entity].length : 0;
    report.insertedCounts[entity] = 0;
    report.skippedCounts[entity] = 0;
  }

  // If in dry-run mode, validate structure without writing to database
  if (dryRun) {
    console.log('[MIGRATION DRY-RUN]: Validating source structure without database writes.');
    report.success = true;
    return report;
  }

  // 3. Verify PostgreSQL connection
  const connStatus = await testPostgresConnection();
  if (!connStatus.isConnected) {
    report.errors.push(`Database connection failed: ${connStatus.error || 'Unknown connection error'}`);
    return report;
  }

  // 4. Execute transactional migration in foreign-key dependency order
  try {
    await withTransaction(async (client) => {
      // 1. Divisions
      for (const d of data.divisions || []) {
        const res = await client.query(
          `INSERT INTO divisions (id, name_en, name_bn, capital_en, capital_bn)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (id) DO NOTHING`,
          [d.id, d.nameEn, d.nameBn, d.capitalEn, d.capitalBn]
        );
        if (res.rowCount && res.rowCount > 0) report.insertedCounts.divisions++;
        else report.skippedCounts.divisions++;
      }

      // 2. Food Categories
      for (const c of data.categories || []) {
        const res = await client.query(
          `INSERT INTO food_categories (id, name_en, name_bn, description)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (id) DO NOTHING`,
          [c.id, c.nameEn, c.nameBn, c.description || '']
        );
        if (res.rowCount && res.rowCount > 0) report.insertedCounts.categories++;
        else report.skippedCounts.categories++;
      }

      // 3. Districts
      for (const d of data.districts || []) {
        const res = await client.query(
          `INSERT INTO districts (id, division_id, name_en, name_bn, shape_name, lat, lng, prominent_dish_en, prominent_dish_bn, description)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT (id) DO NOTHING`,
          [
            d.id,
            d.divisionId,
            d.nameEn,
            d.nameBn,
            d.shapeName,
            d.lat,
            d.lng,
            d.prominentDishEn,
            d.prominentDishBn,
            d.description || '',
          ]
        );
        if (res.rowCount && res.rowCount > 0) report.insertedCounts.districts++;
        else report.skippedCounts.districts++;
      }

      // 4. User Profiles (Preserves exact passwordHash and salt without logging)
      for (const u of data.users || []) {
        const res = await client.query(
          `INSERT INTO profiles (id, name, email, password_hash, salt, role, avatar_url, home_district_id, bio, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT (id) DO NOTHING`,
          [
            u.id,
            u.name,
            u.email,
            u.passwordHash,
            u.salt,
            u.role || 'user',
            u.avatarUrl || null,
            u.homeDistrictId || null,
            u.bio || null,
            u.createdAt || new Date().toISOString(),
          ]
        );
        if (res.rowCount && res.rowCount > 0) report.insertedCounts.users++;
        else report.skippedCounts.users++;
      }

      // 5. Foods
      for (const f of data.foods || []) {
        const res = await client.query(
          `INSERT INTO foods (
             id, name_en, name_bn, short_description, detailed_description,
             category_id, district_id, division_id, image_url, origin_history,
             origin_source, approximate_price_bdt, dietary, is_published, ingredients,
             submission_id, submitted_by_user_id, submitted_by_user_name,
             approved_by_user_id, approved_by_user_name, approved_at, verification_status,
             created_at, updated_at
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
           ON CONFLICT (id) DO NOTHING`,
          [
            f.id,
            f.nameEn,
            f.nameBn,
            f.shortDescription,
            f.detailedDescription || '',
            f.category,
            f.districtId,
            f.divisionId,
            f.imageUrl,
            f.originHistory || '',
            f.originSource || '',
            f.approximatePriceBdt || 0,
            f.dietaryType || 'non-veg',
            f.isPublished ?? true,
            f.ingredients || [],
            f.submissionId || null,
            f.submittedByUserId || null,
            f.submittedByUserName || null,
            f.approvedByUserId || null,
            f.approvedByUserName || null,
            f.approvedAt || null,
            f.verificationStatus || 'admin_created',
            f.createdAt || new Date().toISOString(),
            f.updatedAt || new Date().toISOString(),
          ]
        );
        if (res.rowCount && res.rowCount > 0) report.insertedCounts.foods++;
        else report.skippedCounts.foods++;
      }

      // 6. User Foods / Journey
      for (const uf of data.userFoods || []) {
        const res = await client.query(
          `INSERT INTO user_foods (id, user_id, food_id, status, tried_at, rating, notes, photo_url, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (user_id, food_id) DO NOTHING`,
          [
            uf.id,
            uf.userId,
            uf.foodId,
            uf.status,
            uf.triedAt || null,
            uf.rating || null,
            uf.notes || null,
            uf.photoUrl || null,
            uf.updatedAt || new Date().toISOString(),
          ]
        );
        if (res.rowCount && res.rowCount > 0) report.insertedCounts.userFoods++;
        else report.skippedCounts.userFoods++;
      }

      // 7. Food Reviews
      for (const r of data.foodReviews || []) {
        const res = await client.query(
          `INSERT INTO food_reviews (id, user_id, food_id, rating, comment, created_at)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (id) DO NOTHING`,
          [r.id, r.userId, r.foodId, r.rating, r.comment, r.createdAt || new Date().toISOString()]
        );
        if (res.rowCount && res.rowCount > 0) report.insertedCounts.foodReviews++;
        else report.skippedCounts.foodReviews++;
      }

      // 8. Achievements
      for (const a of data.achievements || []) {
        const res = await client.query(
          `INSERT INTO achievements (id, title_en, title_bn, description_en, description_bn, icon, category, threshold)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (id) DO NOTHING`,
          [a.id, a.titleEn, a.titleBn, a.descriptionEn, a.descriptionBn, a.icon, a.category, a.threshold]
        );
        if (res.rowCount && res.rowCount > 0) report.insertedCounts.achievements++;
        else report.skippedCounts.achievements++;
      }

      // 9. Admin Audit Logs
      for (const l of data.auditLogs || []) {
        const res = await client.query(
          `INSERT INTO admin_audit_logs (id, action, entity_type, entity_id, user_id, user_name, details, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (id) DO NOTHING`,
          [
            l.id,
            l.action,
            l.entityType,
            l.entityId,
            l.userId || null,
            l.userName || 'System',
            l.details || '',
            l.createdAt || new Date().toISOString(),
          ]
        );
        if (res.rowCount && res.rowCount > 0) report.insertedCounts.auditLogs++;
        else report.skippedCounts.auditLogs++;
      }

      // 10. Food Submissions
      for (const s of data.foodSubmissions || []) {
        const res = await client.query(
          `INSERT INTO food_submissions (
             id, name_en, name_bn, short_description, detailed_description,
             category_id, district_id, division_id, image_url, origin_history,
             origin_source, approximate_price_bdt, dietary_type, ingredients,
             accurate_info_confirmed, user_id, submitter_name, status,
             reviewed_by_user_id, reviewed_by_user_name, reviewed_at, admin_feedback,
             approved_food_id, edit_history, created_at, updated_at
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)
           ON CONFLICT (id) DO NOTHING`,
          [
            s.id,
            s.nameEn,
            s.nameBn,
            s.shortDescription,
            s.detailedDescription || '',
            s.category,
            s.districtId,
            s.divisionId,
            s.imageUrl,
            s.originHistory || '',
            s.originSource || '',
            s.approximatePriceBdt || 0,
            s.dietaryType || 'non-veg',
            s.ingredients || [],
            s.accurateInfoConfirmed ?? false,
            s.userId,
            s.submitterName,
            s.status || 'pending',
            s.reviewedByUserId || null,
            s.reviewedByUserName || null,
            s.reviewedAt || null,
            s.adminFeedback || null,
            s.approvedFoodId || null,
            JSON.stringify(s.editHistory || []),
            s.createdAt || new Date().toISOString(),
            s.updatedAt || new Date().toISOString(),
          ]
        );
        if (res.rowCount && res.rowCount > 0) report.insertedCounts.foodSubmissions++;
        else report.skippedCounts.foodSubmissions++;
      }
    });

    report.success = true;
  } catch (err: any) {
    report.errors.push(`Transaction error during migration: ${err.message}`);
    report.success = false;
  }

  return report;
}

// CLI runner: `npx tsx scripts/migrate-json-to-postgres.ts [--execute]`
if (process.argv[1]?.endsWith('migrate-json-to-postgres.ts')) {
  const isExecute = process.argv.includes('--execute');
  console.log(`\n========================================`);
  console.log(`  Foodie BD JSON -> PostgreSQL Migrator`);
  console.log(`  Mode: ${isExecute ? 'EXECUTE (REAL WRITE)' : 'DRY RUN (VALIDATE ONLY)'}`);
  console.log(`========================================\n`);

  runJsonToPostgresMigration({ dryRun: !isExecute })
    .then((report) => {
      console.log('Migration Report:');
      console.log(JSON.stringify(report, null, 2));
      process.exit(report.success ? 0 : 1);
    })
    .catch((err) => {
      console.error('Migration aborted with uncaught error:', err);
      process.exit(1);
    });
}
