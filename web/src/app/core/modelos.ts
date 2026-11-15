export type TipoProblema = 'BURACO' | 'LIXO_ENTULHO' | 'CALCADA' | 'ALAGAMENTO' | 'OUTRO';
export type StatusProblema = 'ABERTO' | 'AVISADO_PREFEITURA' | 'EM_ANDAMENTO' | 'RESOLVIDO';
export type TipoEvento = 'REGISTRO' | 'AVISO_PREFEITURA' | 'EM_ANDAMENTO' | 'RESOLVIDO' | 'CONTESTACAO';

export interface Problema {
  id: string;
  tipo: TipoProblema;
  descricao: string | null;
  latitude: number;
  longitude: number;
  referenciaEndereco: string | null;
  fotoAntesUrl: string | null;
  fotoDepoisUrl: string | null;
  status: StatusProblema;
  protocolo156: string | null;
  totalConfirmacoes: number;
  resolvidoEm: string | null;
  criadoEm: string;
  autorId: string;
  autorNome: string;
  distanciaMetros?: number;
}

export interface EventoHistorico {
  tipoEvento: TipoEvento;
  statusAnterior: StatusProblema | null;
  statusNovo: StatusProblema;
  observacao: string | null;
  criadoEm: string;
  autorNome: string;
}

export interface ProblemaDetalhe extends Problema { historico: EventoHistorico[] }

export interface Sessao { token: string; morador: { id: string; nome: string; papel: 'MORADOR' | 'ADMINISTRADOR' } }

export const TIPOS: { valor: TipoProblema; rotulo: string; icone: string }[] = [
  { valor: 'BURACO', rotulo: 'Buraco', icone: '🕳' },
  { valor: 'LIXO_ENTULHO', rotulo: 'Lixo/entulho', icone: '🗑' },
  { valor: 'CALCADA', rotulo: 'Calçada', icone: '🚶' },
  { valor: 'ALAGAMENTO', rotulo: 'Alagamento', icone: '🌧' },
  { valor: 'OUTRO', rotulo: 'Outro', icone: '❔' },
];

export const STATUS: Record<StatusProblema, { rotulo: string; icone: string; classe: string }> = {
  ABERTO: { rotulo: 'Aberto', icone: '⚠', classe: 't-aberto' },
  AVISADO_PREFEITURA: { rotulo: 'Avisado à prefeitura', icone: '✉', classe: 't-avisado' },
  EM_ANDAMENTO: { rotulo: 'Em andamento', icone: '⚙', classe: 't-andamento' },
  RESOLVIDO: { rotulo: 'Resolvido', icone: '✔', classe: 't-resolvido' },
};

export const EVENTOS: Record<TipoEvento, string> = {
  REGISTRO: 'Registrado',
  AVISO_PREFEITURA: 'Avisado à prefeitura',
  EM_ANDAMENTO: 'Em andamento',
  RESOLVIDO: 'Resolvido',
  CONTESTACAO: 'Contestado: o problema voltou',
};

export const rotuloTipo = (t: TipoProblema) => TIPOS.find((x) => x.valor === t)?.rotulo ?? t;

export function diasDesde(iso: string, agora = new Date()): number {
  return Math.max(0, Math.floor((agora.getTime() - new Date(iso).getTime()) / 86_400_000));
}

export function textoDias(iso: string): string {
  const d = diasDesde(iso);
  return d === 0 ? 'hoje' : d === 1 ? 'há 1 dia' : `há ${d} dias`;
}

/** Centro aproximado do bairro Aventureiro, Joinville/SC. */
export const CENTRO_BAIRRO = { latitude: -26.2565, longitude: -48.8095 };
