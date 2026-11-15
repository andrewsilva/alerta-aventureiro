import type { StatusProblema } from '../../db/schema.js';

export const RAIO_PARECIDOS_METROS = 50;
export const PRAZO_CONTESTACAO_DIAS = 7;
/** Quantos moradores diferentes precisam usar o mesmo nome em "Outro" para ele virar sugestão. */
export const MIN_MORADORES_TIPO_SUGERIDO = 3;
export const MAX_TIPOS_SUGERIDOS = 4;

const ORDEM: StatusProblema[] = ['ABERTO', 'AVISADO_PREFEITURA', 'EM_ANDAMENTO', 'RESOLVIDO'];

export interface MudancaStatus {
  atual: StatusProblema;
  novo: StatusProblema;
  protocolo156?: string | null;
  fotoDepoisUrl?: string | null;
}

/** Retorna null se a mudança é válida, ou a mensagem explicando por que não é. */
export function validarMudancaDeStatus(m: MudancaStatus): string | null {
  if (m.atual === 'RESOLVIDO') return 'Problema já resolvido. Se ele voltou, use a contestação.';
  if (ORDEM.indexOf(m.novo) <= ORDEM.indexOf(m.atual)) return 'O status só pode avançar na ordem: aberto, avisado à prefeitura, em andamento, resolvido.';
  if (m.novo === 'AVISADO_PREFEITURA' && !m.protocolo156?.trim()) return 'Informe o número de protocolo do 156.';
  if (m.novo === 'RESOLVIDO' && !m.fotoDepoisUrl) return 'Para marcar como resolvido, envie a foto do depois.';
  return null;
}

export function podeContestar(status: StatusProblema, resolvidoEm: Date | null, agora = new Date()): string | null {
  if (status !== 'RESOLVIDO' || !resolvidoEm) return 'Só é possível contestar um problema marcado como resolvido.';
  const limite = new Date(resolvidoEm.getTime() + PRAZO_CONTESTACAO_DIAS * 24 * 60 * 60 * 1000);
  if (agora > limite) return `O prazo de ${PRAZO_CONTESTACAO_DIAS} dias para contestar já terminou.`;
  return null;
}

export function eventoParaStatus(novo: StatusProblema) {
  switch (novo) {
    case 'AVISADO_PREFEITURA': return 'AVISO_PREFEITURA' as const;
    case 'EM_ANDAMENTO': return 'EM_ANDAMENTO' as const;
    case 'RESOLVIDO': return 'RESOLVIDO' as const;
    default: return 'REGISTRO' as const;
  }
}

export function primeiroNome(nome: string): string {
  return nome.trim().split(/\s+/)[0] ?? '';
}

/** Padroniza o nome escrito em "Outro" para que "mato alto" e "Mato  Alto" contem como o mesmo problema. */
export function normalizarNomeOutro(nome: string): string {
  const limpo = nome.trim().replace(/\s+/g, ' ').toLocaleLowerCase('pt-BR');
  return limpo.charAt(0).toLocaleUpperCase('pt-BR') + limpo.slice(1);
}
