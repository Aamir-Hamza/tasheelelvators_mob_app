import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { connectDb } from './config/db';
import authRoutes from './routes/auth';
import elevatorRoutes from './routes/elevators';
import faultRoutes from './routes/faults';
import emergencyRoutes from './routes/emergencies';
import maintenanceRoutes from './routes/maintenance';
import notificationRoutes from './routes/notifications';
import { errorHandler, notFound } from './middlewares/errorHandler';

async function bootstrap() {
  await connectDb();

  const app = express();
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      crossOriginOpenerPolicy: false,
    })
  );
  app.use(cors({ origin: true }));
  app.use(morgan('dev'));
  app.use(express.json({ limit: '20mb' }));
  app.set('etag', false);
  app.use((_req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.set('Pragma', 'no-cache');
    next();
  });

  app.get('/', (_req, res) => {
    res.json({
      ok: true,
      service: 'tasheel-api',
      health: '/health',
      api: '/api',
    });
  });

  app.get('/health', (_req, res) => {
    res.json({ ok: true, service: 'tasheel-api' });
  });

  app.get('/json/version', (_req, res) => {
    res.json({ Browser: 'tasheel-api', 'Protocol-Version': '1.3' });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/elevators', elevatorRoutes);
  app.use('/api/faults', faultRoutes);
  app.use('/api/emergencies', emergencyRoutes);
  app.use('/api/maintenance', maintenanceRoutes);
  app.use('/api/notifications', notificationRoutes);

  app.use(notFound);
  app.use(errorHandler);

  const server = app.listen(env.port, '0.0.0.0', () => {
    console.log(`Tasheel API listening on http://0.0.0.0:${env.port}`);
  });

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${env.port} is already in use. The API is already running — do not start it twice.`);
      process.exit(0);
    }
    console.error(err);
    process.exit(1);
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
});
