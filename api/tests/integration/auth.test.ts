import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { eq } from 'drizzle-orm';
import { db, pool } from '../../src/db/client.js';
import { morador } from '../../src/db/schema.js';
import { app, limparBanco, prepararBanco } from '../helpers.js';

const dados = { nome: 'Sueli Aparecida', celular: '(47) 99111-2222', senha: 'buraco-na-esquina', aceiteTermos: true };

beforeAll(prepararBanco);
beforeEach(limparBanco);
afterAll(() => pool.end());

describe('POST /api/auth/cadastro', () => {
  it('cria a conta, devolve token e guarda apenas o hash Argon2id da senha', async () => {
    const res = await request(app).post('/api/auth/cadastro').send(dados);
    expect(res.status).toBe(201);
    expect(res.body.token).toBeTruthy();
    expect(res.body.morador).not.toHaveProperty('senhaHash');

    const [salvo] = await db.select().from(morador).where(eq(morador.celular, '47991112222'));
    expect(salvo.senhaHash.startsWith('$argon2id$')).toBe(true);
    expect(salvo.senhaHash).not.toContain(dados.senha);
  });

  it('recusa celular já cadastrado', async () => {
    await request(app).post('/api/auth/cadastro').send(dados);
    const res = await request(app).post('/api/auth/cadastro').send(dados);
    expect(res.status).toBe(409);
    expect(res.body.erro).toBe('Este celular já tem conta.');
  });

  it('recusa cadastro sem aceite dos termos com mensagem do campo', async () => {
    const res = await request(app).post('/api/auth/cadastro').send({ ...dados, aceiteTermos: false });
    expect(res.status).toBe(400);
    expect(res.body.campos[0].campo).toBe('aceiteTermos');
  });
});

describe('POST /api/auth/login', () => {
  it('entra com celular e senha corretos', async () => {
    await request(app).post('/api/auth/cadastro').send(dados);
    const res = await request(app).post('/api/auth/login').send({ celular: dados.celular, senha: dados.senha });
    expect(res.status).toBe(200);
    expect(res.body.morador.nome).toBe('Sueli Aparecida');
  });

  it('usa a mesma mensagem para celular inexistente e senha errada', async () => {
    await request(app).post('/api/auth/cadastro').send(dados);
    const senhaErrada = await request(app).post('/api/auth/login').send({ celular: dados.celular, senha: 'errada-123' });
    const semConta = await request(app).post('/api/auth/login').send({ celular: '(47) 99999-0000', senha: 'qualquer-123' });
    expect(senhaErrada.status).toBe(401);
    expect(semConta.status).toBe(401);
    expect(senhaErrada.body.erro).toBe(semConta.body.erro);
  });
});
