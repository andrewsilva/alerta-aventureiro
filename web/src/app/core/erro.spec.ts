import { HttpErrorResponse } from '@angular/common/http';
import { describe, expect, it } from 'vitest';
import { mensagemDeErro } from './erro';

describe('mensagemDeErro', () => {
  it('mostra a mensagem do primeiro campo inválido', () => {
    const e = new HttpErrorResponse({ status: 400, error: { erro: 'Dados inválidos.', campos: [{ campo: 'tipo', mensagem: 'Escolha o tipo do problema.' }] } });
    expect(mensagemDeErro(e)).toBe('Escolha o tipo do problema.');
  });

  it('avisa quando não há conexão', () => {
    expect(mensagemDeErro(new HttpErrorResponse({ status: 0 }))).toMatch(/Sem conexão/);
  });

  it('usa mensagem genérica para erros desconhecidos', () => {
    expect(mensagemDeErro(new Error('x'))).toBe('Não foi possível concluir. Tente de novo.');
  });
});
