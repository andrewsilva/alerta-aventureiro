import type { RequestHandler } from 'express';

/**
 * Monitoramento pós-lançamento: uma linha JSON por requisição, lida nos logs do Render.
 * Não registra corpo, parâmetros de consulta, token nem IP, só o necessário para ver uso, erros e lentidão.
 */
export const registrarAcessos: RequestHandler = (req, res, next) => {
  const inicio = process.hrtime.bigint();
  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - inicio) / 1e6;
    const rota = typeof req.route?.path === 'string'
      ? `${req.baseUrl}${req.route.path}`
      : req.originalUrl.startsWith('/uploads/') ? '/uploads/:arquivo' : null;
    console.log(JSON.stringify({
      em: new Date().toISOString(),
      metodo: req.method,
      rota,
      status: res.statusCode,
      ms: Math.round(ms),
    }));
  });
  next();
};
