import { afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { pool } from '../../src/db/client.js';
import { app } from '../helpers.js';

afterAll(() => pool.end());

describe('monitoramento (GET /api/saude)', () => {
  it('confirma que a API e o banco estão no ar', async () => {
    const res = await request(app).get('/api/saude');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'ok', banco: 'ok' });
    expect(typeof res.body.ativoHaSegundos).toBe('number');
  });
});
