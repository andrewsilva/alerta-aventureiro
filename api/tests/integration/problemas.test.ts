import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { eq, sql } from 'drizzle-orm';
import { db, pool } from '../../src/db/client.js';
import { problema } from '../../src/db/schema.js';
import { PONTO, app, criarMorador, limparBanco, prepararBanco } from '../helpers.js';

const IMAGEM_PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');

beforeAll(prepararBanco);
beforeEach(limparBanco);
afterAll(() => pool.end());

async function registrar(token: string, extra: Record<string, unknown> = {}) {
  return request(app).post('/api/problemas').set('Authorization', `Bearer ${token}`)
    .send({ tipo: 'BURACO', ...PONTO, descricao: 'Buraco grande na esquina', ...extra });
}

describe('registro de problema (RF02)', () => {
  it('exige login para registrar', async () => {
    const res = await request(app).post('/api/problemas').send({ tipo: 'BURACO', ...PONTO });
    expect(res.status).toBe(401);
  });

  it('registra com status aberto e cria o evento de registro no histórico', async () => {
    const { token } = await criarMorador();
    const res = await registrar(token);
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('ABERTO');

    const detalhe = await request(app).get(`/api/problemas/${res.body.id}`);
    expect(detalhe.body.historico).toHaveLength(1);
    expect(detalhe.body.historico[0].tipoEvento).toBe('REGISTRO');
  });

  it('recusa local fora do bairro Aventureiro', async () => {
    const { token } = await criarMorador();
    const res = await registrar(token, { latitude: -26.304, longitude: -48.846 });
    expect(res.status).toBe(422);
  });

  it('aceita foto do antes em multipart', async () => {
    const { token } = await criarMorador();
    const res = await request(app).post('/api/problemas').set('Authorization', `Bearer ${token}`)
      .field('tipo', 'LIXO_ENTULHO').field('latitude', String(PONTO.latitude)).field('longitude', String(PONTO.longitude))
      .attach('foto', IMAGEM_PNG, { filename: 'entulho.png', contentType: 'image/png' });
    expect(res.status).toBe(201);
    expect(res.body.fotoAntesUrl).toMatch(/^\/uploads\/[0-9a-f-]+\.png$/);
  });
});

describe('duplicidade e confirmação (RF03)', () => {
  it('sugere o problema parecido a menos de 50 metros em vez de duplicar', async () => {
    const sueli = await criarMorador('Sueli');
    const vizinho = await criarMorador('Jorge');
    await registrar(sueli.token);
    const res = await registrar(vizinho.token, { latitude: PONTO.latitude + 0.0002 });
    expect(res.status).toBe(409);
    expect(res.body.detalhes.parecidos).toHaveLength(1);
    expect(res.body.detalhes.parecidos[0].distanciaMetros).toBeLessThanOrEqual(50);
  });

  it('cria mesmo assim quando o morador indica que é outro problema', async () => {
    const sueli = await criarMorador('Sueli');
    const vizinho = await criarMorador('Jorge');
    await registrar(sueli.token);
    const res = await registrar(vizinho.token, { latitude: PONTO.latitude + 0.0002, forcarNovo: true });
    expect(res.status).toBe(201);
  });

  it('soma a confirmação uma única vez por morador e bloqueia o autor', async () => {
    const sueli = await criarMorador('Sueli');
    const vizinho = await criarMorador('Jorge');
    const { body: p } = await registrar(sueli.token);

    const primeira = await request(app).post(`/api/problemas/${p.id}/confirmacoes`).set('Authorization', `Bearer ${vizinho.token}`);
    expect(primeira.status).toBe(201);
    expect(primeira.body.totalConfirmacoes).toBe(1);

    const repetida = await request(app).post(`/api/problemas/${p.id}/confirmacoes`).set('Authorization', `Bearer ${vizinho.token}`);
    expect(repetida.status).toBe(409);

    const doAutor = await request(app).post(`/api/problemas/${p.id}/confirmacoes`).set('Authorization', `Bearer ${sueli.token}`);
    expect(doAutor.status).toBe(422);
  });
});

