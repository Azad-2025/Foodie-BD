import 'dotenv/config';
import { db } from '../server/db';
import { dal, isPostgresActive } from '../server/dal';

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

  // Update role to admin in JSON schema
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

export async function promoteUserToAdminAsync({ email }: PromoteOptions): Promise<{
  success: boolean;
  message: string;
  user?: { id: string; name: string; email: string; role: string };
}> {
  const normalizedEmail = email.trim().toLowerCase();

  // If Postgres is active, update via DAL
  if (isPostgresActive()) {
    const user = await dal.getUserByEmail(normalizedEmail);
    if (!user) {
      return {
        success: false,
        message: `User with email "${normalizedEmail}" was not found in PostgreSQL.`,
      };
    }
    if (user.role === 'admin') {
      return {
        success: true,
        message: `Account "${user.email}" (${user.name}) already has the 'admin' role in PostgreSQL.`,
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
      };
    }
    const previousRole = user.role;
    const updated = await dal.updateUserRole(user.id, 'admin');
    await dal.logAudit({
      action: 'PROMOTE_TO_ADMIN',
      entityType: 'USER',
      entityId: user.id,
      userId: user.id,
      userName: user.name,
      details: `Account ${user.email} (ID: ${user.id}) was securely promoted to 'admin' role in PostgreSQL. Previous role: ${previousRole}.`,
    });
    return {
      success: true,
      message: `Account "${user.email}" (${user.name}) successfully promoted from '${previousRole}' to 'admin' in PostgreSQL.`,
      user: { id: updated.id, name: updated.name, email: updated.email, role: updated.role },
    };
  }

  return promoteUserToAdmin({ email });
}

// CLI runner if executed directly: `npx tsx scripts/promote-admin.ts [email]`
if (process.argv[1]?.endsWith('promote-admin.ts')) {
  const targetEmail = process.argv[2] || 'mrazad0101@gmail.com';
  console.log(`\n========================================`);
  console.log(`  Foodie BD Admin Promotion Tool`);
  console.log(`========================================`);
  console.log(`Target Email: ${targetEmail}`);

  promoteUserToAdminAsync({ email: targetEmail })
    .then((result) => {
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
    })
    .catch((err) => {
      console.error(`\n[ERROR] Promotion failed:`, err);
      process.exit(1);
    });
}
