import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

export interface DatabaseConnectionStatus {
  isConnected: boolean;
  provider: 'supabase_postgres' | 'local_postgres' | 'none';
  host?: string;
  database?: string;
  error?: string;
}

let pool: pg.Pool | null = null;
let connectionAttempted = false;
let lastKnownStatus: DatabaseConnectionStatus = {
  isConnected: false,
  provider: 'none',
};

/**
 * Initializes the PostgreSQL connection pool if DATABASE_URL or SUPABASE_URL is provided.
 */
export function getPostgresPool(): pg.Pool | null {
  if (pool) return pool;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return null;
  }

  try {
    const isRemote =
      connectionString.includes('supabase') ||
      connectionString.includes('sslmode=') ||
      process.env.NODE_ENV === 'production' ||
      (!connectionString.includes('localhost') && !connectionString.includes('127.0.0.1'));

    pool = new Pool({
      connectionString,
      ssl: isRemote ? { rejectUnauthorized: false } : undefined,
      max: process.env.NODE_ENV === 'production' ? 5 : 10, // Serverless-friendly pool ceiling for Vercel
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 7000,
    });

    pool.on('error', (err) => {
      console.error('[DATABASE POOL ERROR]: Unexpected idle client error:', err.message);
    });

    return pool;
  } catch (err: any) {
    console.error('[DATABASE POOL INITIALIZATION FAILED]:', err.message);
    return null;
  }
}

/**
 * Checks connection health against the PostgreSQL database.
 */
export async function testPostgresConnection(): Promise<DatabaseConnectionStatus> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    lastKnownStatus = {
      isConnected: false,
      provider: 'none',
      error: 'DATABASE_URL is not configured in environment variables.',
    };
    return lastKnownStatus;
  }

  const p = getPostgresPool();
  if (!p) {
    lastKnownStatus = {
      isConnected: false,
      provider: 'none',
      error: 'Could not initialize PostgreSQL pool.',
    };
    return lastKnownStatus;
  }

  try {
    const client = await p.connect();
    try {
      const res = await client.query('SELECT NOW() AS now, current_database() as db, version() as ver;');
      const isSupabase = connectionString.includes('supabase');
      lastKnownStatus = {
        isConnected: true,
        provider: isSupabase ? 'supabase_postgres' : 'local_postgres',
        database: res.rows[0]?.db,
      };
      return lastKnownStatus;
    } finally {
      client.release();
    }
  } catch (err: any) {
    const sanitizedError = (err.message || 'Connection failed')
      .replace(/:\/\/[^@]+@/, '://***:***@')
      .replace(/password=[^ &]+/gi, 'password=***');

    lastKnownStatus = {
      isConnected: false,
      provider: 'none',
      error: `PostgreSQL connection failed: ${sanitizedError}`,
    };
    return lastKnownStatus;
  }
}

/**
 * Executes a parameterized SQL query safely.
 */
export async function query<T extends pg.QueryResultRow = any>(sql: string, params: any[] = []): Promise<pg.QueryResult<T>> {
  const p = getPostgresPool();
  if (!p) {
    throw new Error('Database connection is not available. Please verify DATABASE_URL.');
  }
  return p.query<T>(sql, params);
}

/**
 * Runs operations within an ACID transaction.
 */
export async function withTransaction<T>(
  callback: (client: pg.PoolClient) => Promise<T>
): Promise<T> {
  const p = getPostgresPool();
  if (!p) {
    throw new Error('Database connection is not available for transaction.');
  }

  const client = await p.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Closes the pool cleanly (used in test teardown or process shutdown).
 */
export async function closePostgresPool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
