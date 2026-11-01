import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './server/routes';
import { validateAuthConfig } from './server/auth';
import { validateDatabaseConfig } from './server/dal';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  // Validate critical security and database configurations with safe hosting notices
  try {
    validateAuthConfig();
  } catch (err: any) {
    console.warn('⚠️ [AUTH NOTICE]:', err.message);
  }

  try {
    validateDatabaseConfig();
  } catch (err: any) {
    console.warn('⚠️ [DATABASE NOTICE]:', err.message);
  }

  const app = express();

  // CLI argument parsing takes precedence when --port is provided (e.g. npm run dev --port 3000)
  const args = process.argv.slice(2);
  const portArgIndex = args.indexOf('--port');
  const portFromArgs =
    portArgIndex !== -1 && args[portArgIndex + 1] ? parseInt(args[portArgIndex + 1], 10) : null;
  const PORT = portFromArgs || (process.env.DEFAULT_APP_PORT ? parseInt(process.env.DEFAULT_APP_PORT, 10) : (process.env.PORT ? parseInt(process.env.PORT, 10) : 3000));

  // Request timeout protection: prevent hanging requests from triggering Cloud Run / Nginx 504 Gateway Timeout
  app.use((req, res, next) => {
    req.setTimeout(25000, () => {
      if (!res.headersSent) {
        res.status(504).json({
          error: 'সার্ভার রেসপন্স টাইমআউট হয়েছে (504 Gateway Timeout)। অনুগ্রহ করে পুনরায় চেষ্টা করুন।',
        });
      }
    });
    next();
  });

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // API router
  app.use('/api', apiRouter);

  // Healthcheck
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve production dist static files and public fallback
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.use(express.static(path.resolve(__dirname, 'public')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Foodie BD (খাদক ম্যাপ) server running at http://0.0.0.0:${PORT}`);
  });

  // Keep-alive settings to prevent 502/504 gateway timeout behind Cloud Run & Nginx reverse proxies
  server.keepAliveTimeout = 65000;
  server.headersTimeout = 66000;
  server.requestTimeout = 30000;
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
