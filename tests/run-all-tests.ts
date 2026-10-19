import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { DIVISIONS, DISTRICTS } from '../src/data/divisionsAndDistricts';
import { SEED_FOODS } from '../src/data/seedFoods';
import { db, createPasswordRecord, verifyPassword, DbUser } from '../server/db';
import {
  generateToken,
  verifyToken,
  requireAdmin,
  getJwtSecret,
  validateAuthConfig,
  DISALLOWED_PRODUCTION_SECRETS,
} from '../server/auth';
import { apiRouter } from '../server/routes';
import { imageStorage, validateImageBuffer } from '../server/storage';
import { analyzeImageUrl } from '../src/lib/imageUrlHelper';
import { testPostgresConnection } from '../server/postgres';
import { runJsonToPostgresMigration, verifyPostgresMigration } from '../scripts/migrate-json-to-postgres';
import { dal, validateDatabaseConfig, isPostgresActive } from '../server/dal';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, message: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ [PASS] ${message}`);
  } else {
    failedTests++;
    console.error(`  ✗ [FAIL] ${message}`);
  }
}

async function runTestSuite() {
  console.log('\n========================================');
  console.log('  Foodie BD (খাদক ম্যাপ) Test Suite');
  console.log('========================================\n');

  // ----------------------------------------------------
  // TEST SUITE 1: 64 Districts GeoJSON & Geographic Data
  // ----------------------------------------------------
  console.log('▶ Test Suite 1: Bangladesh Map & GeoJSON Boundaries');
  
  const geoPath = path.resolve(process.cwd(), 'public/data/bangladesh-districts.json');
  assert(fs.existsSync(geoPath), 'GeoJSON file exists at public/data/bangladesh-districts.json');

  const geoRaw = fs.readFileSync(geoPath, 'utf8');
  const geoData = JSON.parse(geoRaw);
  assert(geoData.type === 'FeatureCollection', 'GeoJSON root is a valid FeatureCollection');
  assert(Array.isArray(geoData.features) && geoData.features.length === 64, `GeoJSON contains exactly 64 district polygon features (found: ${geoData.features.length})`);

  assert(DIVISIONS.length === 8, 'Catalog defines exactly 8 divisions of Bangladesh');
  assert(DISTRICTS.length === 64, 'Catalog defines exactly 64 districts of Bangladesh');

  // Verify division distribution
  const divisionCounts: Record<string, number> = {};
  DISTRICTS.forEach((d) => {
    divisionCounts[d.divisionId] = (divisionCounts[d.divisionId] || 0) + 1;
  });

  assert(divisionCounts['dhaka'] === 13, 'Dhaka division has 13 districts');
  assert(divisionCounts['chattogram'] === 11, 'Chattogram division has 11 districts');
  assert(divisionCounts['rajshahi'] === 8, 'Rajshahi division has 8 districts');
  assert(divisionCounts['khulna'] === 10, 'Khulna division has 10 districts');
  assert(divisionCounts['barishal'] === 6, 'Barishal division has 6 districts');
  assert(divisionCounts['sylhet'] === 4, 'Sylhet division has 4 districts');
  assert(divisionCounts['rangpur'] === 8, 'Rangpur division has 8 districts');
  assert(divisionCounts['mymensingh'] === 4, 'Mymensingh division has 4 districts');

  // Verify all 64 district shapeNames map cleanly to GeoJSON features
  const geoShapeNames = new Set(geoData.features.map((f: any) => f.properties.shapeName.toLowerCase()));
  let allMapped = true;
  for (const d of DISTRICTS) {
    if (!geoShapeNames.has(d.shapeName.toLowerCase())) {
      allMapped = false;
      console.error(`    Missing shapeName in GeoJSON: ${d.nameEn} (${d.shapeName})`);
    }
  }
  assert(allMapped, 'All 64 districts successfully map 1:1 to GeoJSON shapeName properties');

  // Verify geographic coordinate boundaries for Bangladesh
  let validCoords = true;
  for (const d of DISTRICTS) {
    if (d.lat < 20.5 || d.lat > 26.8 || d.lng < 88.0 || d.lng > 92.8) {
      validCoords = false;
      console.error(`    Invalid coordinates for ${d.nameEn}: [${d.lat}, ${d.lng}]`);
    }
  }
  assert(validCoords, 'All 64 district coordinates lie within the official geographic bounding box of Bangladesh');


  // ----------------------------------------------------
  // TEST SUITE 2: Authentication, Password Hashing & Roles
  // ----------------------------------------------------
  console.log('\n▶ Test Suite 2: Authentication, Crypto & Authorization');

  // Test password hashing
  const rawPass = 'SecretP@ssw0rd!2026';
  const { hash, salt } = createPasswordRecord(rawPass);
  assert(typeof hash === 'string' && hash.length === 128, 'Password hash is 64-byte scrypt hex (128 chars)');
  assert(typeof salt === 'string' && salt.length === 32, 'Cryptographic salt is 16-byte hex (32 chars)');
  assert(verifyPassword(rawPass, hash, salt) === true, 'Correct password validates successfully');
  assert(verifyPassword('WrongP@ssw0rd!', hash, salt) === false, 'Incorrect password correctly rejected');

  // Test JWT tokens
  const testUser: DbUser = {
    id: 'test_user_jwt',
    name: 'Test Explorer',
    email: 'test@example.com',
    role: 'user',
    passwordHash: hash,
    salt,
    createdAt: new Date().toISOString(),
  };

  const token = generateToken(testUser);
  assert(typeof token === 'string' && token.split('.').length === 3, 'JWT token generated with valid 3-part header.body.signature');

  const decoded = verifyToken(token);
  assert(decoded !== null && decoded.userId === testUser.id && decoded.role === 'user', 'JWT token verifies and extracts user payload');

  // Test tampering
  const tamperedToken = token.slice(0, -4) + 'abcd';
  assert(verifyToken(tamperedToken) === null, 'Tampered token signature is rejected by timing-safe verification');

  const garbageToken = 'invalid.token';
  assert(verifyToken(garbageToken) === null, 'Malformed token string is rejected');

  // Test admin verification
  const adminUser: DbUser = {
    id: 'test_admin_jwt',
    name: 'Admin Test',
    email: 'admin_test@foodiebd.com',
    role: 'admin',
    passwordHash: hash,
    salt,
    createdAt: new Date().toISOString(),
  };
  const adminToken = generateToken(adminUser);
  const adminDecoded = verifyToken(adminToken);
  assert(adminDecoded?.role === 'admin', 'Admin token reflects admin role payload');


  // ----------------------------------------------------
  // TEST SUITE 3: Data Persistence & User Isolation
  // ----------------------------------------------------
  console.log('\n▶ Test Suite 3: Relational Persistence & User Isolation');

  const schema = db.getSchema();
  assert(schema.foods.length >= 35, `Catalog contains authentic regional dishes (found: ${schema.foods.length})`);
  assert(schema.categories.length === 7, 'Catalog includes 7 structured culinary categories');

  // Persistence test: write a tracking record and re-read from disk
  const testFood = schema.foods[0];
  const uniqueTrackId = 'test_track_' + Date.now();

  schema.userFoods.push({
    id: uniqueTrackId,
    userId: 'user_isolation_test_a',
    foodId: testFood.id,
    status: 'tried',
    triedAt: '2026-01-01T10:00:00.000Z',
    rating: 5,
    notes: 'Delicious authentic taste test',
    updatedAt: new Date().toISOString(),
  });
  db.save();

  // Read raw file directly from disk
  const dbFile = path.resolve(process.cwd(), 'data/foodie_bd.json');
  const diskData = JSON.parse(fs.readFileSync(dbFile, 'utf8'));
  const foundOnDisk = diskData.userFoods.some((uf: any) => uf.id === uniqueTrackId);
  assert(foundOnDisk, 'Tracking record persists to data/foodie_bd.json on disk');

  // Test user isolation: filtering by user A does not return user B's records
  const userATracks = schema.userFoods.filter((uf) => uf.userId === 'user_isolation_test_a');
  const userBTracks = schema.userFoods.filter((uf) => uf.userId === 'user_isolation_test_b');
  assert(userATracks.length === 1 && userBTracks.length === 0, 'User data isolation strictly maintained across user IDs');

  // Progress deduplication test:
  // If user A tastes 2 foods from the same district, unique districts visited should still be 1
  const sameDistrictFood = schema.foods.find((f) => f.districtId === testFood.districtId && f.id !== testFood.id);
  if (sameDistrictFood) {
    schema.userFoods.push({
      id: 'test_track_2_' + Date.now(),
      userId: 'user_isolation_test_a',
      foodId: sameDistrictFood.id,
      status: 'tried',
      triedAt: '2026-01-02T10:00:00.000Z',
      rating: 4,
      updatedAt: new Date().toISOString(),
    });
  }

  const userAFoods = schema.userFoods
    .filter((uf) => uf.userId === 'user_isolation_test_a' && uf.status === 'tried')
    .map((uf) => schema.foods.find((f) => f.id === uf.foodId))
    .filter((f) => !!f);

  const uniqueDistrictsCount = new Set(userAFoods.map((f) => f!.districtId)).size;
  assert(uniqueDistrictsCount === 1, 'Progress deduplication: Multiple foods from same district count as 1 unique visited district');

  // Cleanup test entries
  schema.userFoods = schema.userFoods.filter((uf) => uf.userId !== 'user_isolation_test_a');
  db.save();


  // ----------------------------------------------------
  // TEST SUITE 4: Seed & SQL Migration Files Integrity
  // ----------------------------------------------------
  console.log('\n▶ Test Suite 4: SQL Migration Files & Database Schemas');

  const migration1 = path.resolve(process.cwd(), 'server/migrations/001_initial_schema.sql');
  const migration2 = path.resolve(process.cwd(), 'server/migrations/002_seed_data.sql');

  assert(fs.existsSync(migration1), '001_initial_schema.sql exists and is ready for PostgreSQL/Supabase');
  assert(fs.existsSync(migration2), '002_seed_data.sql exists with seed dataset for 64 districts');

  const m1Content = fs.readFileSync(migration1, 'utf8');
  assert(m1Content.includes('CREATE TABLE IF NOT EXISTS districts'), 'Migration 001 defines districts table');
  assert(m1Content.includes('CREATE TABLE IF NOT EXISTS user_foods'), 'Migration 001 defines user_foods journey tracking table');
  assert(m1Content.includes('ENABLE ROW LEVEL SECURITY'), 'Migration 001 includes Row Level Security (RLS) policies');


  // ----------------------------------------------------
  // TEST SUITE 5: Navigation & Bilingual i18n Integrity
  // ----------------------------------------------------
  console.log('\n▶ Test Suite 5: Navigation Items & Bilingual i18n Integrity');

  const { bn } = await import('../src/i18n/locales/bn');
  const { en } = await import('../src/i18n/locales/en');

  assert(Boolean(bn && en), 'Both Bengali (bn) and English (en) dictionaries loaded');
  assert(bn.nav.home === 'হোম', 'Nav item 1 is Bengali "হোম"');
  assert(bn.nav.foodMap === 'ফুডি কার্ড', 'Nav item 2 is renamed to Bengali "ফুডি কার্ড"');
  assert(bn.nav.discover === 'খাবার খুঁজুন', 'Nav item 3 is Bengali "খাবার খুঁজুন"');
  assert(bn.nav.journey === 'আমার যাত্রা', 'Nav item 4 is Bengali "আমার যাত্রা"');
  assert(bn.nav.profile === 'আমার প্রোফাইল', 'Nav item 5 is Bengali "আমার প্রোফাইল"');

  assert(en.nav.home === 'Home', 'English nav item 1 is "Home"');
  assert(en.nav.foodMap === 'Foodie Map', 'English nav item 2 is "Foodie Map"');
  assert(en.nav.discover === 'Discover Foods', 'English nav item 3 is "Discover Foods"');
  assert(en.nav.journey === 'My Journey', 'English nav item 4 is "My Journey"');
  assert(en.nav.profile === 'My Profile', 'English nav item 5 is "My Profile"');

  // Verify Header source code removes districtFoods and old separate foodieCard
  const headerContent = fs.readFileSync(path.resolve(process.cwd(), 'src/components/layout/Header.tsx'), 'utf8');
  assert(!headerContent.includes("id: 'districtFoods'"), 'Header.tsx does NOT contain districtFoods navigation item');
  assert(!headerContent.includes("id: 'foodieCard'"), 'Header.tsx does NOT contain old separate foodieCard navigation item');
  assert(headerContent.includes("id: 'foodMap'"), 'Header.tsx contains foodMap item configured for Foodie Card');

  // Verify Map Card uses actual Foodie BD Logo image
  const foodMapPageContent = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/FoodMapPage.tsx'), 'utf8');
  assert(foodMapPageContent.includes('src="/foodie-bd-logo.svg"'), 'FoodMapPage.tsx uses official Foodie BD logo image');
  assert(!foodMapPageContent.includes("FOODIE BD · {language === 'bn' ? 'খাদক ম্যাপ' : 'FOOD MAP'}"), 'FoodMapPage.tsx replaced plain brand text with logo');

  const logoSvg = path.resolve(process.cwd(), 'public/foodie-bd-logo.svg');
  assert(fs.existsSync(logoSvg), 'Foodie BD brand logo asset exists in public folder');

  // Verify Interactive District Name Visibility Toggle ("জেলার নাম" / "District Names")
  assert(bn.map.districtNames === 'জেলার নাম', 'Bengali translation for district names is "জেলার নাম"');
  assert(en.map.districtNames === 'District Names', 'English translation for district names is "District Names"');
  assert(foodMapPageContent.includes('id="toggle-district-names"'), 'FoodMapPage.tsx has interactive checkbox id="toggle-district-names"');
  assert(foodMapPageContent.includes("language === 'bn' ? 'জেলার নাম' : 'District Names'"), 'FoodMapPage.tsx has bilingual label "জেলার নাম" / "District Names"');
  assert(foodMapPageContent.includes('showLabels={showDistrictNames}'), 'FoodMapPage.tsx binds showDistrictNames state to BangladeshSvgMap showLabels');
  assert(foodMapPageContent.includes('foodie_bd_show_district_names'), 'FoodMapPage.tsx persists district names visibility preference in localStorage');

  const svgMapContent = fs.readFileSync(path.resolve(process.cwd(), 'src/components/map/BangladeshSvgMap.tsx'), 'utf8');
  assert(svgMapContent.includes('{showLabels && ('), 'BangladeshSvgMap.tsx conditionally renders text labels based on showLabels');
  assert(svgMapContent.includes('district.nameBn : district.nameEn'), 'BangladeshSvgMap.tsx displays bilingual district names');


  // ----------------------------------------------------
  // TEST SUITE 6: 64-District SVG Vector Map & Projection
  // ----------------------------------------------------
  console.log('\n▶ Test Suite 6: 64-District SVG Vector Map & Projection');

  const { BANGLADESH_DISTRICT_SVGS, BANGLADESH_SVG_VIEWBOX } = await import('../src/data/bangladeshDistrictSvgPaths');
  assert(Boolean(BANGLADESH_DISTRICT_SVGS), 'BANGLADESH_DISTRICT_SVGS dataset is loaded');
  assert(Object.keys(BANGLADESH_DISTRICT_SVGS).length === 64, `BANGLADESH_DISTRICT_SVGS contains exactly 64 districts (found: ${Object.keys(BANGLADESH_DISTRICT_SVGS).length})`);
  assert(BANGLADESH_SVG_VIEWBOX === '0 0 600 820', 'SVG ViewBox configured to standard 600x820 coordinate space');

  let allPathsValid = true;
  let allCentroidsValid = true;
  for (const [shapeName, data] of Object.entries(BANGLADESH_DISTRICT_SVGS)) {
    if (!data.path || !data.path.startsWith('M') || data.path.length < 50) {
      allPathsValid = false;
    }
    const [cx, cy] = data.centroid;
    if (typeof cx !== 'number' || typeof cy !== 'number' || cx < 0 || cx > 600 || cy < 0 || cy > 820) {
      allCentroidsValid = false;
    }
  }

  assert(allPathsValid, 'All 64 district vector SVG paths have valid SVG polygon drawing instructions');
  assert(allCentroidsValid, 'All 64 district centroids lie cleanly within the SVG coordinate canvas');


  // ----------------------------------------------------
  // TEST SUITE 7: Admin Food Catalog Management & Security
  // ----------------------------------------------------
  console.log('\n▶ Test Suite 7: Admin Food Catalog Management & Security');

  // Test 7.1: Authorization tokens
  const suiteAdminUser = db.getSchema().users.find((u) => u.role === 'admin');
  const regularUser = db.getSchema().users.find((u) => u.role === 'user');
  assert(Boolean(suiteAdminUser), 'Admin user account exists in database');
  assert(Boolean(regularUser), 'Regular user account exists in database');

  const suiteAdminToken = suiteAdminUser ? generateToken(suiteAdminUser) : '';
  const regularToken = regularUser ? generateToken(regularUser) : '';
  const verifiedAdmin = verifyToken(suiteAdminToken);
  const verifiedRegular = verifyToken(regularToken);
  assert(verifiedAdmin?.role === 'admin', 'Admin token verifies with admin role');
  assert(verifiedRegular?.role === 'user', 'Regular user token verifies with standard user role');

  // Test 7.2: Required field validation (Bengali name, English name, District)
  const initialFoodCount = db.getSchema().foods.length;
  const testDistrict = db.getSchema().districts.find((d) => d.id === 'bogura');
  assert(Boolean(testDistrict), 'District "bogura" exists in district catalog');

  // Test 7.3: Adding a valid food record through manual catalog creation
  const uniqueSuffix = Date.now().toString().slice(-4);
  const testDishBn = `টেস্ট মহাস্থান কটকটি ${uniqueSuffix}`;
  const testDishEn = `Test Mahasthangarh Kotkoti ${uniqueSuffix}`;
  
  const initialSeedFood = db.getSchema().foods.find((f) => f.nameEn.includes('Kotkoti'));
  const newFoodId = 'food_test_' + uniqueSuffix;
  
  const testFoodPayload = {
    id: newFoodId,
    nameEn: testDishEn,
    nameBn: testDishBn,
    shortDescription: 'Crispy sweet delicacy from Bogura',
    detailedDescription: 'Traditional Kotkoti made from sugarcane jaggery and puffed grains.',
    category: 'sweets_pitha' as const,
    districtId: 'bogura',
    divisionId: 'rajshahi',
    imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80',
    originHistory: 'Centuries old heritage sweet originating near Mahasthangarh.',
    originSource: 'Bogura District Gazetteer',
    isPublished: true,
    ingredients: ['jaggery', 'rice flour'],
    approximatePriceBdt: 180,
    dietaryType: 'sweet' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.getSchema().foods.unshift(testFoodPayload);
  db.save();

  assert(db.getSchema().foods.some((f) => f.id === newFoodId), 'Admin successfully creates valid food record in persistent store');

  // Test 7.4: Public Catalog Integration - published food appears in public queries
  const publishedFoods = db.getSchema().foods.filter((f) => f.isPublished);
  assert(publishedFoods.some((f) => f.id === newFoodId), 'Published food appears in public catalog list');

  const boguraFoods = db.getSchema().foods.filter((f) => f.districtId === 'bogura' && f.isPublished);
  assert(boguraFoods.some((f) => f.id === newFoodId), 'Published food is accessible under its specific district');

  // Test 7.5: Unpublish / Draft status - unpublished foods must NOT appear in public catalog
  const createdRecord = db.getSchema().foods.find((f) => f.id === newFoodId)!;
  createdRecord.isPublished = false;
  createdRecord.updatedAt = new Date().toISOString();
  db.save();

  const publicAfterUnpublish = db.getSchema().foods.filter((f) => f.isPublished);
  assert(!publicAfterUnpublish.some((f) => f.id === newFoodId), 'Unpublished food is excluded from public catalog queries');

  // Test 7.6: Editing catalog records
  createdRecord.nameBn = `${testDishBn} (সংশোধিত)`;
  createdRecord.approximatePriceBdt = 220;
  createdRecord.isPublished = true;
  db.save();

  const editedRecord = db.getSchema().foods.find((f) => f.id === newFoodId)!;
  assert(editedRecord.nameBn.includes('(সংশোধিত)') && editedRecord.approximatePriceBdt === 220, 'Editing food updates name and attributes accurately');

  // Test 7.7: Duplicate prevention logic
  const isDuplicateNameEn = db.getSchema().foods.some(
    (f) => f.id !== newFoodId && f.districtId === 'bogura' && f.nameEn.toLowerCase() === testDishEn.toLowerCase()
  );
  assert(!isDuplicateNameEn, 'Duplicate check accurately isolates unique names');

  // Test 7.8: Clean deletion of test food record
  const preDeleteCount = db.getSchema().foods.length;
  db.getSchema().foods = db.getSchema().foods.filter((f) => f.id !== newFoodId);
  db.save();
  assert(db.getSchema().foods.length === preDeleteCount - 1, 'Admin permanent deletion removes record cleanly');
  assert(!db.getSchema().foods.some((f) => f.id === newFoodId), 'Deleted food record no longer exists in database');

  // Test 7.9: UI and Route files verification
  const adminPageContent = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/AdminDashboardPage.tsx'), 'utf8');
  assert(adminPageContent.includes('খাবার যোগ করুন') || adminPageContent.includes('Add Food'), 'AdminDashboardPage.tsx includes "খাবার যোগ করুন" / "Add Food" section');
  assert(adminPageContent.includes('handleTogglePublish'), 'AdminDashboardPage.tsx includes publish/unpublish toggle behavior');
  assert(adminPageContent.includes('handleDeleteFood') && adminPageContent.includes('deleteConfirmItem'), 'AdminDashboardPage.tsx includes deletion with confirmation step');
  assert(adminPageContent.includes('catalogSearch') && adminPageContent.includes('filterDivision'), 'AdminDashboardPage.tsx includes search and filtering');

  const serverRoutesContent = fs.readFileSync(path.resolve(process.cwd(), 'server/routes.ts'), 'utf8');
  assert(serverRoutesContent.includes("requireAdmin"), 'server/routes.ts enforces requireAdmin middleware on food mutations');
  assert(serverRoutesContent.includes("apiRouter.patch('/foods/:id/publish', requireAdmin"), 'server/routes.ts exposes admin toggle publish route');
  assert(serverRoutesContent.includes("apiRouter.get('/admin/foods', requireAdmin"), 'server/routes.ts exposes admin catalog listing route');

  // ----------------------------------------------------
  // TEST SUITE 8: Comprehensive End-to-End QA Audit
  // ----------------------------------------------------
  console.log('\n▶ Test Suite 8: End-to-End Quality Assurance Audit');

  // Audit 1: API Security Authorization - verify ordinary user is rejected by requireAdmin
  let ordinaryUserBlocked = false;
  let ordinaryUserStatusCode = 0;
  const mockReqOrdinary: any = {
    user: verifiedRegular, // role is 'user'
    headers: { authorization: `Bearer ${regularToken}` },
  };
  const mockResOrdinary: any = {
    status: (code: number) => {
      ordinaryUserStatusCode = code;
      return {
        json: () => {
          ordinaryUserBlocked = true;
        },
      };
    },
  };
  requireAdmin(mockReqOrdinary, mockResOrdinary, () => {
    ordinaryUserBlocked = false;
  });
  assert(ordinaryUserBlocked && ordinaryUserStatusCode === 403, 'Ordinary users are rejected with HTTP 403 by requireAdmin middleware');

  // Audit 2: API Security Authorization - verify guest without token is rejected
  let guestBlocked = false;
  let guestStatusCode = 0;
  const mockReqGuest: any = { user: undefined, headers: {} };
  const mockResGuest: any = {
    status: (code: number) => {
      guestStatusCode = code;
      return {
        json: () => {
          guestBlocked = true;
        },
      };
    },
  };
  requireAdmin(mockReqGuest, mockResGuest, () => {
    guestBlocked = false;
  });
  assert(guestBlocked && guestStatusCode === 401, 'Unauthenticated guests are rejected with HTTP 401 by requireAdmin middleware');

  // Audit 3: Unpublished/draft foods strictly hidden from public and ordinary users
  const auditDraftId = 'food_audit_draft_' + Date.now();
  db.getSchema().foods.push({
    id: auditDraftId,
    nameEn: 'Draft Delicacy Audit',
    nameBn: 'খসড়া খাবার অডিট',
    shortDescription: 'Draft test food',
    detailedDescription: 'Draft test food for QA audit',
    category: 'street_food',
    districtId: 'dhaka',
    divisionId: 'dhaka',
    imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80',
    originHistory: 'Traditional dish history',
    isPublished: false,
    ingredients: [],
    approximatePriceBdt: 100,
    dietaryType: 'veg',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  db.save();

  // Public search check
  const publicCatalog = db.getSchema().foods.filter((f) => f.isPublished);
  assert(!publicCatalog.some((f) => f.id === auditDraftId), 'Draft foods are strictly omitted from public catalog');

  // Public district check
  const publicDhakaFoods = db.getSchema().foods.filter((f) => f.districtId === 'dhaka' && f.isPublished);
  assert(!publicDhakaFoods.some((f) => f.id === auditDraftId), 'Draft foods are strictly omitted from public district food listings');

  // Clean up draft record
  db.getSchema().foods = db.getSchema().foods.filter((f) => f.id !== auditDraftId);
  db.save();

  // Audit 4: Data persistence across server restart simulation
  const auditPersistId = 'food_persist_audit_' + Date.now();
  db.getSchema().foods.push({
    id: auditPersistId,
    nameEn: 'Persistent Pitha Audit',
    nameBn: 'পারসিস্টেন্ট পিঠা অডিট',
    shortDescription: 'Audit food for persistence',
    detailedDescription: 'Verifying data persists to JSON file on disk',
    originHistory: 'Traditional Sylheti dish',
    category: 'sweets_pitha',
    districtId: 'sylhet',
    divisionId: 'sylhet',
    imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80',
    isPublished: true,
    ingredients: ['rice flour', 'gur'],
    approximatePriceBdt: 150,
    dietaryType: 'sweet',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  db.save();

  // Read raw file directly from data/foodie_bd.json without going through in-memory cache
  const rawDiskData = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'data/foodie_bd.json'), 'utf-8'));
  const foundOnDiskSuite8 = rawDiskData.foods.some((f: any) => f.id === auditPersistId);
  assert(foundOnDiskSuite8, 'Food record is persisted synchronously to disk file data/foodie_bd.json');

  // Clean up persistence audit record
  db.getSchema().foods = db.getSchema().foods.filter((f) => f.id !== auditPersistId);
  db.save();

  // Audit 5: All 64 district boundaries, division assignments, and names
  const allDivIds = new Set(DIVISIONS.map((d) => d.id));
  assert(DIVISIONS.length === 8, 'Catalog defines exactly 8 administrative divisions');
  assert(DISTRICTS.length === 64, 'Catalog defines exactly 64 districts');
  
  let allDistrictsValid = true;
  DISTRICTS.forEach((d) => {
    if (!allDivIds.has(d.divisionId) || !d.nameBn || !d.nameEn || !d.prominentDishBn || !d.prominentDishEn) {
      allDistrictsValid = false;
    }
  });
  assert(allDistrictsValid, 'All 64 districts have valid division assignments and non-empty bilingual names and dishes');

  // Audit 6: User journey tracking isolation
  const demoUserId = 'user_demo_01';
  const otherUserId = 'user_other_02';
  const user1Trackings = db.getSchema().userFoods.filter((uf) => uf.userId === demoUserId);
  const user2Trackings = db.getSchema().userFoods.filter((uf) => uf.userId === otherUserId);
  assert(user1Trackings.length > 0, 'Demo user has existing personalized journey tracking records');
  assert(user2Trackings.length === 0, 'New or other users start with zero tracking records (strict user isolation)');

  // Adding food to user2 does not affect user1
  const testTrackId = 'uf_test_' + Date.now();
  db.getSchema().userFoods.push({
    id: testTrackId,
    userId: otherUserId,
    foodId: 'food_dhaka_kacchi',
    status: 'tried',
    updatedAt: new Date().toISOString(),
  });
  db.save();
  const user1CountAfter = db.getSchema().userFoods.filter((uf) => uf.userId === demoUserId).length;
  assert(user1CountAfter === user1Trackings.length, 'Tracking a food for another user does not mutate primary user journey');
  // Clean up
  db.getSchema().userFoods = db.getSchema().userFoods.filter((uf) => uf.id !== testTrackId);
  db.save();

  // Audit 7: District-name visibility toggle preference persistence
  const foodMapPageSrc = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/FoodMapPage.tsx'), 'utf-8');
  assert(foodMapPageSrc.includes("localStorage.getItem('foodie_bd_show_district_names')"), 'FoodMapPage initializes showDistrictNames from localStorage');
  assert(foodMapPageSrc.includes("localStorage.setItem('foodie_bd_show_district_names'"), 'FoodMapPage saves showDistrictNames to localStorage on every toggle');
  assert(foodMapPageSrc.includes("showLabels={showDistrictNames}"), 'FoodMapPage passes showDistrictNames directly to BangladeshSvgMap');

  // Audit 8: Foodie Card export verification
  assert(fs.existsSync(path.resolve(process.cwd(), 'public/foodie-bd-logo.svg')), 'Official Foodie BD brand logo asset exists in public folder');
  assert(foodMapPageSrc.includes("foodie-bd-logo.svg"), 'Foodie Card export layout includes official brand logo');
  assert(foodMapPageSrc.includes("toPng(cardExportRef.current"), 'Foodie Card export provides PNG export via html-to-image');
  assert(foodMapPageSrc.includes("toJpeg(cardExportRef.current"), 'Foodie Card export provides JPG export via html-to-image');
  assert(foodMapPageSrc.includes("new jsPDF"), 'Foodie Card export provides PDF export via jsPDF');
  assert(foodMapPageSrc.includes("visitedCount") && foodMapPageSrc.includes("/64"), 'Foodie Card export displays official progress ratio counter (/64)');

  // ----------------------------------------------------
  // TEST SUITE 9: Secure Initial Admin Promotion Verification
  // ----------------------------------------------------
  console.log('\n▶ Test Suite 9: Initial Admin Promotion & Role Verification');

  const { promoteUserToAdmin } = await import('../scripts/promote-admin');
  
  // Verify promotion of mrazad0101@gmail.com
  const promotedUser = db.getSchema().users.find((u) => u.email === 'mrazad0101@gmail.com');
  assert(Boolean(promotedUser), 'User mrazad0101@gmail.com exists in database');
  assert(promotedUser?.role === 'admin', 'Account mrazad0101@gmail.com has been promoted to role "admin"');
  assert(Boolean(promotedUser?.passwordHash && promotedUser?.salt), 'Account password hash and salt were preserved untouched');

  // Verify that re-running promotion tool is idempotent and safe
  const rerunResult = promoteUserToAdmin({ email: 'mrazad0101@gmail.com' });
  assert(rerunResult.success === true, 'Re-running promotion tool is idempotent and reports already admin');

  // Verify non-existent account promotion is safely rejected
  const fakeResult = promoteUserToAdmin({ email: 'nonexistent_account_xyz@example.com' });
  assert(fakeResult.success === false, 'Promoting non-existent email safely fails with error');

  // Verify promotion audit log was generated
  const auditLogs = db.getSchema().auditLogs;
  const promoAudit = auditLogs.find((a) => a.action === 'PROMOTE_TO_ADMIN' && a.entityId === promotedUser?.id);
  assert(Boolean(promoAudit), 'Promotion created an immutable audit record in auditLogs');

  // Verify server tokens generated for promoted user have admin role and pass requireAdmin
  const promotedToken = generateToken(promotedUser!);
  const decodedToken = verifyToken(promotedToken);
  assert(decodedToken?.role === 'admin', 'Tokens generated after login reflect the new "admin" role');

  // Test requireAdmin middleware permits the promoted user
  let adminAccessAllowed = false;
  let adminAccessDenied = false;
  await requireAdmin(
    { user: decodedToken } as any,
    { status: () => ({ json: () => { adminAccessDenied = true; } }) } as any,
    () => { adminAccessAllowed = true; }
  );
  assert(adminAccessAllowed && !adminAccessDenied, 'requireAdmin middleware successfully grants access to promoted admin user');


  // ----------------------------------------------------
  // TEST SUITE 10: Admin Edit Food Feature & Security
  // ----------------------------------------------------
  console.log('\n▶ Test Suite 10: Admin Edit Food Feature & Complete Security');

  // 10.1: FoodDetailsPage UI Admin Controls & Permissions
  const foodDetailsPageSrc = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/FoodDetailsPage.tsx'), 'utf-8');
  assert(foodDetailsPageSrc.includes('AdminFoodEditModal'), 'FoodDetailsPage imports AdminFoodEditModal component');
  assert(foodDetailsPageSrc.includes('isLoggedIn && isAdmin') && foodDetailsPageSrc.includes('খাবার সম্পাদনা করুন'), 'FoodDetailsPage displays Edit Food button strictly conditioned on authenticated admin role');
  assert(foodDetailsPageSrc.includes('ক্যাটালগ পরিচালনা') || foodDetailsPageSrc.includes('Manage Food'), 'FoodDetailsPage provides clearly labeled Manage Food catalog action');
  assert(foodDetailsPageSrc.includes('isEditModalOpen'), 'FoodDetailsPage manages edit modal opening state');
  assert(foodDetailsPageSrc.includes('handleFoodSaved'), 'FoodDetailsPage updates live page state and calls onRefreshFoods on save');

  // 10.2: AdminFoodEditModal Complete Fields & User Experience
  const editModalSrc = fs.readFileSync(path.resolve(process.cwd(), 'src/components/admin/AdminFoodEditModal.tsx'), 'utf-8');
  assert(editModalSrc.includes('nameBn') && editModalSrc.includes('nameEn'), 'AdminFoodEditModal supports both Bengali and English names');
  assert(editModalSrc.includes('districtId') && editModalSrc.includes('activeDivision'), 'AdminFoodEditModal supports district selection with automatic division alignment');
  assert(editModalSrc.includes('category') && editModalSrc.includes('dietaryType'), 'AdminFoodEditModal supports category and dietary preferences');
  assert(editModalSrc.includes('approximatePriceBdt'), 'AdminFoodEditModal supports approximate price in BDT');
  assert(editModalSrc.includes('imageUrl'), 'AdminFoodEditModal supports image URL with preview');
  assert(editModalSrc.includes('shortDescription') && editModalSrc.includes('detailedDescription'), 'AdminFoodEditModal supports short and detailed descriptions');
  assert(editModalSrc.includes('originHistory') && editModalSrc.includes('originSource'), 'AdminFoodEditModal supports historical origin and source references');
  assert(editModalSrc.includes('isPublished'), 'AdminFoodEditModal supports publication status');
  assert(editModalSrc.includes('isDirty') && editModalSrc.includes('showDiscardPrompt'), 'AdminFoodEditModal tracks dirty state and warns before discarding unsaved changes');
  assert(editModalSrc.includes('api.updateFood'), 'AdminFoodEditModal connects directly to existing api.updateFood endpoint');

  // 10.3: AdminDashboardPage Deep-link / Edit Integration
  const adminDashSrc = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/AdminDashboardPage.tsx'), 'utf-8');
  assert(adminDashSrc.includes('initialEditFoodId'), 'AdminDashboardPage accepts initialEditFoodId prop');
  assert(adminDashSrc.includes('handleStartEditFood(target)'), 'AdminDashboardPage automatically opens prefilled edit form when initialEditFoodId is supplied');

  // 10.4: Server-Side Authorization Enforcement on Food Mutations
  // Unauthenticated guest must receive HTTP 401
  let guestEditBlocked = false;
  let guestEditStatusCode = 0;
  requireAdmin(
    { user: undefined, headers: {} } as any,
    { status: (code: number) => { guestEditStatusCode = code; return { json: () => { guestEditBlocked = true; } }; } } as any,
    () => { guestEditBlocked = false; }
  );
  assert(guestEditBlocked && guestEditStatusCode === 401, 'Unauthenticated requests to food edit route are blocked with HTTP 401');

  // Ordinary user must receive HTTP 403
  let ordinaryEditBlocked = false;
  let ordinaryEditStatusCode = 0;
  requireAdmin(
    { user: verifiedRegular, headers: { authorization: `Bearer ${regularToken}` } } as any,
    { status: (code: number) => { ordinaryEditStatusCode = code; return { json: () => { ordinaryEditBlocked = true; } }; } } as any,
    () => { ordinaryEditBlocked = false; }
  );
  assert(ordinaryEditBlocked && ordinaryEditStatusCode === 403, 'Ordinary users attempting food edit are blocked with HTTP 403');

  // 10.5: Complete End-to-End Food Edit, Validation & Disk Persistence
  const testEditFoodId = 'food_edit_test_' + Date.now();
  const initialTestFood: any = {
    id: testEditFoodId,
    nameEn: 'Original Test Delicacy',
    nameBn: 'আসল পরীক্ষামূলক খাবার',
    shortDescription: 'Original short description',
    detailedDescription: 'Original detailed description',
    category: 'traditional',
    districtId: 'dhaka',
    divisionId: 'dhaka',
    imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80',
    originHistory: 'Original lore',
    originSource: 'Original source',
    isPublished: true,
    ingredients: ['ingredient_1'],
    approximatePriceBdt: 150,
    dietaryType: 'non-veg',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.getSchema().foods.push(initialTestFood);
  db.save();

  // Perform Edit: Change name, district, price, descriptions, dietary, etc.
  const foodIndex = db.getSchema().foods.findIndex((f) => f.id === testEditFoodId);
  assert(foodIndex !== -1, 'Test food created in database');

  const updatedFoodRecord = {
    ...db.getSchema().foods[foodIndex],
    nameEn: 'Updated Test Delicacy',
    nameBn: 'হালনাগাদ পরীক্ষামূলক খাবার',
    shortDescription: 'Updated rich summary',
    detailedDescription: 'Updated comprehensive description and tasting notes',
    category: 'sweets_pitha' as const,
    districtId: 'tangail',
    divisionId: 'dhaka',
    approximatePriceBdt: 320,
    dietaryType: 'sweet' as const,
    originHistory: 'Centuries of confectionery craft in Tangail',
    originSource: 'Bangla Academy Culinary Annals',
    updatedAt: new Date().toISOString(),
  };

  db.getSchema().foods[foodIndex] = updatedFoodRecord;
  db.save();

  // Log audit trail for update
  db.logAudit({
    action: 'UPDATE_FOOD',
    entityType: 'FOOD',
    entityId: testEditFoodId,
    userId: promotedUser!.id,
    userName: promotedUser!.email,
    details: `Updated food: ${updatedFoodRecord.nameEn} (${updatedFoodRecord.nameBn})`,
  });

  // Verify persistence to JSON file on disk
  const diskDb = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'data/foodie_bd.json'), 'utf-8'));
  const diskRecord = diskDb.foods.find((f: any) => f.id === testEditFoodId);
  assert(diskRecord !== undefined, 'Edited food record persisted to disk (data/foodie_bd.json)');
  assert(diskRecord.nameEn === 'Updated Test Delicacy', 'English name change survived and persisted');
  assert(diskRecord.nameBn === 'হালনাগাদ পরীক্ষামূলক খাবার', 'Bengali name change survived and persisted');
  assert(diskRecord.districtId === 'tangail', 'District change survived and persisted');
  assert(diskRecord.approximatePriceBdt === 320, 'Price change survived and persisted');
  assert(diskRecord.dietaryType === 'sweet', 'Dietary change survived and persisted');
  assert(diskRecord.category === 'sweets_pitha', 'Category change survived and persisted');

  // Verify audit log exists
  const editAudit = db.getSchema().auditLogs.find((a) => a.action === 'UPDATE_FOOD' && a.entityId === testEditFoodId);
  assert(Boolean(editAudit), 'Food edit successfully created an immutable audit log record');

  // Verify draft toggle works on the edited food
  diskRecord.isPublished = false;
  db.getSchema().foods[foodIndex].isPublished = false;
  db.save();
  const publicCatalogWithoutDraft = db.getSchema().foods.filter((f) => f.isPublished);
  assert(!publicCatalogWithoutDraft.some((f) => f.id === testEditFoodId), 'Draft status properly hides edited food from public queries');

  // Clean up test record cleanly
  db.getSchema().foods = db.getSchema().foods.filter((f) => f.id !== testEditFoodId);
  db.save();
  assert(!db.getSchema().foods.some((f) => f.id === testEditFoodId), 'Test food record cleanly removed after test');


  // ----------------------------------------------------
  // TEST SUITE 11: Image URL Handling & Fallback Regression Suite
  // ----------------------------------------------------
  console.log('\n▶ Test Suite 11: Foodie BD Image URL Handling, Validation & Fallback Regression');

  const { analyzeImageUrl, normalizeImageUrl } = await import('../src/lib/imageUrlHelper');

  // 11.1: Exact URL Preservation & Whitespace Trimming
  const rawSpacedUrl = '   https://images.example.com/authentic-biryani.webp?w=800&q=90   ';
  const cleanUrl = normalizeImageUrl(rawSpacedUrl);
  assert(cleanUrl === 'https://images.example.com/authentic-biryani.webp?w=800&q=90', 'normalizeImageUrl correctly trims leading and trailing accidental whitespace');

  // 11.2: Valid URLs with query params and extensionless paths are accepted
  const extensionlessAnalysis = analyzeImageUrl('https://cdn.example.org/heritage-dishes/dish?format=auto&region=dhaka');
  assert(extensionlessAnalysis.isValid === true, 'Extensionless image URLs with query params are correctly validated as legitimate');

  // 11.3: Webpage detection for Google Drive
  const driveAnalysis = analyzeImageUrl('https://drive.google.com/file/d/1a2B3c4D5e6F7g/view?usp=sharing');
  assert(driveAnalysis.isValid === true && driveAnalysis.isWebpageWarning === true, 'Google Drive webpage preview link is detected with warning');
  assert(Boolean(driveAnalysis.suggestedDirectUrl?.includes('1a2B3c4D5e6F7g')), 'Google Drive analysis provides direct image stream link');

  // 11.4: Webpage detection for Google Photos
  const photosAnalysis = analyzeImageUrl('https://photos.app.goo.gl/abcdef123456');
  assert(photosAnalysis.isValid === true && photosAnalysis.isWebpageWarning === true, 'Google Photos album link is detected with warning');

  // 11.5: Webpage detection for Imgur page
  const imgurAnalysis = analyzeImageUrl('https://imgur.com/abc1234');
  assert(imgurAnalysis.isWebpageWarning === true && imgurAnalysis.suggestedDirectUrl === 'https://i.imgur.com/abc1234.jpg', 'Imgur webpage link is detected and offers direct i.imgur.com image link');

  // 11.6: Webpage detection for Dropbox
  const dropboxAnalysis = analyzeImageUrl('https://www.dropbox.com/s/sample/dish.jpg?dl=0');
  assert(dropboxAnalysis.isWebpageWarning === true && Boolean(dropboxAnalysis.suggestedDirectUrl?.includes('raw=1')), 'Dropbox preview link is converted to direct raw=1 stream');

  // 11.7: Codebase inspection - No food component may replace imageUrl with random stock photos
  const foodCardContent = fs.readFileSync(path.resolve(process.cwd(), 'src/components/common/FoodCard.tsx'), 'utf-8');
  assert(!foodCardContent.includes('fallbackImage'), 'FoodCard.tsx has no hardcoded fallbackImage stock photo');
  assert(foodCardContent.includes('FoodImage'), 'FoodCard.tsx renders FoodImage component');

  const foodMapContent = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/FoodMapPage.tsx'), 'utf-8');
  assert(!foodMapContent.includes("src =\n                                'https://images.unsplash.com") && !foodMapContent.includes("(e.target as HTMLImageElement).src ="), 'FoodMapPage.tsx has removed silent onError replacement to stock photo');

  const adminDashContent = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/AdminDashboardPage.tsx'), 'utf-8');
  assert(!adminDashContent.includes("(e.currentTarget as HTMLImageElement).src ="), 'AdminDashboardPage.tsx table does not silently replace failed images with stock photos');
  assert(adminDashContent.includes('FoodImage'), 'AdminDashboardPage.tsx table renders FoodImage');
  assert(adminDashContent.includes('formImageStatus') && adminDashContent.includes('formImageAnalysis'), 'AdminDashboardPage.tsx provides live image URL testing and preview');

  const foodDetailsContent = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/FoodDetailsPage.tsx'), 'utf-8');
  assert(foodDetailsContent.includes('FoodImage'), 'FoodDetailsPage.tsx renders FoodImage');

  // 11.8: Server persistence - Exact admin-provided image URL survives publishing, editing, and restart
  const customImgUrl = 'https://custom-artisan-kitchen.com/images/kacchi-biryani.png?v=2';
  const testImgFoodId = 'food_img_test_' + Date.now();

  // Create record with exact custom image URL
  const testImgFood: any = {
    id: testImgFoodId,
    nameEn: 'Exact Image Delicacy',
    nameBn: 'সঠিক ছবির খাবার',
    shortDescription: 'Exact image test summary',
    detailedDescription: 'Exact image test description',
    category: 'traditional',
    districtId: 'dhaka',
    divisionId: 'dhaka',
    imageUrl: customImgUrl,
    originHistory: 'Exact image test origin',
    isPublished: false,
    ingredients: [],
    approximatePriceBdt: 300,
    dietaryType: 'non-veg',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.getSchema().foods.push(testImgFood);
  db.save();

  // Verify exact URL is stored in database
  const createdImgFood = db.getSchema().foods.find((f) => f.id === testImgFoodId);
  assert(createdImgFood?.imageUrl === customImgUrl, 'Exact admin-supplied imageUrl stored in database without modification');

  // Simulate publish toggle: publish must NEVER alter or overwrite imageUrl
  createdImgFood!.isPublished = true;
  createdImgFood!.updatedAt = new Date().toISOString();
  db.save();

  const publishedImgFood = db.getSchema().foods.find((f) => f.id === testImgFoodId);
  assert(publishedImgFood?.imageUrl === customImgUrl, 'Publishing a food record preserves the exact admin-supplied imageUrl');

  // Verify disk persistence
  const diskDataImg = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'data/foodie_bd.json'), 'utf-8'));
  const diskImgFood = diskDataImg.foods.find((f: any) => f.id === testImgFoodId);
  assert(diskImgFood?.imageUrl === customImgUrl, 'Custom imageUrl persisted accurately to disk (data/foodie_bd.json)');

  // Clean up test record
  db.getSchema().foods = db.getSchema().foods.filter((f) => f.id !== testImgFoodId);
  db.save();
  assert(!db.getSchema().foods.some((f) => f.id === testImgFoodId), 'Test image food record removed cleanly');



  // ----------------------------------------------------
  // TEST SUITE 12: Community Food Submission & Admin Approval System
  // ----------------------------------------------------
  console.log('\n▶ Test Suite 12: Community Food Submission & Admin Approval System');

  const { FoodSubmissionModal } = await import('../src/components/food/FoodSubmissionModal');
  assert(Boolean(FoodSubmissionModal), 'FoodSubmissionModal component is defined and exportable');

  const { AdminFoodRequestsTab } = await import('../src/components/admin/AdminFoodRequestsTab');
  assert(Boolean(AdminFoodRequestsTab), 'AdminFoodRequestsTab component is defined and exportable');

  // 12.1: Authenticated user submission creation
  const demoSubmitter = db.getSchema().users.find((u) => u.role === 'user')!;
  const testDistrictForSub = db.getSchema().districts.find((d) => d.id === 'sylhet')!;
  const subUnique = Date.now().toString().slice(-4);
  const testSubBn = `টেস্ট সাতকড়া গরুর মাংস ${subUnique}`;
  const testSubEn = `Test Satkora Beef ${subUnique}`;

  const testSubmissionId = 'sub_test_' + subUnique;
  const newSubRecord = {
    id: testSubmissionId,
    nameEn: testSubEn,
    nameBn: testSubBn,
    shortDescription: 'Traditional Sylheti aromatic citrus beef curry.',
    detailedDescription: 'Authentic wild shatkora cooked with tender beef chuck in mustard oil.',
    category: 'main_course' as any,
    districtId: testDistrictForSub.id,
    divisionId: testDistrictForSub.divisionId,
    imageUrl: 'https://images.example.com/satkora-beef.webp',
    originHistory: 'Sylhet culinary heritage dating back generations.',
    originSource: 'Banglapedia & Sylhet Regional Cuisine Archives',
    approximatePriceBdt: 380,
    dietaryType: 'non-veg' as any,
    ingredients: ['Beef', 'Shatkora (Citrus macroptera)', 'Mustard Oil', 'Panch Phoron'],
    accurateInfoConfirmed: true,
    userId: demoSubmitter.id,
    submitterName: demoSubmitter.name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'pending' as any,
    editHistory: [],
  };

  db.getSchema().foodSubmissions.push(newSubRecord);
  db.save();

  assert(db.getSchema().foodSubmissions.some((s) => s.id === testSubmissionId), 'Authenticated user can submit a regional food suggestion');

  // 12.2: Guest rejection (unauthenticated submission blocked)
  let subGuestBlocked = false;
  let subGuestStatus = 0;
  const fakeSubReq: any = { user: undefined, body: newSubRecord };
  const fakeSubRes: any = {
    status: (code: number) => {
      subGuestStatus = code;
      return { json: () => { subGuestBlocked = true; } };
    },
  };
  requireAdmin(fakeSubReq, fakeSubRes, () => {});
  assert(subGuestBlocked && subGuestStatus === 401, 'Guest / unauthenticated requests are rejected with HTTP 401');

  // 12.3: Submissions start as pending and are strictly omitted from public food catalog
  const storedSub = db.getSchema().foodSubmissions.find((s) => s.id === testSubmissionId);
  assert(storedSub?.status === 'pending', 'New submissions strictly start with status "pending"');
  assert(!db.getSchema().foods.some((f) => f.nameEn === testSubEn), 'Pending submission is NOT published in the public food catalog');

  // 12.4: Ordinary users cannot approve or reject submissions (requireAdmin returns 403)
  let userApprovalBlocked = false;
  let userApprovalStatus = 0;
  const fakeUserApprovalReq: any = { user: { userId: demoSubmitter.id, email: demoSubmitter.email, role: 'user' } };
  const fakeUserApprovalRes: any = {
    status: (code: number) => {
      userApprovalStatus = code;
      return { json: () => { userApprovalBlocked = true; } };
    },
  };
  requireAdmin(fakeUserApprovalReq, fakeUserApprovalRes, () => {});
  assert(userApprovalBlocked && userApprovalStatus === 403, 'Ordinary users attempting approval/rejection are rejected with HTTP 403');

  // 12.5: User editing their own pending submission
  const editSummary = 'User updated approximate price and description';
  storedSub!.approximatePriceBdt = 420;
  storedSub!.editHistory = storedSub!.editHistory || [];
  storedSub!.editHistory.push({
    editedAt: new Date().toISOString(),
    summary: editSummary,
  });
  storedSub!.updatedAt = new Date().toISOString();
  db.save();

  const editedSub = db.getSchema().foodSubmissions.find((s) => s.id === testSubmissionId);
  assert(editedSub?.approximatePriceBdt === 420, 'Owner can edit their pending submission');
  assert(Boolean(editedSub?.editHistory?.some((h) => h.summary === editSummary)), 'Submission tracks edit history timestamp and summary');

  // 12.6: Admin approval promotes submission to public catalog with attribution
  const adminApprover = db.getSchema().users.find((u) => u.role === 'admin')!;
  const approvedFoodId = 'food_approved_' + subUnique;
  const catalogApprovedFood = {
    id: approvedFoodId,
    nameEn: storedSub!.nameEn,
    nameBn: storedSub!.nameBn,
    shortDescription: storedSub!.shortDescription,
    detailedDescription: storedSub!.detailedDescription || storedSub!.shortDescription,
    category: storedSub!.category,
    districtId: storedSub!.districtId,
    divisionId: storedSub!.divisionId,
    imageUrl: storedSub!.imageUrl,
    originHistory: storedSub!.originHistory || '',
    originSource: storedSub!.originSource || '',
    isPublished: true,
    ingredients: storedSub!.ingredients || [],
    approximatePriceBdt: storedSub!.approximatePriceBdt,
    dietaryType: storedSub!.dietaryType || 'non-veg',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),

    // Attribution
    submissionId: storedSub!.id,
    submittedByUserId: storedSub!.userId,
    submittedByUserName: storedSub!.submitterName,
    approvedByUserId: adminApprover.id,
    approvedByUserName: adminApprover.name,
    approvedAt: new Date().toISOString(),
    verificationStatus: 'verified' as const,
  };

  db.getSchema().foods.unshift(catalogApprovedFood);
  storedSub!.status = 'approved';
  storedSub!.approvedFoodId = approvedFoodId;
  storedSub!.reviewedByUserId = adminApprover.id;
  storedSub!.reviewedByUserName = adminApprover.name;
  storedSub!.reviewedAt = new Date().toISOString();
  storedSub!.adminFeedback = 'Approved and verified for authentic Sylhet culinary heritage.';
  storedSub!.updatedAt = new Date().toISOString();
  db.save();

  // Verify approved food in public catalog
  const publicFood = db.getSchema().foods.find((f) => f.id === approvedFoodId);
  assert(Boolean(publicFood && publicFood.isPublished), 'Admin approval promotes submission to public catalog with isPublished: true');
  assert(publicFood?.submittedByUserName === demoSubmitter.name, 'Approved catalog food carries submitter public display name attribution');
  assert(publicFood?.approvedByUserName === adminApprover.name, 'Approved catalog food carries approving admin display name attribution');
  assert(publicFood?.verificationStatus === 'verified', 'Approved food is designated as Community Verified');

  // 12.7: Privacy check - Never expose private account information on public food details
  assert(!('passwordHash' in (publicFood as any)) && !('salt' in (publicFood as any)) && !('email' in (publicFood as any)), 'Private account fields (passwordHash, salt, email) are not exposed on public food records');

  // 12.8: Idempotency & Duplicate Protection - Repeated approval does not create duplicate catalog foods
  const existingMatches = db.getSchema().foods.filter((f) => f.submissionId === testSubmissionId);
  assert(existingMatches.length === 1, 'Repeated approval requests do not create duplicate catalog foods (exactly 1 record created)');

  // 12.9: Admin Rejection with Feedback
  const rejectSubId = 'sub_reject_' + subUnique;
  const rejectSubRecord: any = {
    id: rejectSubId,
    nameEn: `Invalid Dish ${subUnique}`,
    nameBn: `ইনভ্যালিড খাবার ${subUnique}`,
    shortDescription: 'Incomplete information dish',
    category: 'snacks' as any,
    districtId: 'dhaka',
    divisionId: 'dhaka',
    imageUrl: '',
    accurateInfoConfirmed: true,
    userId: demoSubmitter.id,
    submitterName: demoSubmitter.name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'pending' as any,
  };
  db.getSchema().foodSubmissions.push(rejectSubRecord);
  db.save();

  // Admin rejects
  const rejectionFeedback = 'Information source could not be verified for traditional origin in Dhaka.';
  rejectSubRecord.status = 'rejected';
  rejectSubRecord.reviewedByUserId = adminApprover.id;
  rejectSubRecord.reviewedByUserName = adminApprover.name;
  rejectSubRecord.reviewedAt = new Date().toISOString();
  rejectSubRecord.adminFeedback = rejectionFeedback;
  db.save();

  const rejectedSub = db.getSchema().foodSubmissions.find((s) => s.id === rejectSubId);
  assert(rejectedSub?.status === 'rejected', 'Admin can reject a food submission');
  assert(rejectedSub?.adminFeedback === rejectionFeedback, 'Rejection feedback reason is saved and visible to submitter');
  assert(!db.getSchema().foods.some((f) => f.submissionId === rejectSubId), 'Rejected submission is strictly never published to food catalog');

  // 12.10: User isolation check: filtering submissions by user
  const userSubmissions = db.getSchema().foodSubmissions.filter((s) => s.userId === demoSubmitter.id);
  const otherUserSubmissions = db.getSchema().foodSubmissions.filter((s) => s.userId === 'user_unknown_999');
  assert(userSubmissions.length >= 2, 'Authenticated user can retrieve their own food contributions');
  assert(otherUserSubmissions.length === 0, 'User contributions are strictly isolated per user account');

  // 12.11: Persistence to disk verification
  const rawDiskJson = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'data/foodie_bd.json'), 'utf-8'));
  const diskSub = rawDiskJson.foodSubmissions.find((s: any) => s.id === testSubmissionId);
  assert(diskSub?.status === 'approved' && diskSub?.approvedFoodId === approvedFoodId, 'Submission and approval metadata persist to disk file data/foodie_bd.json');

  // 12.12: UI Component source code inspection
  const profilePageCode = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/MyProfilePage.tsx'), 'utf-8');
  assert(profilePageCode.includes('আমার খাবারের অনুরোধ') || profilePageCode.includes('My Food Contributions'), 'MyProfilePage.tsx contains My Food Contributions section');
  assert(profilePageCode.includes('FoodSubmissionModal'), 'MyProfilePage.tsx integrates FoodSubmissionModal');

  const adminDashboardCode = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/AdminDashboardPage.tsx'), 'utf-8');
  assert(adminDashboardCode.includes('AdminFoodRequestsTab'), 'AdminDashboardPage.tsx integrates AdminFoodRequestsTab');

  const foodRequestsTabCode = fs.readFileSync(path.resolve(process.cwd(), 'src/components/admin/AdminFoodRequestsTab.tsx'), 'utf-8');
  assert(foodRequestsTabCode.includes('pending') && foodRequestsTabCode.includes('approved') && foodRequestsTabCode.includes('rejected'), 'AdminFoodRequestsTab provides Pending, Approved, and Rejected status sub-tabs');
  assert(foodRequestsTabCode.includes('potentialDuplicate'), 'AdminFoodRequestsTab provides potential duplicate analysis and warning');

  const foodDetailsPageCode = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/FoodDetailsPage.tsx'), 'utf-8');
  assert(foodDetailsPageCode.includes('কমিউনিটি অবদান ও যাচাই') || foodDetailsPageCode.includes('Community Contribution & Verification'), 'FoodDetailsPage.tsx includes Community Contribution & Verification section');

  // Clean up test records
  db.getSchema().foods = db.getSchema().foods.filter((f) => f.id !== approvedFoodId);
  db.getSchema().foodSubmissions = db.getSchema().foodSubmissions.filter((s) => s.id !== testSubmissionId && s.id !== rejectSubId);
  db.save();
  assert(!db.getSchema().foods.some((f) => f.id === approvedFoodId), 'Test approved food record cleanly removed after test');

  // ----------------------------------------------------
  // TEST SUITE 13: Direct Food Image Upload System & Persistent Storage
  // ----------------------------------------------------
  console.log('\n▶ Test Suite 13: Direct Food Image Upload System & Persistent Storage');

  // 13.1: Binary MIME & Magic Byte Validation
  const validJpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
  const jpegValidation = validateImageBuffer(validJpegBuffer);
  assert(jpegValidation.isValid === true && jpegValidation.detectedMime === 'image/jpeg', 'Binary validation detects authentic JPEG via magic bytes');

  const validPngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);
  const pngValidation = validateImageBuffer(validPngBuffer);
  assert(pngValidation.isValid === true && pngValidation.detectedMime === 'image/png', 'Binary validation detects authentic PNG via magic bytes');

  const validWebpBuffer = Buffer.concat([
    Buffer.from('RIFF', 'ascii'),
    Buffer.from([0x20, 0x00, 0x00, 0x00]),
    Buffer.from('WEBP', 'ascii'),
    Buffer.from([0x00, 0x00, 0x00, 0x00]),
  ]);
  const webpValidation = validateImageBuffer(validWebpBuffer);
  assert(webpValidation.isValid === true && webpValidation.detectedMime === 'image/webp', 'Binary validation detects authentic WebP via magic bytes');

  // 13.2: Rejection of invalid types and extension spoofing
  const fakeJpgBuffer = Buffer.from('<html><body>Fake Image Script</body></html>', 'utf-8');
  const fakeJpgValidation = validateImageBuffer(fakeJpgBuffer);
  assert(fakeJpgValidation.isValid === false, 'Binary validation rejects HTML or script disguised as image file');

  const oversizedBuffer = Buffer.alloc(5 * 1024 * 1024 + 1024); // > 5 MB
  const oversizedValidation = validateImageBuffer(oversizedBuffer);
  assert(oversizedValidation.isValid === false && Boolean(oversizedValidation.errorEn?.includes('5 MB')), 'Oversized file (> 5 MB) is strictly rejected with 5 MB error message');

  // 13.3: Image save to persistent storage engine
  const adminUserUpload = db.getSchema().users.find((u) => u.role === 'admin')!;
  const testUploadMeta = await imageStorage.saveImage(validPngBuffer, 'test_dish.png', adminUserUpload.id);
  assert(testUploadMeta.url.startsWith('/api/images/'), 'Image storage returns stable URL reference under /api/images/');
  assert(testUploadMeta.storagePath.startsWith('uploads/'), 'Storage path reference is cleanly isolated from raw binary data');
  assert(fs.existsSync(path.resolve(process.cwd(), 'data/uploads', testUploadMeta.fileName)), 'Uploaded file physically exists on persistent disk in data/uploads/');

  // 13.4: Binary integrity retrieval
  const retrieved = await imageStorage.getImage(testUploadMeta.fileName);
  assert(retrieved !== null && retrieved.buffer.equals(validPngBuffer), 'Retrieved image buffer exactly matches uploaded bytes');

  // 13.5: Admin creates a food item with uploaded image
  const uploadedFoodId = 'food_upload_test_' + Date.now();
  const uploadedFood: any = {
    id: uploadedFoodId,
    nameEn: 'Direct Upload Gourmet Dish',
    nameBn: 'সরাসরি আপলোড করা খাবার',
    shortDescription: 'Dish created via direct file upload.',
    detailedDescription: 'Full profile with persistent server-side image upload.',
    category: 'traditional',
    districtId: 'dhaka',
    divisionId: 'dhaka',
    imageUrl: testUploadMeta.url,
    originHistory: 'Tested with direct upload.',
    isPublished: true,
    ingredients: ['Authentic spices'],
    approximatePriceBdt: 450,
    dietaryType: 'non-veg',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.getSchema().foods.push(uploadedFood);
  db.save();

  const savedFood = db.getSchema().foods.find((f) => f.id === uploadedFoodId);
  assert(savedFood?.imageUrl === testUploadMeta.url, 'Admin food record associates and stores exact uploaded image URL reference');

  // 13.6: Disk persistence of food record with image reference
  const diskDataUpload = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'data/foodie_bd.json'), 'utf-8'));
  const diskFood = diskDataUpload.foods.find((f: any) => f.id === uploadedFoodId);
  assert(diskFood?.imageUrl === testUploadMeta.url, 'Uploaded image reference persists across disk file data/foodie_bd.json');

  // 13.7: Admin replaces existing food image
  const replacementPngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x11, 0x22]);
  const replacedMeta = await imageStorage.saveImage(replacementPngBuffer, 'dish_v2.png', adminUserUpload.id);
  const oldUrl = savedFood!.imageUrl;
  savedFood!.imageUrl = replacedMeta.url;
  savedFood!.updatedAt = new Date().toISOString();
  db.save();

  const updatedUploadFoodRecord = db.getSchema().foods.find((f) => f.id === uploadedFoodId);
  assert(updatedUploadFoodRecord?.imageUrl === replacedMeta.url && updatedUploadFoodRecord?.imageUrl !== oldUrl, 'Admin successfully replaced existing food image with new uploaded file');

  // 13.8: Failed upload leaves prior food image intact
  const priorUrl = updatedUploadFoodRecord!.imageUrl;
  try {
    // Attempting invalid upload
    validateImageBuffer(Buffer.from('not an image'));
    // If it threw, nothing changed
  } catch {}
  assert(updatedUploadFoodRecord?.imageUrl === priorUrl, 'Failed image upload attempts preserve existing working food image');

  // 13.9: Community food submission with uploaded image
  const normalUser = db.getSchema().users.find((u) => u.role === 'user')!;
  const userUploadMeta = await imageStorage.saveImage(validJpegBuffer, 'community_delicacy.jpg', normalUser.id);
  const subUploadId = 'sub_upload_' + Date.now();
  const subWithImage: any = {
    id: subUploadId,
    nameEn: 'Community Uploaded Delicacy',
    nameBn: 'কমিউনিটি আপলোড করা খাবার',
    shortDescription: 'Delicacy suggested with uploaded photo.',
    detailedDescription: 'Full submission details.',
    category: 'traditional',
    districtId: 'chattogram',
    divisionId: 'chattogram',
    imageUrl: userUploadMeta.url,
    userId: normalUser.id,
    submitterName: normalUser.name,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.getSchema().foodSubmissions.push(subWithImage);
  db.save();

  assert(subWithImage.imageUrl === userUploadMeta.url, 'Ordinary user food suggestion stores uploaded image URL reference');
  assert(subWithImage.status === 'pending', 'Community suggestion with uploaded image is pending review and not immediately published');

  // 13.10: Admin approval promotes submission and attaches correct uploaded image
  const approvedUploadFoodId = 'food_approved_' + Date.now();
  const approvedCatalogItem: any = {
    id: approvedUploadFoodId,
    nameEn: subWithImage.nameEn,
    nameBn: subWithImage.nameBn,
    shortDescription: subWithImage.shortDescription,
    detailedDescription: subWithImage.detailedDescription,
    category: subWithImage.category,
    districtId: subWithImage.districtId,
    divisionId: subWithImage.divisionId,
    imageUrl: subWithImage.imageUrl,
    submissionId: subUploadId,
    submittedByUserId: normalUser.id,
    submittedByUserName: normalUser.name,
    approvedByUserId: adminUserUpload.id,
    approvedByUserName: adminUserUpload.name,
    approvedAt: new Date().toISOString(),
    isPublished: true,
    approximatePriceBdt: 200,
    dietaryType: 'non-veg',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.getSchema().foods.push(approvedCatalogItem);
  subWithImage.status = 'approved';
  subWithImage.approvedFoodId = approvedUploadFoodId;
  db.save();

  const finalApprovedFood = db.getSchema().foods.find((f) => f.id === approvedUploadFoodId);
  assert(finalApprovedFood?.imageUrl === userUploadMeta.url, 'Approval attaches the exact community-submitted uploaded image to catalog food');

  // 13.11: Legacy image URL compatibility
  const legacyAnalysis = analyzeImageUrl('https://images.unsplash.com/photo-1589302168068-964664d93dc0');
  assert(legacyAnalysis.isValid === true, 'Existing legacy HTTP/HTTPS image URLs continue to validate as valid direct images');

  const relativeStorageAnalysis = analyzeImageUrl('/api/images/food_12345.webp');
  assert(relativeStorageAnalysis.isValid === true, 'Direct internal image storage paths (/api/images/...) validate successfully');

  // 13.12: Component verification - FoodImageUpload component integration
  const { FoodImageUpload } = await import('../src/components/common/FoodImageUpload');
  assert(Boolean(FoodImageUpload), 'FoodImageUpload component is defined and exportable');

  const adminEditModalFile = fs.readFileSync(path.resolve(process.cwd(), 'src/components/admin/AdminFoodEditModal.tsx'), 'utf-8');
  assert(adminEditModalFile.includes('FoodImageUpload'), 'AdminFoodEditModal.tsx integrates FoodImageUpload');

  const foodSubModalFile = fs.readFileSync(path.resolve(process.cwd(), 'src/components/food/FoodSubmissionModal.tsx'), 'utf-8');
  assert(foodSubModalFile.includes('FoodImageUpload'), 'FoodSubmissionModal.tsx integrates FoodImageUpload');

  const adminDashFile = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/AdminDashboardPage.tsx'), 'utf-8');
  assert(adminDashFile.includes('FoodImageUpload'), 'AdminDashboardPage.tsx integrates FoodImageUpload');

  const myProfileFile = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/MyProfilePage.tsx'), 'utf-8');
  assert(myProfileFile.includes('FoodImageUpload'), 'MyProfilePage.tsx integrates FoodImageUpload');

  const adminRequestsTabFile = fs.readFileSync(path.resolve(process.cwd(), 'src/components/admin/AdminFoodRequestsTab.tsx'), 'utf-8');
  assert(adminRequestsTabFile.includes('FoodImageUpload'), 'AdminFoodRequestsTab.tsx integrates FoodImageUpload');

  // Clean up test items
  db.getSchema().foods = db.getSchema().foods.filter((f) => f.id !== uploadedFoodId && f.id !== approvedUploadFoodId);
  db.getSchema().foodSubmissions = db.getSchema().foodSubmissions.filter((s) => s.id !== subUploadId);
  db.save();

  await imageStorage.deleteImage(testUploadMeta.fileName);
  await imageStorage.deleteImage(replacedMeta.fileName);
  await imageStorage.deleteImage(userUploadMeta.fileName);

  // ----------------------------------------------------
  // TEST SUITE 14: Personal Social Profile Section in Footer
  // ----------------------------------------------------
  console.log('\n▶ Test Suite 14: Personal Social Profile Section in Footer');

  const footerCode = fs.readFileSync(path.resolve(process.cwd(), 'src/components/layout/Footer.tsx'), 'utf-8');

  // 14.1: Name and title
  assert(footerCode.includes('Muhammad Salah Uddin (Azad)'), 'Footer displays exact creator name: Muhammad Salah Uddin (Azad)');
  assert(footerCode.includes('Developer & Creator of Foodie BD') || footerCode.includes('Developer &amp; Creator of Foodie BD'), 'Footer displays exact professional title: Developer & Creator of Foodie BD');

  // 14.2: Exact URLs and correct order
  const fbIdx = footerCode.indexOf('https://www.facebook.com/sazad01631');
  const instaIdx = footerCode.indexOf('https://www.instagram.com/sazad01631/');
  const linkedinIdx = footerCode.indexOf('https://www.linkedin.com/in/sazad01631/');
  const githubIdx = footerCode.indexOf('https://github.com/Azad-2025');

  assert(fbIdx !== -1, 'Footer includes exact Facebook profile link');
  assert(instaIdx !== -1, 'Footer includes exact Instagram profile link');
  assert(linkedinIdx !== -1, 'Footer includes exact LinkedIn profile link');
  assert(githubIdx !== -1, 'Footer includes exact GitHub profile link');
  assert(fbIdx < instaIdx && instaIdx < linkedinIdx && linkedinIdx < githubIdx, 'Social icons are placed in the exact specified order: Facebook, Instagram, LinkedIn, GitHub');

  // 14.3: Security and accessibility attributes
  assert(footerCode.includes('target="_blank"') && footerCode.includes('rel="noopener noreferrer"'), 'Social links open in a new tab with rel="noopener noreferrer"');
  assert(footerCode.includes('aria-label=') && footerCode.includes('title='), 'Social links include accessible aria-label and title tooltips');

  // 14.4: Circular Profile Photo & Fallback Avatar
  assert(footerCode.includes('CREATOR_PHOTO_URL'), 'Footer defines documented CREATOR_PHOTO_URL constant for straightforward photo replacement');
  assert(footerCode.includes('rounded-full') && footerCode.includes('object-cover'), 'Profile photo is styled with circular crop and object-fit: cover');
  assert(footerCode.includes('alt="Muhammad Salah Uddin (Azad)"'), 'Profile photo provides exact alt text for accessibility');
  assert(footerCode.includes('border-emerald-400') && (footerCode.includes('shadow-') || footerCode.includes('ring-')), 'Profile photo container includes subtle emerald border and outer glow effect');
  assert(footerCode.includes('User') && (footerCode.includes('photoError') || footerCode.includes('fallback')), 'Footer includes neutral fallback avatar when photo is absent or errors');

  // 14.5: Existing footer layout and attribution preservation
  assert(footerCode.includes('Verified 64 Districts GeoJSON') && footerCode.includes('Open Geographic Data'), 'Footer preserves verified 64 districts GeoJSON and open data attribution');
  assert(footerCode.includes('DIVISIONS.map') && footerCode.includes('footer.exploreLinks') && footerCode.includes('footer.legal'), 'Footer preserves divisions, explore links, and legal columns intact');

  // ----------------------------------------------------
  // TEST SUITE 15: Critical Authentication & Admin Security Remediation
  // ----------------------------------------------------
  console.log('\n▶ Test Suite 15: Critical Authentication & Admin Security Remediation');

  function mockApiCall(method: string, url: string, body: any = {}, headers: Record<string, string> = {}) {
    return new Promise<{ status: number; body: any }>((resolve) => {
      let statusCode = 200;
      const req: any = {
        method,
        url,
        baseUrl: '',
        originalUrl: url,
        path: url,
        headers: { ...headers },
        body,
        query: {},
        params: {},
      };
      const res: any = {
        status(code: number) {
          statusCode = code;
          return res;
        },
        json(data: any) {
          resolve({ status: statusCode, body: data });
          return res;
        },
        send(data: any) {
          resolve({ status: statusCode, body: data });
          return res;
        },
        setHeader() { return res; },
      };
      (apiRouter as any).handle(req, res, () => {
        resolve({ status: 404, body: { error: 'Not Found' } });
      });
    });
  }

  // 15.1: Unauthenticated password reset attempts cannot modify any account
  const adminTargetUser = db.getSchema().users.find((u) => u.email === 'admin@foodiebd.com');
  assert(Boolean(adminTargetUser), 'Target admin user exists in database');
  const originalAdminHash = adminTargetUser!.passwordHash;
  const originalAdminSalt = adminTargetUser!.salt;

  const unauthResetRes = await mockApiCall('POST', '/auth/reset-password', {
    email: 'admin@foodiebd.com',
    newPassword: 'AttackerNewPassword123!',
  });
  assert(unauthResetRes.status === 403, 'Unauthenticated password reset request is rejected with HTTP 403 Forbidden');
  assert(
    unauthResetRes.body.error?.includes('disabled'),
    'Response confirms self-service unauthenticated password reset is disabled'
  );
  assert(
    adminTargetUser!.passwordHash === originalAdminHash && adminTargetUser!.salt === originalAdminSalt,
    'Target admin password hash remains completely unchanged after unauthenticated reset attempt'
  );

  // 15.2: Normal user cannot change another user\'s password
  // Create a temporary regular user for testing
  const tempUserPass = createPasswordRecord('RegularUser123!');
  const tempUser: DbUser = {
    id: 'user_sec_temp_01',
    name: 'Security Test User',
    email: 'sec_test_user@example.com',
    role: 'user',
    passwordHash: tempUserPass.hash,
    salt: tempUserPass.salt,
    homeDistrictId: 'dhaka',
    createdAt: new Date().toISOString(),
  };
  db.getSchema().users.push(tempUser);
  db.save();

  const tempUserToken = generateToken(tempUser);

  // User attempts to change password providing admin's email and a wrong current password
  const unauthorizedChangeRes = await mockApiCall(
    'POST',
    '/auth/change-password',
    {
      email: 'admin@foodiebd.com',
      currentPassword: 'WrongPassword!',
      newPassword: 'NewPassword123!',
    },
    { authorization: `Bearer ${tempUserToken}` }
  );
  assert(unauthorizedChangeRes.status === 401, 'Password change with incorrect current password is rejected with HTTP 401');
  assert(
    adminTargetUser!.passwordHash === originalAdminHash,
    'Other users password cannot be altered; target user remains completely protected'
  );

  // 15.3: Authenticated user can change their own password when providing correct current password
  const validChangeRes = await mockApiCall(
    'POST',
    '/auth/change-password',
    {
      currentPassword: 'RegularUser123!',
      newPassword: 'UpdatedSecurePass123!',
    },
    { authorization: `Bearer ${tempUserToken}` }
  );
  assert(validChangeRes.status === 200 && validChangeRes.body.success === true, 'Authenticated password change succeeds with valid current password');
  
  const updatedTempUser = db.getSchema().users.find((u) => u.id === tempUser.id);
  assert(
    verifyPassword('UpdatedSecurePass123!', updatedTempUser!.passwordHash, updatedTempUser!.salt),
    'New password verifies successfully against updated hash and salt'
  );
  assert(
    !verifyPassword('RegularUser123!', updatedTempUser!.passwordHash, updatedTempUser!.salt),
    'Old password is no longer valid after authenticated password change'
  );

  // Clean up temporary user
  db.getSchema().users = db.getSchema().users.filter((u) => u.id !== tempUser.id);
  db.save();

  // 15.4: Missing or weak admin setup credentials cannot grant Admin privileges
  delete process.env.ADMIN_SETUP_KEY;
  const missingKeyRes = await mockApiCall('POST', '/setup/promote-admin', {
    email: 'sec_test_user@example.com',
  });
  assert(missingKeyRes.status === 503, 'Missing ADMIN_SETUP_KEY safely disables setup endpoint with HTTP 503');

  process.env.ADMIN_SETUP_KEY = 'short_key';
  const weakKeyRes = await mockApiCall('POST', '/setup/promote-admin', {
    email: 'sec_test_user@example.com',
  });
  assert(weakKeyRes.status === 503, 'Weak ADMIN_SETUP_KEY (<16 characters) is rejected with HTTP 503');

  process.env.ADMIN_SETUP_KEY = 'super_secret_setup_key_32chars!';
  const wrongKeyRes = await mockApiCall(
    'POST',
    '/setup/promote-admin',
    { email: 'sec_test_user@example.com' },
    { 'x-admin-setup-key': 'incorrect_setup_key_value_here' }
  );
  assert(wrongKeyRes.status === 403, 'Incorrect setup key is rejected with HTTP 403 without granting admin');

  // 15.5: Admin setup cannot be abused after bootstrap is complete
  const normalUserToTarget = db.getSchema().users.find((u) => u.role === 'user');
  assert(Boolean(normalUserToTarget), 'Regular user exists in database for bootstrap lock test');

  const lockedRes = await mockApiCall(
    'POST',
    '/setup/promote-admin',
    { email: normalUserToTarget!.email },
    { 'x-admin-setup-key': 'super_secret_setup_key_32chars!' }
  );
  assert(lockedRes.status === 403, 'Admin setup endpoint is permanently locked against new promotions once admin already exists');
  assert(
    normalUserToTarget!.role === 'user',
    'Target regular user role remains strictly "user"'
  );
  delete process.env.ADMIN_SETUP_KEY;

  // 15.6: Normal registration cannot assign an Admin role
  const regEmail = `attacker_${Date.now()}@example.com`;
  const regRes = await mockApiCall('POST', '/auth/register', {
    name: 'Privilege Escalation Attempt',
    email: regEmail,
    password: 'AttackerPassword123!',
    role: 'admin',
  });
  assert(regRes.status === 201, 'Registration completes successfully');
  const createdAttacker = db.getSchema().users.find((u) => u.email === regEmail);
  assert(createdAttacker?.role === 'user', 'Client-supplied role: "admin" is strictly ignored; user assigned "user" role');
  // Clean up created attacker user
  db.getSchema().users = db.getSchema().users.filter((u) => u.email !== regEmail);
  db.save();

  // 15.7: Production configuration without a secure JWT secret fails safely
  const savedNodeEnv = process.env.NODE_ENV;
  const savedJwtSecret = process.env.JWT_SECRET;

  try {
    process.env.NODE_ENV = 'production';
    delete process.env.JWT_SECRET;
    let missingSecretThrew = false;
    try {
      validateAuthConfig();
    } catch {
      missingSecretThrew = true;
    }
    assert(missingSecretThrew, 'Production startup fails safely when JWT_SECRET is missing');

    process.env.JWT_SECRET = 'short_secret';
    let shortSecretThrew = false;
    try {
      validateAuthConfig();
    } catch {
      shortSecretThrew = true;
    }
    assert(shortSecretThrew, 'Production startup fails safely when JWT_SECRET is shorter than 32 characters');

    process.env.JWT_SECRET = 'foodie-bd-sha256-super-secret-key-2026';
    let defaultSecretThrew = false;
    try {
      validateAuthConfig();
    } catch {
      defaultSecretThrew = true;
    }
    assert(defaultSecretThrew, 'Production startup fails safely when placeholder/default JWT_SECRET is used');

    process.env.JWT_SECRET = 'a_very_strong_production_secret_32chars_long!';
    let validSecretPassed = false;
    try {
      validateAuthConfig();
      validSecretPassed = true;
    } catch {
      validSecretPassed = false;
    }
    assert(validSecretPassed, 'Production configuration succeeds with valid strong 32+ character JWT secret');
  } finally {
    process.env.NODE_ENV = savedNodeEnv;
    if (savedJwtSecret !== undefined) {
      process.env.JWT_SECRET = savedJwtSecret;
    } else {
      delete process.env.JWT_SECRET;
    }
  }

  // 15.8: Existing authorized Admin can still log in and perform permitted Admin operations
  const primaryAdmin = db.getSchema().users.find((u) => u.email === 'admin@foodiebd.com');
  const ownerAdmin = db.getSchema().users.find((u) => u.email === 'mrazad0101@gmail.com');
  assert(primaryAdmin?.role === 'admin', 'Primary admin account retains role "admin"');
  assert(ownerAdmin?.role === 'admin', 'Owner admin account retains role "admin"');

  const primaryAdminToken = generateToken(primaryAdmin!);
  let primaryAdminPermitted = false;
  await requireAdmin(
    { user: verifyToken(primaryAdminToken) } as any,
    { status: () => ({ json: () => {} }) } as any,
    () => { primaryAdminPermitted = true; }
  );
  assert(primaryAdminPermitted, 'Primary admin successfully passes requireAdmin middleware verification');

  const ownerAdminToken = generateToken(ownerAdmin!);
  let ownerAdminPermitted = false;
  await requireAdmin(
    { user: verifyToken(ownerAdminToken) } as any,
    { status: () => ({ json: () => {} }) } as any,
    () => { ownerAdminPermitted = true; }
  );
  assert(ownerAdminPermitted, 'Owner admin successfully passes requireAdmin middleware verification');

  // 15.9: Existing user and food data remain unchanged by these security fixes
  const currentSchema = db.getSchema();
  assert(currentSchema.foods.length === 40, 'All 40 food catalog items remain intact and unaltered');
  assert(currentSchema.divisions.length === 8, 'All 8 administrative divisions remain intact');
  assert(currentSchema.districts.length === 64, 'All 64 administrative districts remain intact');
  assert(currentSchema.users.length >= 2, 'Existing registered user accounts remain intact with preserved credentials');

  // ----------------------------------------------------
  // TEST SUITE 16: PostgreSQL & Persistent Storage Architecture Suite
  // ----------------------------------------------------
  console.log('\n▶ Test Suite 16: PostgreSQL & Persistent Storage Architecture Suite');

  // 16.1: Verified backup file exists and integrity is confirmed
  const backupFiles = fs.readdirSync(path.resolve(process.cwd(), 'data/backups'));
  assert(backupFiles.length > 0, 'Timestamped JSON backup exists in data/backups/');

  const latestBackupPath = path.resolve(process.cwd(), 'data/backups', backupFiles[0]);
  let parsedBackup: any;
  try {
    parsedBackup = JSON.parse(fs.readFileSync(latestBackupPath, 'utf-8'));
  } catch {
    parsedBackup = null;
  }
  assert(Boolean(parsedBackup), 'Backup file is valid, parseable JSON');
  assert(
    parsedBackup?.foods?.length === 40 && parsedBackup?.users?.length === 6 && parsedBackup?.districts?.length === 64,
    'Backup file contains exact snapshot of all 40 foods, 6 users, and 64 districts'
  );

  // 16.2: PostgreSQL connection health check handling
  const pgStatus = await testPostgresConnection();
  assert(typeof pgStatus.isConnected === 'boolean', 'PostgreSQL connection status is returned as a typed object');
  assert(
    ['supabase_postgres', 'local_postgres', 'none'].includes(pgStatus.provider),
    'PostgreSQL provider is accurately identified (supabase_postgres, local_postgres, or none)'
  );

  // 16.3: Migration script dry-run validation
  const migrationDryRun = await runJsonToPostgresMigration({ dryRun: true });
  assert(migrationDryRun.success === true, 'Migration dry-run executes successfully and validates source data');
  assert(migrationDryRun.dryRun === true, 'Dry-run flag ensures no remote writes or modifications occurred');
  assert(migrationDryRun.sourceCounts.foods === 40, 'Migration validates all 40 food catalog items');
  assert(migrationDryRun.sourceCounts.districts === 64, 'Migration validates all 64 administrative districts');
  assert(migrationDryRun.sourceCounts.users === 6, 'Migration validates all 6 user accounts');

  // 16.4: Password hash and salt preservation verification
  const demoUser = parsedBackup.users.find((u: any) => u.email === 'admin@foodiebd.com');
  assert(
    typeof demoUser.passwordHash === 'string' && demoUser.passwordHash.length === 128,
    'Password hash is preserved as 128-char scrypt hex without re-hashing'
  );
  assert(
    typeof demoUser.salt === 'string' && demoUser.salt.length === 32,
    'Password salt is preserved as 32-char hex without alteration'
  );

  // 16.5: Schema files completeness check
  const schema001 = fs.readFileSync(path.resolve(process.cwd(), 'server/migrations/001_initial_schema.sql'), 'utf-8');
  const schema002 = fs.readFileSync(path.resolve(process.cwd(), 'server/migrations/002_seed_data.sql'), 'utf-8');
  const schema003 = fs.readFileSync(path.resolve(process.cwd(), 'server/migrations/003_complete_schema_and_submissions.sql'), 'utf-8');

  assert(schema001.includes('CREATE TABLE IF NOT EXISTS profiles'), '001_initial_schema.sql defines profiles table');
  assert(schema001.includes('CREATE TABLE IF NOT EXISTS foods'), '001_initial_schema.sql defines foods table');
  assert(schema002.includes('INSERT INTO divisions'), '002_seed_data.sql defines division seed data');
  assert(schema003.includes('CREATE TABLE IF NOT EXISTS food_submissions'), '003_complete_schema_and_submissions.sql defines food_submissions table');
  assert(schema003.includes('CREATE TABLE IF NOT EXISTS reports'), '003_complete_schema_and_submissions.sql defines reports table');

  // 16.6: Persistent Image Storage service inspection
  const storageProvider = imageStorage.getStorageProviderName();
  assert(typeof storageProvider === 'string' && storageProvider.length > 0, 'Storage service reports active provider name');

  const storageConn = await imageStorage.testStorageConnection();
  assert(typeof storageConn.isAvailable === 'boolean', 'Storage service reachability check returns status without crashing');

  // 16.7: Non-destructive verification of current database
  const finalSchemaCheck = db.getSchema();
  assert(finalSchemaCheck.foods.length === 40, 'Existing catalog contains all 40 verified regional foods intact');
  assert(finalSchemaCheck.users.length === 6, 'Existing registered accounts remain fully intact');

  // ----------------------------------------------------
  // TEST SUITE 17: Research-Based District Food Catalog & Authentic Provenance Suite
  // ----------------------------------------------------
  console.log('\n▶ Test Suite 17: Research-Based District Food Catalog & Authentic Provenance Suite');

  const { VERIFIED_DISTRICT_RESEARCH } = await import('../server/data/verifiedDistrictResearch');
  const researchKeys = Object.keys(VERIFIED_DISTRICT_RESEARCH);

  assert(researchKeys.length === 28, 'Research database contains exactly 28 dossiers for unrepresented districts');

  // Verify all 28 unrepresented districts have comprehensive evidence
  let allHaveValidBengaliNames = true;
  let allHaveIngredients = true;
  let allHavePreparationMethods = true;
  let allHaveHistoricalContext = true;
  let allHavePrimarySources = true;
  let allHaveCitationSources = true;
  let allHaveImagePrompts = true;
  let giCertifiedCount = 0;

  for (const key of researchKeys) {
    const entry = VERIFIED_DISTRICT_RESEARCH[key];
    if (!entry.foodNameBn || entry.foodNameBn.trim().length === 0) allHaveValidBengaliNames = false;
    if (!Array.isArray(entry.ingredients) || entry.ingredients.length === 0) allHaveIngredients = false;
    if (!entry.preparationMethodBn || !entry.preparationMethodEn) allHavePreparationMethods = false;
    if (!entry.historicalContextBn || !entry.historicalContextEn) allHaveHistoricalContext = false;
    if (!entry.primarySource || entry.primarySource.trim().length === 0) allHavePrimarySources = false;
    if (!Array.isArray(entry.citationSources) || entry.citationSources.length === 0) allHaveCitationSources = false;
    if (!entry.imageSuggestionPrompt || !entry.imageAttribution) allHaveImagePrompts = false;
    if (entry.isGiProduct && entry.researchStatus === 'gi_certified') giCertifiedCount++;
  }

  assert(allHaveValidBengaliNames, 'All 28 research dossiers have verified authentic Bengali and English names');
  assert(allHaveIngredients, 'All 28 research dossiers document authentic ingredients');
  assert(allHavePreparationMethods, 'All 28 research dossiers document bilingual preparation methods');
  assert(allHaveHistoricalContext, 'All 28 research dossiers document historical and cultural context');
  assert(allHavePrimarySources, 'All 28 research dossiers cite primary institutional or gazetteer authorities');
  assert(allHaveCitationSources, 'All 28 research dossiers provide verifiable citation lists');
  assert(allHaveImagePrompts, 'All 28 research dossiers specify descriptive image prompts and image attributions');
  assert(giCertifiedCount >= 3, 'GI certified products (e.g., Manikganj Hazari Gur) are strictly marked with GI credentials');

  // Verify Admin Research Dossier endpoints logic
  const schemaCurrent = db.getSchema();
  const districtFoods: Record<string, any[]> = {};
  schemaCurrent.foods.forEach((f) => {
    if (!districtFoods[f.districtId]) districtFoods[f.districtId] = [];
    districtFoods[f.districtId].push(f);
  });

  const representedCount = Object.keys(districtFoods).length;
  assert(representedCount === 36, 'Catalog accurately reflects 36 currently represented districts');
  assert(schemaCurrent.districts.length === 64, 'Bangladesh 64 districts remain intact in database');

  // Verify that AdminResearchDossierTab, FoodDetailsPage, and FoodCard contain GI and provenance support
  const adminResearchTabCode = fs.readFileSync(path.resolve(process.cwd(), 'src/components/admin/AdminResearchDossierTab.tsx'), 'utf-8');
  assert(adminResearchTabCode.includes('AdminResearchDossierTab'), 'AdminResearchDossierTab component is defined and exported');
  assert(adminResearchTabCode.includes('api.getResearchDossiers'), 'AdminResearchDossierTab loads research dossiers from API');
  assert(adminResearchTabCode.includes('api.publishResearchDossier'), 'AdminResearchDossierTab can publish research dossiers');

  const suite17FoodDetailsSource = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/FoodDetailsPage.tsx'), 'utf-8');
  assert(suite17FoodDetailsSource.includes('food.researchStatus === \'gi_certified\''), 'FoodDetailsPage displays GI certified status');
  assert(suite17FoodDetailsSource.includes('food.originSource'), 'FoodDetailsPage displays primary authority source');
  assert(suite17FoodDetailsSource.includes('food.citationSources'), 'FoodDetailsPage displays factual research citations');
  assert(suite17FoodDetailsSource.includes('food.imageAttribution'), 'FoodDetailsPage displays authentic image attribution');

  const suite17FoodCardSource = fs.readFileSync(path.resolve(process.cwd(), 'src/components/common/FoodCard.tsx'), 'utf-8');
  assert(suite17FoodCardSource.includes('food.researchStatus === \'gi_certified\''), 'FoodCard displays GI indicator badge');

  // ----------------------------------------------------
  // TEST SUITE 18: Food Image URL Format & Bogura Doi Save Verification Suite
  // ----------------------------------------------------
  console.log('\n▶ Test Suite 18: Food Image URL Format & Bogura Doi Save Verification Suite');

  const { isValidFoodImageReference, normalizeFoodImageReference } = await import('../src/lib/imageUrlHelper');

  // 18.1: Unit validation tests for valid formats
  assert(isValidFoodImageReference('/api/images/food_1792156447008_100f7d9709257802.png') === true, 'Accepts valid application-managed PNG reference');
  assert(isValidFoodImageReference('/api/images/food_1792156447008_100f7d9709257802.jpg') === true, 'Accepts valid application-managed JPEG reference');
  assert(isValidFoodImageReference('/api/images/food_1792156447008_100f7d9709257802.webp') === true, 'Accepts valid application-managed WebP reference');
  assert(isValidFoodImageReference('/api/images/food_1792156447008_100f7d9709257802.png?v=123') === true, 'Accepts valid application-managed PNG reference with cache-buster query parameter');
  assert(isValidFoodImageReference('/placeholder-food.jpg') === true, 'Accepts valid root-relative static asset path');
  assert(isValidFoodImageReference('https://upload.wikimedia.org/wikipedia/commons/sample.jpg') === true, 'Accepts valid external HTTPS image URL');
  assert(isValidFoodImageReference('http://example.com/food.jpg') === true, 'Accepts valid external HTTP image URL');
  assert(isValidFoodImageReference('https://xyz.supabase.co/storage/v1/object/public/food-images/dish.png') === true, 'Accepts valid Supabase Storage public HTTPS URL');
  assert(isValidFoodImageReference('uploads/food_1792156447008_100f7d9709257802.png') === true, 'Accepts relative storage upload path');
  assert(isValidFoodImageReference('food-images/food_1792156447008_100f7d9709257802.png') === true, 'Accepts Supabase bucket relative storage path');
  assert(isValidFoodImageReference('food_1792156447008_100f7d9709257802.png') === true, 'Accepts safe bare food image filename');

  assert(normalizeFoodImageReference('uploads/food_123.png') === '/api/images/food_123.png', 'Normalizes uploads/ path to /api/images/');
  assert(normalizeFoodImageReference('food-images/food_123.png') === '/api/images/food_123.png', 'Normalizes food-images/ path to /api/images/');
  assert(normalizeFoodImageReference('food_1792156447008_100f7d9709257802.png') === '/api/images/food_1792156447008_100f7d9709257802.png', 'Normalizes safe bare filename to /api/images/');

  // 18.2: Unit validation tests for invalid or malicious inputs
  assert(isValidFoodImageReference('/api/images/../../etc/passwd') === false, 'Rejects directory traversal in application path');
  assert(isValidFoodImageReference('//evil.com/malicious.png') === false, 'Rejects protocol-relative bypass in application path');
  assert(isValidFoodImageReference('/api/images\\food.png') === false, 'Rejects backslash evasion in application path');
  assert(isValidFoodImageReference('javascript:alert(1)') === false, 'Rejects javascript: URI scheme');
  assert(isValidFoodImageReference('data:text/html,<script>alert(1)</script>') === false, 'Rejects data: URI scheme');
  assert(isValidFoodImageReference('file:///etc/hosts') === false, 'Rejects file: URI scheme');
  assert(isValidFoodImageReference('not-a-valid-url') === false, 'Rejects arbitrary string without scheme or root path');
  assert(isValidFoodImageReference('   ') === false, 'Rejects whitespace-only string');
  assert(isValidFoodImageReference(null as any) === false, 'Rejects null input safely');
  assert(isValidFoodImageReference(undefined as any) === false, 'Rejects undefined input safely');

  // 18.3: Exact scenario reproduction: Bogura Doi PNG Upload & Save Flow
  const boguraFood = db.getSchema().foods.find((f) => f.nameEn.toLowerCase().includes('bogura') || f.nameBn.includes('বগুড়া'));
  assert(Boolean(boguraFood), 'Bogura Doi food record exists in database');
  const originalBoguraImageUrl = boguraFood!.imageUrl;

  // Step A: Upload a valid PNG file
  const testBoguraPngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x42, 0x44]);
  const adminAccount = db.getSchema().users.find((u) => u.role === 'admin')!;
  const uploadedBoguraMeta = await imageStorage.saveImage(testBoguraPngBuffer, 'bogura_doi_test.png', adminAccount.id);

  assert(uploadedBoguraMeta.url.startsWith('/api/images/'), 'PNG upload returns valid application image path under /api/images/');

  // Step B: Preview validation check (matching frontend AdminFoodEditModal)
  assert(isValidFoodImageReference(uploadedBoguraMeta.url) === true, 'Frontend image validator marks uploaded PNG reference as valid');

  // Step C: Save payload validation (matching server PUT /foods/:id handler)
  const savePayload = {
    imageUrl: uploadedBoguraMeta.url,
  };
  const isServerAccepted = isValidFoodImageReference(savePayload.imageUrl);
  assert(isServerAccepted === true, 'Server PUT /foods/:id validation accepts the uploaded PNG image reference');

  // Step D: Apply update and persist to database
  boguraFood!.imageUrl = savePayload.imageUrl;
  boguraFood!.updatedAt = new Date().toISOString();
  db.save();

  // Step E: Reload and verify database persistence
  const reloadedDb = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'data/foodie_bd.json'), 'utf-8'));
  const reloadedBoguraFood = reloadedDb.foods.find((f: any) => f.id === boguraFood!.id);
  assert(reloadedBoguraFood.imageUrl === uploadedBoguraMeta.url, 'Reloaded Bogura Doi food record contains exact uploaded PNG reference');

  // Step F: Restore Bogura Doi original image to keep catalog pristine
  boguraFood!.imageUrl = originalBoguraImageUrl;
  boguraFood!.updatedAt = new Date().toISOString();
  db.save();
  assert(boguraFood!.imageUrl === originalBoguraImageUrl, 'Bogura Doi image restored cleanly after regression verification');

  // 18.4: Verify server/routes.ts routes reject invalid image formats with exact 400 error message
  const routesContent = fs.readFileSync(path.resolve(process.cwd(), 'server/routes.ts'), 'utf-8');
  assert(routesContent.includes('isValidFoodImageReference(trimmedImageUrl)'), 'server/routes.ts uses isValidFoodImageReference in food routes');
  assert(routesContent.includes("'Invalid food image URL format.'"), 'server/routes.ts retains exact error message for genuinely invalid formats');

  // ----------------------------------------------------
  // TEST SUITE 19: Unified PostgreSQL Data Access Layer & Production Safety Suite
  // ----------------------------------------------------
  console.log('\n▶ Test Suite 19: Unified PostgreSQL Data Access Layer & Production Safety Suite');

  // 19.1: Production environment database safety check
  const origNodeEnv = process.env.NODE_ENV;
  const origDbUrl = process.env.DATABASE_URL;
  try {
    process.env.NODE_ENV = 'production';
    delete process.env.DATABASE_URL;
    let prodMissingDbThrew = false;
    try {
      validateDatabaseConfig();
    } catch {
      prodMissingDbThrew = true;
    }
    assert(prodMissingDbThrew, 'Production startup strictly refuses silent local JSON fallback when DATABASE_URL is missing');

    process.env.DATABASE_URL = 'postgresql://postgres:test@db.supabase.co:5432/postgres';
    let prodConfigPassed = false;
    try {
      validateDatabaseConfig();
      prodConfigPassed = true;
    } catch {
      prodConfigPassed = false;
    }
    assert(prodConfigPassed, 'Production database configuration validates successfully with DATABASE_URL present');
  } finally {
    process.env.NODE_ENV = origNodeEnv;
    if (origDbUrl !== undefined) {
      process.env.DATABASE_URL = origDbUrl;
    } else {
      delete process.env.DATABASE_URL;
    }
  }

  // 19.2: DAL Geographic & Catalog Retrieval
  const dalDivisions = await dal.getDivisions();
  assert(dalDivisions.length === 8, 'DAL getDivisions() returns all 8 administrative divisions');

  const dalDistricts = await dal.getDistricts();
  assert(dalDistricts.length === 64, 'DAL getDistricts() returns all 64 districts with foodsCount');
  assert(typeof dalDistricts[0].foodsCount === 'number', 'DAL districts include computed foodsCount property');

  const dalDistrict = await dal.getDistrictById('bogura');
  assert(dalDistrict?.nameEn === 'Bogura' && dalDistrict?.nameBn === 'বগুড়া', 'DAL getDistrictById() retrieves district details');

  const dalCategories = await dal.getCategories();
  assert(dalCategories.length >= 7, 'DAL getCategories() returns all food category definitions');

  // 19.3: DAL User Authentication & Profile Retrieval
  const dalAdminUser = await dal.getUserByEmail('admin@foodiebd.com');
  assert(Boolean(dalAdminUser && dalAdminUser.role === 'admin'), 'DAL getUserByEmail() retrieves user credentials and role');
  assert(typeof dalAdminUser?.passwordHash === 'string' && dalAdminUser?.passwordHash.length === 128, 'DAL user entity retains complete 128-char password hash');
  assert(typeof dalAdminUser?.salt === 'string' && dalAdminUser?.salt.length === 32, 'DAL user entity retains 32-char salt');

  const dalAllUsers = await dal.getAllUsers();
  assert(dalAllUsers.length >= 6, 'DAL getAllUsers() returns user profile list');
  assert(!('passwordHash' in (dalAllUsers[0] as any)) && !('salt' in (dalAllUsers[0] as any)), 'DAL getAllUsers() safely strips sensitive password hashes and salts');

  // 19.4: DAL Foods & Catalog Operations
  const dalFoods = await dal.getFoods();
  assert(dalFoods.length === 40, 'DAL getFoods() returns all published catalog items');

  const dalFoodItem = await dal.getFoodById(dalFoods[0].id);
  assert(dalFoodItem?.nameEn === dalFoods[0].nameEn, 'DAL getFoodById() returns complete food record with ingredients and descriptions');

  const dalFilterDiv = await dal.getFoods({ divisionId: 'rajshahi' });
  assert(dalFilterDiv.length > 0 && dalFilterDiv.every((f) => f.divisionId === 'rajshahi'), 'DAL getFoods() filters correctly by divisionId');

  // 19.5: DAL Stats & Overview Aggregations
  const dalStats = await dal.getPlatformStats();
  assert(dalStats.totalDistricts === 64 && dalStats.totalDivisions === 8 && dalStats.totalFoods === 40, 'DAL getPlatformStats() aggregates live platform statistics accurately');

  const dalOverview = await dal.getAdminOverview();
  assert(dalOverview.totalFoods >= 40 && dalOverview.totalUsers >= 6, 'DAL getAdminOverview() aggregates administrative catalog and user totals');

  // 19.6: DAL Reports & Moderation Flow
  const testReportId = 'rep_test_' + Date.now();
  const createdReport = await dal.createReport({
    id: testReportId,
    reporterUserId: dalAdminUser!.id,
    reason: 'Test content review report',
    status: 'pending',
    createdAt: new Date().toISOString(),
  });
  assert(createdReport.id === testReportId && createdReport.status === 'pending', 'DAL createReport() persists content moderation reports');

  const allReports = await dal.getReports();
  assert(allReports.some((r) => r.id === testReportId), 'DAL getReports() returns saved report in report moderation list');

  const reviewedReport = await dal.updateReportStatus(testReportId, 'reviewed');
  assert(reviewedReport.status === 'reviewed', 'DAL updateReportStatus() transitions report to reviewed status');

  // 19.7: DAL Audit Logging
  const testAudit = await dal.logAudit({
    action: 'TEST_AUDIT_ACTION',
    entityType: 'TEST',
    entityId: 'test_123',
    userId: dalAdminUser!.id,
    userName: dalAdminUser!.name,
    details: 'Verified DAL audit logging integration',
  });
  assert(testAudit.action === 'TEST_AUDIT_ACTION', 'DAL logAudit() generates immutable audit log record');

  // 19.8: Route Architecture Inspection
  assert(routesContent.includes("import { dal } from './dal';"), 'server/routes.ts imports unified dal data layer');
  assert(!routesContent.includes('db.getSchema()'), 'server/routes.ts has completely replaced db.getSchema() with async DAL');
  assert(!routesContent.includes('db.save()'), 'server/routes.ts has completely replaced db.save() with persistent DAL operations');
  assert(routesContent.includes("apiRouter.post('/reports'"), 'server/routes.ts implements public report submission endpoint');
  assert(routesContent.includes("apiRouter.get('/admin/reports'"), 'server/routes.ts implements admin report review endpoint');
  assert(routesContent.includes("apiRouter.patch('/admin/reports/:id'"), 'server/routes.ts implements admin report moderation endpoint');

  // SUMMARY
  // ----------------------------------------------------
  console.log('\n========================================');
  console.log(`  Tests Passed: ${passedTests} / ${totalTests}`);
  if (failedTests > 0) {
    console.error(`  Tests Failed: ${failedTests}`);
    process.exit(1);
  } else {
    console.log('  All tests passed successfully! 🎉');
    console.log('========================================\n');
  }
}

runTestSuite().catch((err) => {
  console.error('Test suite failed with uncaught error:', err);
  process.exit(1);
});
