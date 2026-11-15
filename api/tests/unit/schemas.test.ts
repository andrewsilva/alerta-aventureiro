import { describe, expect, it } from 'vitest';
import { cadastroSchema } from '../../src/modules/auth/auth.schemas.js';

describe('cadastroSchema', () => {
  const base = { nome: 'Sueli', celular: '(47) 99123-4567', senha: 'minha-rua-tem-buraco', aceiteTermos: true };

  it('normaliza o celular para apenas números', () => {
    expect(cadastroSchema.parse(base).celular).toBe('47991234567');
  });

  it('recusa celular fora do formato de Joinville', () => {
    expect(cadastroSchema.safeParse({ ...base, celular: '(11) 99123-4567' }).success).toBe(false);
  });

  it('recusa senha curta e senha comum', () => {
    expect(cadastroSchema.safeParse({ ...base, senha: '1234567' }).success).toBe(false);
    expect(cadastroSchema.safeParse({ ...base, senha: '12345678' }).success).toBe(false);
  });
});
