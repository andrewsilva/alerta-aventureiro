import express from 'express';
import { sql } from 'drizzle-orm';
import cors from 'cors';
import helmet from 'helmet';
import type { Db } from './db/client.js';
import type { Limites } from './lib/geo.js';
import { registrarAcessos } from './lib/acessos.js';
import { tratarErros } from './middlewares/erros.js';
import { criarAuthService } from './modules/auth/auth.service.js';
import { rotasAuth } from './modules/auth/auth.routes.js';
import { criarProblemasService } from './modules/problemas/problemas.service.js';
import { rotasProblemas } from './modules/problemas/problemas.routes.js';

export interface OpcoesApp {
  db: Db; jwtSecret: string; corsOrigin: string; uploadDir: string; limitesBairro: Limites;
  /** Quantos proxies imediatos podem informar o endereço do cliente. */
  trustProxy?: number;
  /** Log de acessos para monitoramento; desligado nos testes. */
  registrarAcessos?: boolean;
}

export function criarApp(o: OpcoesApp) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', o.trustProxy ?? 0);
  if (o.registrarAcessos) app.use(registrarAcessos);
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors({ origin: o.corsOrigin.split(',').map((s) => s.trim()) }));
  app.use(express.json({ limit: '50kb' }));

  const auth = criarAuthService(o.db, o.jwtSecret);
  const problemas = criarProblemasService(o.db, o.limitesBairro);

  app.get('/api/saude', async (_req, res) => {
    res.set('Cache-Control', 'no-store');
    try {
      await o.db.execute(sql`select 1`);
      res.json({ status: 'ok', banco: 'ok', ativoHaSegundos: Math.round(process.uptime()) });
    } catch (err) {
      console.error(err);
      res.status(503).json({ status: 'erro', banco: 'indisponivel' });
    }
  });
  app.use('/api/auth', rotasAuth(auth));
  app.use('/api/problemas', rotasProblemas(problemas, auth, o.uploadDir));
  app.use('/uploads', express.static(o.uploadDir, { fallthrough: false, maxAge: '7d' }));
  app.use((_req, res) => { res.status(404).json({ erro: 'Rota não encontrada.' }); });
  app.use(tratarErros);
  return app;
}
