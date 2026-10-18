import 'dotenv/config';
import { testPostgresConnection } from '../server/postgres';
import { imageStorage } from '../server/storage';

async function main() {
  console.log('====================================================');
  console.log(' Foodie BD — Read-Only Supabase Connectivity Check ');
  console.log('====================================================\n');

  // 1. Environment Variables Presence (Boolean check only; NO values printed)
  console.log('1. Environment Configuration Status:');
  console.log('   - DATABASE_URL:               ', process.env.DATABASE_URL ? '[CONFIGURED]' : '[MISSING]');
  console.log('   - SUPABASE_URL:               ', process.env.SUPABASE_URL ? '[CONFIGURED]' : '[MISSING]');
  console.log('   - SUPABASE_SERVICE_ROLE_KEY:  ', process.env.SUPABASE_SERVICE_ROLE_KEY ? '[CONFIGURED]' : '[MISSING]');
  console.log('   - SUPABASE_STORAGE_BUCKET:    ', process.env.SUPABASE_STORAGE_BUCKET || 'food-images (default)');
  console.log('   - JWT_SECRET:                 ', process.env.JWT_SECRET ? '[CONFIGURED]' : '[MISSING / DEFAULT]');
  console.log('   - NODE_ENV:                   ', process.env.NODE_ENV || 'development');
  console.log('');

  // 2. Read-Only PostgreSQL Connection Ping
  console.log('2. PostgreSQL Database Connection (Read-Only Ping):');
  const dbStatus = await testPostgresConnection();
  if (dbStatus.isConnected) {
    console.log('   ✓ Status: CONNECTED');
    console.log(`   ✓ Provider: ${dbStatus.provider}`);
    console.log(`   ✓ Target Database: ${dbStatus.database || 'default'}`);
  } else {
    console.log('   ✗ Status: NOT CONNECTED');
    console.log(`   ✗ Error: ${dbStatus.error || 'Connection failed'}`);
  }
  console.log('');

  // 3. Read-Only Supabase Storage Check
  console.log('3. Supabase Storage Reachability Check (Read-Only getBucket):');
  const storageStatus = await imageStorage.testStorageConnection();
  if (storageStatus.isAvailable) {
    console.log('   ✓ Status: AVAILABLE');
    console.log(`   ✓ Provider: ${storageStatus.provider}`);
    console.log(`   ✓ Bucket: ${storageStatus.bucket || 'food-images'}`);
  } else {
    console.log('   ✗ Status: NOT AVAILABLE');
    console.log(`   ✗ Provider: ${storageStatus.provider}`);
    console.log(`   ✗ Details: ${storageStatus.error || 'Storage unconfigured'}`);
  }
  console.log('');
  console.log('====================================================');
  console.log(' NOTE: Zero writes, zero migrations, and zero table');
  console.log(' alterations were performed during this inspection.');
  console.log('====================================================');

  process.exit(0);
}

main().catch((err) => {
  console.error('Connectivity check encountered an unexpected error:', err.message);
  process.exit(1);
});
