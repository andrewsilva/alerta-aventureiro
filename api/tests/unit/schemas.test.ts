import { describe, expect, it } from 'vitest';
import { cadastroSchema } from '../../src/modules/auth/auth.schemas.js';
import { novoProblemaSchema } from '../../src/modules/problemas/problemas.schemas.js';

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

describe('novoProblemaSchema', () => {
  it('aceita tipo e local válidos', () => {
    expect(novoProblemaSchema.safeParse({ tipo: 'BURACO', latitude: '-26.255', longitude: '-48.81' }).success).toBe(true);
  });

  it('recusa tipo fora da lista', () => {
    expect(novoProblemaSchema.safeParse({ tipo: 'ASSALTO', latitude: -26.255, longitude: -48.81 }).success).toBe(false);
  });

  it('recusa marcação HTML na descrição', () => {
    const r = novoProblemaSchema.safeParse({ tipo: 'BURACO', latitude: -26.255, longitude: -48.81, descricao: '<script>alert(1)</script>' });
    expect(r.success).toBe(false);
  });

  it('exige o nome do problema quando o tipo é Outro', () => {
    const r = novoProblemaSchema.safeParse({ tipo: 'OUTRO', latitude: -26.255, longitude: -48.81 });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].path).toEqual(['nomeOutro']);
  });

  it('padroniza o nome em Outro e descarta o nome nos outros tipos', () => {
    expect(novoProblemaSchema.parse({ tipo: 'OUTRO', nomeOutro: '  MATO   alto ', latitude: -26.255, longitude: -48.81 }).nomeOutro).toBe('Mato alto');
    expect(novoProblemaSchema.parse({ tipo: 'BURACO', nomeOutro: 'Mato alto', latitude: -26.255, longitude: -48.81 }).nomeOutro).toBeUndefined();
  });
});
