import { z } from 'zod/v4';
import { tipoProblemaEnum, statusProblemaEnum } from '../../db/schema.js';

const textoLivre = (max: number, campo: string) =>
  z.string().trim().max(max, `${campo} pode ter até ${max} caracteres.`).refine((v) => !/[<>]/.test(v), `${campo} não pode conter < ou >.`);

export const novoProblemaSchema = z.object({
  tipo: z.enum(tipoProblemaEnum.enumValues, { error: 'Escolha o tipo do problema.' }),
  latitude: z.coerce.number({ error: 'Informe o local do problema.' }).min(-90).max(90),
  longitude: z.coerce.number({ error: 'Informe o local do problema.' }).min(-180).max(180),
  descricao: textoLivre(280, 'A descrição').optional().transform((v) => v || undefined),
  referenciaEndereco: textoLivre(120, 'A referência').optional().transform((v) => v || undefined),
  forcarNovo: z.union([z.boolean(), z.enum(['true', 'false']).transform((v) => v === 'true')]).optional().default(false),
});

export const mudancaStatusSchema = z.object({
  status: z.enum(['AVISADO_PREFEITURA', 'EM_ANDAMENTO'], { error: 'Status inválido.' }),
  protocolo156: textoLivre(40, 'O protocolo').optional(),
  observacao: textoLivre(200, 'A observação').optional(),
});

export const contestacaoSchema = z.object({
  motivo: textoLivre(200, 'O motivo').pipe(z.string().min(3, 'Conte em poucas palavras por que o problema voltou.')),
});

export const filtroListaSchema = z.object({
  status: z.enum(statusProblemaEnum.enumValues).optional(),
});

