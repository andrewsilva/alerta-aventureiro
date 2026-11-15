import { Router, type RequestHandler } from 'express';
import { z } from 'zod';
import { autenticar, exigirAdministrador } from '../../middlewares/autenticar.js';
import { validarCorpo } from '../../middlewares/validar.js';
import { criarUpload, urlDoArquivo } from '../../lib/upload.js';
import { regraViolada } from '../../lib/erros.js';
import type { AuthService } from '../auth/auth.service.js';
import type { ProblemasService } from './problemas.service.js';
import { contestacaoSchema, filtroListaSchema, mudancaStatusSchema, novoProblemaSchema } from './problemas.schemas.js';

const idValido: RequestHandler = (req, res, next) => {
  if (!z.string().uuid().safeParse(req.params.id).success) { res.status(404).json({ erro: 'Problema não encontrado.' }); return; }
  next();
};

export function rotasProblemas(servico: ProblemasService, auth: AuthService, pastaUploads: string) {
  const r = Router();
  const logado = autenticar(auth);
  const upload = criarUpload(pastaUploads);

  r.get('/', async (req, res) => {
    const filtro = filtroListaSchema.safeParse(req.query);
    res.json(await servico.listar(filtro.success ? filtro.data : {}));
  });

  // Antes de /:id para não ser tratado como identificador.
  r.get('/tipos-sugeridos', async (_req, res) => {
    res.json(await servico.tiposSugeridos());
  });

  r.get('/:id', idValido, async (req, res) => {
    res.json(await servico.detalhar(String(req.params.id)));
  });

  r.post('/', logado, upload.single('foto'), validarCorpo(novoProblemaSchema), async (req, res) => {
    const criado = await servico.registrar(req.usuario!.id, { ...req.body, fotoAntesUrl: urlDoArquivo(req.file) });
    res.status(201).json(criado);
  });

  r.post('/:id/confirmacoes', logado, idValido, async (req, res) => {
    res.status(201).json(await servico.confirmar(String(req.params.id), req.usuario!.id));
  });

  r.patch('/:id/status', logado, idValido, validarCorpo(mudancaStatusSchema), async (req, res) => {
    res.json(await servico.mudarStatus(String(req.params.id), req.usuario!.id, req.body));
  });

  r.post('/:id/resolucao', logado, idValido, upload.single('foto'), async (req, res) => {
    const fotoDepoisUrl = urlDoArquivo(req.file);
    if (!fotoDepoisUrl) throw regraViolada('Para marcar como resolvido, envie a foto do depois.');
    res.json(await servico.mudarStatus(String(req.params.id), req.usuario!.id, { status: 'RESOLVIDO', fotoDepoisUrl }));
  });

  r.post('/:id/contestacoes', logado, idValido, validarCorpo(contestacaoSchema), async (req, res) => {
    res.json(await servico.contestar(String(req.params.id), req.usuario!.id, req.body.motivo));
  });

  r.patch('/:id/ocultar', logado, exigirAdministrador, idValido, async (req, res) => {
    await servico.ocultar(String(req.params.id), req.usuario!);
    res.status(204).end();
  });

  return r;
}
