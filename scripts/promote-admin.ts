import { db } from '../server/db';
import crypto from 'crypto';

interface PromoteOptions {
  email: string;
  force?: boolean;
}

export function promoteUserToAdmin({ email }: PromoteOptions): {
  success: boolean;
  message: string;
  user?: { id: string; name: string; email: string; role: string };
} {
  const normalizedEmail = email.trim().toLowerCase();
  const schema = db.getSchema();
  const targetUser = schema.users.find((u) => u.email.toLowerCase() === normalizedEmail);

  if (!targetUser) {
    return {
      success: false,
      message: `User with email "${normalizedEmail}" was not found in the database. Please ensure the user has already registered.`,
    };
  }

  const previousRole = targetUser.role;

  if (previousRole === 'admin') {
    return {
      success: true,
      message: `Account "${targetUser.email}" (${targetUser.name}) already has the 'admin' role.`,
      user: {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
      },
    };
  }

  // Update role to admin without modifying passwordHash, salt, id, or any existing tracking
  targetUser.role = 'admin';
  db.save();

  // Record an immutable server audit entry
  db.logAudit({
    action: 'PROMOTE_TO_ADMIN',
    entityType: 'USER',
    entityId: targetUser.id,
    userId: targetUser.id,
    userName: targetUser.name,
    details: `Account ${targetUser.email} (ID: ${targetUser.id}) was securely promoted to 'admin' role via server-side setup. Previous role: ${previousRole}.`,
  });

  return {
    success: true,
    message: `Account "${targetUser.email}" (${targetUser.name}) successfully promoted from '${previousRole}' to 'admin'.`,
    user: {
      id: targetUser.id,
      name: targetUser.name,
      email: targetUser.email,
      role: targetUser.role,
    },
  };
}

// CLI runner if executed directly: `npx tsx scripts/promote-admin.ts [email]`
if (process.argv[1]?.endsWith('promote-admin.ts')) {
  const targetEmail = process.argv[2] || 'mrazad0101@gmail.com';
  console.log(`\n========================================`);
  console.log(`  Foodie BD Admin Promotion Tool`);
  console.log(`========================================`);
  console.log(`Target Email: ${targetEmail}`);

  const result = promoteUserToAdmin({ email: targetEmail });
  if (result.success) {
    console.log(`\n[SUCCESS] ${result.message}`);
    if (result.user) {
      console.log(`User ID : ${result.user.id}`);
      console.log(`Name    : ${result.user.name}`);
      console.log(`Role    : ${result.user.role}`);
    }
    console.log(`\n========================================\n`);
    process.exit(0);
  } else {
    console.error(`\n[ERROR] ${result.message}\n`);
    process.exit(1);
  }
}
