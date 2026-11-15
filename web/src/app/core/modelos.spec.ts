import { describe, expect, it } from 'vitest';
import { STATUS, diasDesde, rotuloTipo } from './modelos';

describe('modelos', () => {
  it('calcula dias desde o registro', () => {
    const agora = new Date('2026-11-15T12:00:00Z');
    expect(diasDesde('2026-11-10T12:00:00Z', agora)).toBe(5);
    expect(diasDesde('2026-11-15T08:00:00Z', agora)).toBe(0);
  });

  it('traz rótulo e símbolo para todo status, para não depender só da cor', () => {
    for (const s of Object.values(STATUS)) {
      expect(s.rotulo.length).toBeGreaterThan(0);
      expect(s.icone.length).toBeGreaterThan(0);
    }
  });

  it('traduz o tipo do problema para o morador', () => {
    expect(rotuloTipo('LIXO_ENTULHO')).toBe('Lixo/entulho');
  });

  it('usa o nome escrito pelo morador quando o tipo é Outro', () => {
    expect(rotuloTipo('OUTRO', 'Mato alto')).toBe('Mato alto');
    expect(rotuloTipo('OUTRO', null)).toBe('Outro');
    expect(rotuloTipo('BURACO', 'Mato alto')).toBe('Buraco');
  });
});
