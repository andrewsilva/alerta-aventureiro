import type { RequestHandler } from 'express';
import type { AuthService, UsuarioToken } from '../modules/auth/auth.service.js';

declare module 'express-serve-static-core' {
  interface Request { usuario?: UsuarioToken }
}

export function autenticar(auth: AuthService): RequestHandler {
  return (req, res, next) => {
    const cabecalho = req.headers.authorization ?? '';
    const token = cabecalho.startsWith('Bearer ') ? cabecalho.slice(7) : '';
    if (!token) { res.status(401).json({ erro: 'Entre na sua conta para continuar.' }); return; }
    try {
      req.usuario = auth.verificarToken(token);
      next();
    } catch {
      res.status(401).json({ erro: 'Sua sessão expirou. Entre novamente.' });
    }
  };
}

export const exigirAdministrador: RequestHandler = (req, res, next) => {
  if (req.usuario?.papel !== 'ADMINISTRADOR') { res.status(403).json({ erro: 'Ação permitida apenas para administradores.' }); return; }
  next();
};
