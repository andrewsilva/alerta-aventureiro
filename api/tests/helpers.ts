import { sql } from 'drizzle-orm';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import request from 'supertest';
import { db } from '../src/db/client.js';
import { criarApp } from '../src/app.js';
import { config } from '../src/config.js';

export const app = criarApp({ db, jwtSecret: config.jwtSecret, corsOrigin: 'http://localhost:4200', uploadDir: config.uploadDir, limitesBairro: config.bairro });

export async function prepararBanco() {
  await migrate(db, { migrationsFolder: './drizzle' });
}

export async function limparBanco() {
  await db.execute(sql`TRUNCATE historico_status, confirmacao, problema, morador RESTART IDENTITY CASCADE`);
}

let contador = 0;
export async function criarMorador(nome = 'Sueli Teste') {
  contador += 1;
  const celular = `(47) 9${String(10_000_000 + contador).slice(-8)}`;
  const res = await request(app).post('/api/auth/cadastro').send({ nome, celular, senha: 'buraco-na-rua-2026', aceiteTermos: true });
  return { token: res.body.token as string, id: res.body.morador.id as string, celular };
}

// Ponto dentro do bairro Aventureiro usado nos testes
export const PONTO = { latitude: -26.2550, longitude: -48.8100 };
