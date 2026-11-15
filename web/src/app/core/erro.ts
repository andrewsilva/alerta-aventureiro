import { HttpErrorResponse } from '@angular/common/http';

/** Converte a resposta de erro da API numa mensagem simples para o morador. */
export function mensagemDeErro(e: unknown): string {
  if (e instanceof HttpErrorResponse) {
    if (e.status === 0) return 'Sem conexão com a internet. Tente de novo em instantes.';
    const corpo = e.error as { erro?: string; campos?: { mensagem: string }[] } | null;
    if (corpo?.campos?.length) return corpo.campos[0].mensagem;
    if (corpo?.erro) return corpo.erro;
  }
  return 'Não foi possível concluir. Tente de novo.';
}
