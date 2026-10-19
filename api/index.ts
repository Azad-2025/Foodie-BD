import 'dotenv/config';
import express from 'express';
import { apiRouter } from '../server/routes';
import { validateAuthConfig } from '../server/auth';
import { validateDatabaseConfig } from '../server/dal';

// Validate critical security and database configurations before handling requests
validateAuthConfig();
validateDatabaseConfig();

const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Healthcheck
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Resilient API routing: mount on both /api and root to handle direct function calls and Vercel rewrites
app.use('/api', apiRouter);
app.use(apiRouter);

export default app;
