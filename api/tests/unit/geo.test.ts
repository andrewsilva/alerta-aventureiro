import { describe, expect, it } from 'vitest';
import { caixaAoRedor, dentroDoBairro, distanciaEmMetros } from '../../src/lib/geo.js';

const LIMITES = { latMin: -26.29, latMax: -26.225, lngMin: -48.845, lngMax: -48.775 };

describe('distanciaEmMetros', () => {
  it('retorna zero para o mesmo ponto', () => {
    expect(distanciaEmMetros({ latitude: -26.255, longitude: -48.81 }, { latitude: -26.255, longitude: -48.81 })).toBe(0);
  });

  it('calcula cerca de 111 metros para 0,001 grau de latitude', () => {
    const d = distanciaEmMetros({ latitude: -26.255, longitude: -48.81 }, { latitude: -26.256, longitude: -48.81 });
    expect(d).toBeGreaterThan(110);
    expect(d).toBeLessThan(112);
  });
});

describe('dentroDoBairro', () => {
  it('aceita um ponto dentro dos limites do Aventureiro', () => {
    expect(dentroDoBairro({ latitude: -26.255, longitude: -48.81 }, LIMITES)).toBe(true);
  });

  it('recusa um ponto no centro de Joinville, fora do bairro', () => {
    expect(dentroDoBairro({ latitude: -26.304, longitude: -48.846 }, LIMITES)).toBe(false);
  });
});

describe('caixaAoRedor', () => {
  it('gera uma caixa que contém pontos a 50 metros', () => {
    const centro = { latitude: -26.255, longitude: -48.81 };
    const caixa = caixaAoRedor(centro, 50);
    expect(dentroDoBairro({ latitude: -26.2553, longitude: -48.81 }, caixa)).toBe(true);
    expect(dentroDoBairro({ latitude: -26.2560, longitude: -48.81 }, caixa)).toBe(false);
  });
});
