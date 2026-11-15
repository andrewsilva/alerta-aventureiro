import type { RequestHandler } from 'express';
import type { ZodType } from 'zod/v4';

export function validarCorpo(schema: ZodType): RequestHandler {
  return (req, res, next) => {
    const r = schema.safeParse(req.body);
    if (!r.success) {
      res.status(400).json({ erro: 'Dados inválidos.', campos: r.error.issues.map((i) => ({ campo: i.path.join('.'), mensagem: i.message })) });
      return;
    }
    req.body = r.data;
    next();
  };
}
