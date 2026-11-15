import { describe, expect, it } from 'vitest';
import { normalizarNomeOutro, podeContestar, primeiroNome, validarMudancaDeStatus } from '../../src/modules/problemas/problemas.regras.js';

describe('validarMudancaDeStatus', () => {
  it('permite avisar a prefeitura quando há protocolo', () => {
    expect(validarMudancaDeStatus({ atual: 'ABERTO', novo: 'AVISADO_PREFEITURA', protocolo156: '2026-123' })).toBeNull();
  });

  it('exige protocolo do 156 para marcar como avisado à prefeitura', () => {
    expect(validarMudancaDeStatus({ atual: 'ABERTO', novo: 'AVISADO_PREFEITURA', protocolo156: '  ' })).toMatch(/protocolo/);
  });

  it('não deixa o status voltar para trás', () => {
    expect(validarMudancaDeStatus({ atual: 'EM_ANDAMENTO', novo: 'AVISADO_PREFEITURA', protocolo156: '1' })).toMatch(/avançar/);
  });

  it('exige foto do depois para resolver', () => {
    expect(validarMudancaDeStatus({ atual: 'EM_ANDAMENTO', novo: 'RESOLVIDO' })).toMatch(/foto do depois/);
    expect(validarMudancaDeStatus({ atual: 'EM_ANDAMENTO', novo: 'RESOLVIDO', fotoDepoisUrl: '/uploads/x.jpg' })).toBeNull();
  });

  it('não altera problema já resolvido', () => {
    expect(validarMudancaDeStatus({ atual: 'RESOLVIDO', novo: 'RESOLVIDO', fotoDepoisUrl: 'x' })).toMatch(/contestação/);
  });
});

describe('podeContestar', () => {
  const agora = new Date('2026-11-20T12:00:00Z');

  it('permite contestar até 7 dias após a resolução', () => {
    expect(podeContestar('RESOLVIDO', new Date('2026-11-15T12:00:00Z'), agora)).toBeNull();
  });

  it('recusa contestação depois de 7 dias', () => {
    expect(podeContestar('RESOLVIDO', new Date('2026-11-10T12:00:00Z'), agora)).toMatch(/prazo/);
  });

  it('recusa contestação de problema que não está resolvido', () => {
    expect(podeContestar('EM_ANDAMENTO', null, agora)).toMatch(/resolvido/);
  });
});

describe('primeiroNome', () => {
  it('expõe apenas o primeiro nome do autor', () => {
    expect(primeiroNome('  Sueli Aparecida da Silva ')).toBe('Sueli');
  });
});

describe('normalizarNomeOutro', () => {
  it('junta espaços e deixa só a primeira letra maiúscula', () => {
    expect(normalizarNomeOutro('  ÁRVORE   caída ')).toBe('Árvore caída');
    expect(normalizarNomeOutro('mato alto')).toBe(normalizarNomeOutro('Mato Alto'));
  });
});
