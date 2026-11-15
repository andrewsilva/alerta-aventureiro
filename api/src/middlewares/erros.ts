import type { ErrorRequestHandler } from 'express';
import multer from 'multer';
import { ErroDeNegocio } from '../lib/erros.js';

export const tratarErros: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ErroDeNegocio) {
    res.status(err.status).json({ erro: err.message, ...(err.detalhes ? { detalhes: err.detalhes } : {}) });
    return;
  }
  if (err instanceof multer.MulterError || err?.message === 'ARQUIVO_INVALIDO') {
    res.status(400).json({ erro: 'Envie uma imagem JPG, PNG ou WEBP de até 5 MB.' });
    return;
  }
  if (err?.type === 'entity.parse.failed') { res.status(400).json({ erro: 'Requisição inválida.' }); return; }
  // Detalhes técnicos ficam apenas no log do servidor (RNF02).
  console.error(err);
  res.status(500).json({ erro: 'Não foi possível concluir a ação. Tente novamente.' });
};