describe('lista pública (RF04 e RNF02)', () => {
  it('ordena por confirmações e não expõe celular nem nome completo', async () => {
    const sueli = await criarMorador('Sueli Aparecida da Silva');
    const jorge = await criarMorador('Jorge');
    const { body: a } = await registrar(sueli.token);
    await registrar(sueli.token, { tipo: 'CALCADA', latitude: PONTO.latitude + 0.002 });
    await request(app).post(`/api/problemas/${a.id}/confirmacoes`).set('Authorization', `Bearer ${jorge.token}`);

    const res = await request(app).get('/api/problemas');
    expect(res.status).toBe(200);
    expect(res.body[0].id).toBe(a.id);
    expect(res.body[0].autorNome).toBe('Sueli');
    expect(JSON.stringify(res.body)).not.toMatch(/celular|senha/i);
  });

  it('filtra por status', async () => {
    const { token } = await criarMorador();
    await registrar(token);
    const res = await request(app).get('/api/problemas?status=RESOLVIDO');
    expect(res.body).toHaveLength(0);
  });
});

describe('acompanhamento e contestação (RF05 e RF06)', () => {
  it('percorre aviso, andamento, resolução com foto e contestação', async () => {
    const sueli = await criarMorador('Sueli');
    const jorge = await criarMorador('Jorge');
    const auth = (t: string) => ({ Authorization: `Bearer ${t}` });
    const { body: p } = await registrar(sueli.token);

    const semProtocolo = await request(app).patch(`/api/problemas/${p.id}/status`).set(auth(jorge.token)).send({ status: 'AVISADO_PREFEITURA' });
    expect(semProtocolo.status).toBe(422);

    const aviso = await request(app).patch(`/api/problemas/${p.id}/status`).set(auth(jorge.token)).send({ status: 'AVISADO_PREFEITURA', protocolo156: '2026-000123' });
    expect(aviso.body.protocolo156).toBe('2026-000123');

    await request(app).patch(`/api/problemas/${p.id}/status`).set(auth(jorge.token)).send({ status: 'EM_ANDAMENTO' });

    const semFoto = await request(app).post(`/api/problemas/${p.id}/resolucao`).set(auth(jorge.token));
    expect(semFoto.status).toBe(422);

    const resolvido = await request(app).post(`/api/problemas/${p.id}/resolucao`).set(auth(jorge.token))
      .attach('foto', IMAGEM_PNG, { filename: 'depois.png', contentType: 'image/png' });
    expect(resolvido.body.status).toBe('RESOLVIDO');

    const contestado = await request(app).post(`/api/problemas/${p.id}/contestacoes`).set(auth(sueli.token)).send({ motivo: 'O buraco abriu de novo' });
    expect(contestado.status).toBe(200);
    expect(contestado.body.status).toBe('EM_ANDAMENTO');

    const detalhe = await request(app).get(`/api/problemas/${p.id}`);
    expect(detalhe.body.historico.map((h: { tipoEvento: string }) => h.tipoEvento))
      .toEqual(['REGISTRO', 'AVISO_PREFEITURA', 'EM_ANDAMENTO', 'RESOLVIDO', 'CONTESTACAO']);
  });

  it('recusa contestação depois de 7 dias da resolução', async () => {
    const sueli = await criarMorador('Sueli');
    const { body: p } = await registrar(sueli.token);
    await db.update(problema).set({ status: 'RESOLVIDO', resolvidoEm: sql`now() - interval '8 days'` }).where(eq(problema.id, p.id));
    const res = await request(app).post(`/api/problemas/${p.id}/contestacoes`).set('Authorization', `Bearer ${sueli.token}`).send({ motivo: 'Voltou' });
    expect(res.status).toBe(422);
  });
});

describe('segurança de entradas (RNF02)', () => {
  it('recusa script na descrição e não grava nada', async () => {
    const { token } = await criarMorador();
    const res = await registrar(token, { descricao: '<script>alert(1)</script>' });
    expect(res.status).toBe(400);
    const lista = await request(app).get('/api/problemas');
    expect(lista.body).toHaveLength(0);
  });

  it('trata tentativa de injeção de SQL no filtro como valor comum', async () => {
    const { token } = await criarMorador();
    await registrar(token);
    const res = await request(app).get("/api/problemas?status=' OR 1=1 --");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it('impede morador comum de ocultar registros', async () => {
    const { token } = await criarMorador();
    const { body: p } = await registrar(token);
    const res = await request(app).patch(`/api/problemas/${p.id}/ocultar`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('não expõe detalhes técnicos em erros', async () => {
    const res = await request(app).get('/api/problemas/nao-e-um-uuid');
    expect(res.status).toBe(404);
    expect(JSON.stringify(res.body)).not.toMatch(/stack|drizzle|postgres/i);
  });
});
