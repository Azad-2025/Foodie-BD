import 'dotenv/config';
import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { db, DbUser } from './db';
import { dal } from './dal';

export const DISALLOWED_PRODUCTION_SECRETS = [
  'foodie-bd-sha256-super-secret-key-2026',
  'secret',
  'changeme',
  'jwt_secret',
  'default',
  'password',
];

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  const isProd = process.env.NODE_ENV === 'production';

  if (isProd) {
    if (!secret || typeof secret !== 'string' || secret.trim().length < 32) {
      throw new Error(
        '[SECURITY FATAL]: Production environment requires a strong, random JWT_SECRET containing at least 32 characters.'
      );
    }
    if (DISALLOWED_PRODUCTION_SECRETS.includes(secret.trim().toLowerCase())) {
      throw new Error(
        '[SECURITY FATAL]: Insecure default or placeholder JWT_SECRET is strictly forbidden in production.'
      );
    }
    return secret.trim();
  }

  // Development and test fallback (explicitly marked for non-production only)
  return secret?.trim() || 'dev-only-local-secret-do-not-use-in-production-32chars!';
}

export function validateAuthConfig(): void {
  // Throws immediately if JWT_SECRET is missing or insecure in production
  getJwtSecret();
}

export interface AuthPayload {
  userId: string;
  email: string;
  role: 'guest' | 'user' | 'admin';
  iat: number;
  exp: number;
}

export function generateToken(user: DbUser): string {
  const secret = getJwtSecret();
  const payload: AuthPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
  };

  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${header}.${body}`)
    .digest('base64url');

  return `${header}.${body}.${signature}`;
}

export function verifyToken(token: string): AuthPayload | null {
  try {
    const secret = getJwtSecret();
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;

    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(`${header}.${body}`)
      .digest('base64url');

    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSig);

    // Prevent timing side-channel attacks during signature verification
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }

    const payload: AuthPayload = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8'));
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;

    return payload;
  } catch {
    return null;
  }
}

export interface AuthenticatedRequest extends Request {
  user?: AuthPayload;
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = undefined;
    return next();
  }

  const token = authHeader.substring(7).trim();
  const payload = verifyToken(token);
  if (!payload) {
    req.user = undefined;
    return next();
  }

  req.user = payload;
  next();
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required. Please log in.' });
    return;
  }
  next();
}

export async function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required. Please log in.' });
    return;
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
    return;
  }

  // Double-check against active database record via DAL to ensure role has not been revoked
  try {
    const activeUser = await dal.getUserById(req.user.userId);
    if (!activeUser || activeUser.role !== 'admin') {
      res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
      return;
    }
  } catch {
    res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
    return;
  }

  next();
}
