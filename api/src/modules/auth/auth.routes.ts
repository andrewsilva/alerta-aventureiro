import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { validarCorpo } from '../../middlewares/validar.js';
import { cadastroSchema, loginSchema } from './auth.schemas.js';
import type { AuthService } from './auth.service.js';

export function rotasAuth(auth: AuthService) {
  const r = Router();
  // Até 5 tentativas de login a cada 15 minutos por IP (RNF01).
  const limiteLogin = rateLimit({
    windowMs: 15 * 60 * 1000, limit: 5, standardHeaders: 'draft-7', legacyHeaders: false,
    message: { erro: 'Muitas tentativas. Aguarde 15 minutos e tente de novo.' },
    skipSuccessfulRequests: true,
  });

  r.post('/cadastro', validarCorpo(cadastroSchema), async (req, res) => {
    res.status(201).json(await auth.cadastrar(req.body));
  });

  r.post('/login', limiteLogin, validarCorpo(loginSchema), async (req, res) => {
    res.json(await auth.login(req.body));
  });

  return r;
}
