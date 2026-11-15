import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import type { Db } from './db/client.js';
import { tratarErros } from './middlewares/erros.js';
import { criarAuthService } from './modules/auth/auth.service.js';
import { rotasAuth } from './modules/auth/auth.routes.js';

export interface OpcoesApp { db: Db; jwtSecret: string; corsOrigin: string; uploadDir: string; limitesBairro: { latMin: number; latMax: number; lngMin: number; lngMax: number } }

export function criarApp(o: OpcoesApp) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors({ origin: o.corsOrigin.split(',').map((s) => s.trim()) }));
  app.use(express.json({ limit: '50kb' }));

  const auth = criarAuthService(o.db, o.jwtSecret);

  app.get('/api/saude', (_req, res) => { res.json({ status: 'ok' }); });
  app.use('/api/auth', rotasAuth(auth));
  app.use((_req, res) => { res.status(404).json({ erro: 'Rota não encontrada.' }); });
  app.use(tratarErros);
  return app;
}
