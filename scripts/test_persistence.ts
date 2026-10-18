import { db } from '../server/db';
import http from 'http';
import fs from 'fs';

function makeRequest(
  method: string,
  path: string,
  data?: any,
  token?: string
): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const payload = data ? JSON.stringify(data) : null;
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: 3000,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
      (res) => {
        let responseBody = '';
        res.on('data', (chunk) => (responseBody += chunk));
        res.on('end', () => {
          try {
            resolve({
              status: res.statusCode || 500,
              body: responseBody ? JSON.parse(responseBody) : {},
            });
          } catch {
            resolve({
              status: res.statusCode || 500,
              body: responseBody,
            });
          }
        });
      }
    );

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function runTest() {
  console.log('--- STARTING BACKEND & DATABASE PERSISTENCE TESTS ---');

  const testEmail = `test_persister_${Date.now()}@foodiebd.test`;
  const testPassword = 'SecurePassword123!';

  // 1. Test Registration
  console.log('1. Registering new user:', testEmail);
  const regRes = await makeRequest('POST', '/api/auth/register', {
    name: 'Shamim Chowdhury',
    email: testEmail,
    password: testPassword,
    homeDistrictId: 'tangail',
  });

  if (regRes.status !== 201 || !regRes.body.token) {
    throw new Error(`Registration failed: ${JSON.stringify(regRes.body)}`);
  }
  console.log('✓ Registered successfully with ID:', regRes.body.user.id);
  console.log('✓ Public registration assigned role:', regRes.body.user.role);

  if (regRes.body.user.role !== 'user') {
    throw new Error('SECURITY VIOLATION: Public registration must never grant admin role!');
  }

  const userToken = regRes.body.token;
  const userId = regRes.body.user.id;

  // 2. Test Server-Side Role Enforcement (Non-admin trying admin operation)
  console.log('2. Testing admin operation rejection for normal user...');
  const fakeAdminReq = await makeRequest(
    'POST',
    '/api/foods',
    {
      nameEn: 'Unauthorized Food',
      nameBn: 'অবৈধ খাবার',
      shortDescription: 'Test',
      districtId: 'dhaka',
    },
    userToken
  );

  console.log('Admin route response status for normal user:', fakeAdminReq.status);
  if (fakeAdminReq.status !== 403) {
    throw new Error(`SECURITY VIOLATION: Expected 403 Forbidden for admin route, got ${fakeAdminReq.status}`);
  }
  console.log('✓ Server-side authorization check correctly blocked unauthorized user.');

  // 3. Test Food Tracking (Tried item with notes, rating, date)
  console.log('3. Tracking a regional food (Porabari Chomchom)...');
  const trackRes = await makeRequest(
    'POST',
    '/api/user/journey',
    {
      foodId: 'food_tangail_chomchom',
      status: 'tried',
      triedAt: '2026-03-15T12:00:00.000Z',
      rating: 5,
      notes: 'Tasted directly in Porabari, Tangail. Fragrant mawa and deep caramelized syrup!',
    },
    userToken
  );

  if (trackRes.status !== 200) {
    throw new Error(`Tracking creation failed: ${JSON.stringify(trackRes.body)}`);
  }
  console.log('✓ Tasting record created successfully in database.');

  // 4. Test Fetching Journey
  console.log('4. Fetching user journey via API...');
  const journeyRes = await makeRequest('GET', '/api/user/journey', null, userToken);
  if (journeyRes.status !== 200 || !Array.isArray(journeyRes.body)) {
    throw new Error(`Failed to fetch journey: ${JSON.stringify(journeyRes.body)}`);
  }

  const chomchomEntry = journeyRes.body.find((item: any) => item.foodId === 'food_tangail_chomchom');
  if (!chomchomEntry) {
    throw new Error('Tracked food entry not returned in user journey!');
  }
  console.log('✓ Found persisted tasting record in API journey response:');
  console.log('   - Food:', chomchomEntry.food?.nameEn, `(${chomchomEntry.food?.nameBn})`);
  console.log('   - District:', chomchomEntry.district?.nameEn);
  console.log('   - Rating:', chomchomEntry.rating, 'stars');
  console.log('   - Notes:', chomchomEntry.notes);

  // 5. Verify Direct Storage Persistence from Disk
  console.log('5. Validating database physical persistence from disk...');
  const diskContent = JSON.parse(fs.readFileSync('data/foodie_bd.json', 'utf8'));
  const dbRecord = diskContent.userFoods.find((uf: any) => uf.userId === userId && uf.foodId === 'food_tangail_chomchom');
  if (!dbRecord) {
    throw new Error('Record not found in database disk file!');
  }
  console.log('✓ Record confirmed stored in persistent relational database schema on disk.');

  // 6. Test Data Isolation (Other user cannot access this user\'s tracking)
  console.log('6. Testing data isolation with another user token...');
  const demoUserLogin = await makeRequest('POST', '/api/auth/login', {
    email: 'foodie@example.com',
    password: 'Foodie123!',
  });
  const demoToken = demoUserLogin.body.token;
  const demoJourney = await makeRequest('GET', '/api/user/journey', null, demoToken);
  const leakedEntry = demoJourney.body.find((item: any) => item.userId === userId);
  if (leakedEntry) {
    throw new Error('SECURITY VIOLATION: Private record leaked to another user!');
  }
  console.log('✓ User data is strictly isolated and private.');

  console.log('\n--- ALL BACKEND & DATABASE PERSISTENCE TESTS PASSED! ---');
}

runTest().catch((err) => {
  console.error('TEST FAILED:', err);
  process.exit(1);
});
