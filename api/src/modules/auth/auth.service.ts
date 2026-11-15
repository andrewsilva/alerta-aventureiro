import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import type { Db } from '../../db/client.js';
import { morador } from '../../db/schema.js';
import { ErroDeNegocio, conflito } from '../../lib/erros.js';

export interface UsuarioToken { id: string; nome: string; papel: 'MORADOR' | 'ADMINISTRADOR' }

// Parâmetros do Argon2id alinhados à recomendação do OWASP (19 MiB, 2 iterações, paralelismo 1).
const OPCOES_ARGON2 = { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 } as const;
const MENSAGEM_LOGIN_INVALIDO = 'Celular ou senha incorretos.';

export function criarAuthService(db: Db, jwtSecret: string) {
  function emitirToken(u: UsuarioToken) {
    return jwt.sign({ nome: u.nome, papel: u.papel }, jwtSecret, { subject: u.id, expiresIn: '1h' });
  }

  return {
    async cadastrar(dados: { nome: string; celular: string; senha: string }) {
      const existente = await db.query.morador.findFirst({ where: eq(morador.celular, dados.celular) });
      if (existente) throw conflito('Este celular já tem conta.');
      const senhaHash = await argon2.hash(dados.senha, OPCOES_ARGON2);
      const [novo] = await db.insert(morador)
        .values({ nome: dados.nome, celular: dados.celular, senhaHash, aceiteTermosEm: new Date() })
        .returning({ id: morador.id, nome: morador.nome, papel: morador.papel });
      return { token: emitirToken(novo), morador: novo };
    },

    async login(dados: { celular: string; senha: string }) {
      const encontrado = await db.query.morador.findFirst({ where: eq(morador.celular, dados.celular) });
      const valido = encontrado ? await argon2.verify(encontrado.senhaHash, dados.senha) : false;
      if (!encontrado || !valido) throw new ErroDeNegocio(401, MENSAGEM_LOGIN_INVALIDO);
      const u = { id: encontrado.id, nome: encontrado.nome, papel: encontrado.papel };
      return { token: emitirToken(u), morador: u };
    },

    verificarToken(token: string): UsuarioToken {
      const p = jwt.verify(token, jwtSecret) as jwt.JwtPayload;
      return { id: String(p.sub), nome: String(p.nome), papel: p.papel };
    },
  };
}

export type AuthService = ReturnType<typeof criarAuthService>;
