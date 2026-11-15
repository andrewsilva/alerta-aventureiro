import { z } from 'zod/v4';

const SENHAS_COMUNS = new Set(['12345678', '123456789', 'password', 'senha123', 'qwerty123', '11111111', '00000000', 'abcd1234']);

export const celularSchema = z
  .string()
  .transform((v) => v.replace(/\D/g, ''))
  .refine((v) => /^479\d{8}$/.test(v), 'Informe um celular de Joinville no formato (47) 9XXXX-XXXX.');

export const cadastroSchema = z.object({
  nome: z.string().trim().min(2, 'Informe seu nome.').max(80).refine((v) => !/[<>]/.test(v), 'O nome não pode conter < ou >.'),
  celular: celularSchema,
  senha: z.string().min(8, 'A senha precisa ter pelo menos 8 caracteres.').max(128)
    .refine((v) => !SENHAS_COMUNS.has(v.toLowerCase()), 'Essa senha é muito comum. Escolha outra.'),
  aceiteTermos: z.literal(true, { error: 'É preciso aceitar os termos de uso.' }),
});

export const loginSchema = z.object({
  celular: celularSchema,
  senha: z.string().min(1).max(128),
});
