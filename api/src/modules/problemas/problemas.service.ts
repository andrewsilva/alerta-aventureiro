import { and, asc, countDistinct, desc, eq, gte, isNotNull, lte, ne, sql } from 'drizzle-orm';
import type { Db } from '../../db/client.js';
import { confirmacao, historicoStatus, morador, problema } from '../../db/schema.js';
import type { StatusProblema, TipoProblema } from '../../db/schema.js';
import { conflito, naoEncontrado, proibido, regraViolada } from '../../lib/erros.js';
import { caixaAoRedor, dentroDoBairro, distanciaEmMetros, type Limites } from '../../lib/geo.js';
import {
  MAX_TIPOS_SUGERIDOS, MIN_MORADORES_TIPO_SUGERIDO, RAIO_PARECIDOS_METROS, eventoParaStatus, podeContestar, primeiroNome, validarMudancaDeStatus,
} from './problemas.regras.js';

export interface NovoProblema {
  tipo: TipoProblema;
  nomeOutro?: string;
  latitude: number;
  longitude: number;
  descricao?: string;
  referenciaEndereco?: string;
  fotoAntesUrl?: string;
  forcarNovo?: boolean;
}

const camposPublicos = {
  id: problema.id,
  tipo: problema.tipo,
  nomeOutro: problema.nomeOutro,
  descricao: problema.descricao,
  latitude: problema.latitude,
  longitude: problema.longitude,
  referenciaEndereco: problema.referenciaEndereco,
  fotoAntesUrl: problema.fotoAntesUrl,
  fotoDepoisUrl: problema.fotoDepoisUrl,
  status: problema.status,
  protocolo156: problema.protocolo156,
  totalConfirmacoes: problema.totalConfirmacoes,
  resolvidoEm: problema.resolvidoEm,
  criadoEm: problema.criadoEm,
  autorId: problema.moradorId,
  autorNome: morador.nome,
};

type LinhaPublica = { autorNome: string } & Record<string, unknown>;
// O celular e o hash da senha nunca saem da API; do autor, só o primeiro nome (RNF02).
const publicar = <T extends LinhaPublica>(l: T) => ({ ...l, autorNome: primeiroNome(l.autorNome) });

export function criarProblemasService(db: Db, limitesBairro: Limites) {
  async function buscar(id: string) {
    const [p] = await db.select().from(problema).where(and(eq(problema.id, id), eq(problema.oculto, false)));
    if (!p) throw naoEncontrado('Problema não encontrado.');
    return p;
  }

  async function parecidos(tipo: TipoProblema, latitude: number, longitude: number, nomeOutro?: string) {
    const caixa = caixaAoRedor({ latitude, longitude }, RAIO_PARECIDOS_METROS);
    const candidatos = await db.select(camposPublicos).from(problema)
      .innerJoin(morador, eq(problema.moradorId, morador.id))
      .where(and(
        eq(problema.tipo, tipo), ne(problema.status, 'RESOLVIDO'), eq(problema.oculto, false),
        // Em "Outro", só é parecido se o nome também for o mesmo (mato alto não duplica árvore caída).
        ...(tipo === 'OUTRO' && nomeOutro ? [eq(problema.nomeOutro, nomeOutro)] : []),
        gte(problema.latitude, caixa.latMin), lte(problema.latitude, caixa.latMax),
        gte(problema.longitude, caixa.lngMin), lte(problema.longitude, caixa.lngMax),
      ));
    return candidatos
      .map((c) => ({ ...publicar(c), distanciaMetros: Math.round(distanciaEmMetros({ latitude, longitude }, c)) }))
      .filter((c) => c.distanciaMetros <= RAIO_PARECIDOS_METROS)
      .sort((a, b) => a.distanciaMetros - b.distanciaMetros);
  }

  return {
    parecidos,

    async registrar(autorId: string, dados: NovoProblema) {
      if (!dentroDoBairro(dados, limitesBairro)) throw regraViolada('O local informado fica fora do bairro Aventureiro.');
      if (!dados.forcarNovo) {
        const similares = await parecidos(dados.tipo, dados.latitude, dados.longitude, dados.nomeOutro);
        if (similares.length) throw conflito('Já existe um problema parecido registrado perto deste local.', { parecidos: similares });
      }
      return db.transaction(async (tx) => {
        const [novo] = await tx.insert(problema).values({
          tipo: dados.tipo, nomeOutro: dados.tipo === 'OUTRO' ? dados.nomeOutro : undefined, latitude: dados.latitude, longitude: dados.longitude,
          descricao: dados.descricao, referenciaEndereco: dados.referenciaEndereco,
          fotoAntesUrl: dados.fotoAntesUrl, moradorId: autorId,
        }).returning();
        await tx.insert(historicoStatus).values({
          problemaId: novo.id, moradorId: autorId, tipoEvento: 'REGISTRO', statusNovo: 'ABERTO',
        });
        return novo;
      });
    },

    async listar(filtro: { status?: StatusProblema }) {
      const condicoes = [eq(problema.oculto, false)];
      if (filtro.status) condicoes.push(eq(problema.status, filtro.status));
      const linhas = await db.select(camposPublicos).from(problema)
        .innerJoin(morador, eq(problema.moradorId, morador.id))
        .where(and(...condicoes))
        .orderBy(desc(problema.totalConfirmacoes), asc(problema.criadoEm))
        .limit(100);
      return linhas.map(publicar);
    },

    /** Nomes usados em "Outro" por pelo menos 3 moradores diferentes viram botões sugeridos no registro. */
    async tiposSugeridos() {
      const moradores = countDistinct(problema.moradorId);
      const linhas = await db.select({ nome: problema.nomeOutro, moradores }).from(problema)
        .where(and(eq(problema.tipo, 'OUTRO'), isNotNull(problema.nomeOutro), eq(problema.oculto, false)))
        .groupBy(problema.nomeOutro)
        .having(gte(moradores, MIN_MORADORES_TIPO_SUGERIDO))
        .orderBy(desc(moradores), asc(problema.nomeOutro))
        .limit(MAX_TIPOS_SUGERIDOS);
      return linhas.map((l) => ({ nome: l.nome as string, moradores: Number(l.moradores) }));
    },

    async detalhar(id: string) {
      const [linha] = await db.select(camposPublicos).from(problema)
        .innerJoin(morador, eq(problema.moradorId, morador.id))
        .where(and(eq(problema.id, id), eq(problema.oculto, false)));
      if (!linha) throw naoEncontrado('Problema não encontrado.');
      const historico = await db.select({
        tipoEvento: historicoStatus.tipoEvento, statusAnterior: historicoStatus.statusAnterior,
        statusNovo: historicoStatus.statusNovo, observacao: historicoStatus.observacao,
        criadoEm: historicoStatus.criadoEm, autorNome: morador.nome,
      }).from(historicoStatus)
        .innerJoin(morador, eq(historicoStatus.moradorId, morador.id))
        .where(eq(historicoStatus.problemaId, id))
        .orderBy(asc(historicoStatus.criadoEm));
      return { ...publicar(linha), historico: historico.map(publicar) };
    },

    async confirmar(problemaId: string, moradorId: string) {
      const p = await buscar(problemaId);
      if (p.moradorId === moradorId) throw regraViolada('Você registrou este problema, então ele já conta com você.');
      if (p.status === 'RESOLVIDO') throw regraViolada('Este problema já foi resolvido. Se ele voltou, use a contestação.');
      return db.transaction(async (tx) => {
        const inserida = await tx.insert(confirmacao).values({ problemaId, moradorId }).onConflictDoNothing().returning();
        if (!inserida.length) throw conflito('Você já confirmou este problema.');
        const [atualizado] = await tx.update(problema)
          .set({ totalConfirmacoes: sql`${problema.totalConfirmacoes} + 1`, atualizadoEm: new Date() })
          .where(eq(problema.id, problemaId))
          .returning({ totalConfirmacoes: problema.totalConfirmacoes });
        return atualizado;
      });
    },

    async mudarStatus(problemaId: string, moradorId: string, dados: { status: StatusProblema; protocolo156?: string; observacao?: string; fotoDepoisUrl?: string }) {
      const p = await buscar(problemaId);
      const erro = validarMudancaDeStatus({ atual: p.status, novo: dados.status, protocolo156: dados.protocolo156, fotoDepoisUrl: dados.fotoDepoisUrl });
      if (erro) throw regraViolada(erro);
      return db.transaction(async (tx) => {
        const [atualizado] = await tx.update(problema).set({
          status: dados.status,
          ...(dados.protocolo156 ? { protocolo156: dados.protocolo156 } : {}),
          ...(dados.status === 'RESOLVIDO' ? { fotoDepoisUrl: dados.fotoDepoisUrl, resolvidoEm: new Date() } : {}),
          atualizadoEm: new Date(),
        }).where(eq(problema.id, problemaId)).returning();
        await tx.insert(historicoStatus).values({
          problemaId, moradorId, tipoEvento: eventoParaStatus(dados.status),
          statusAnterior: p.status, statusNovo: dados.status, observacao: dados.observacao,
        });
        return atualizado;
      });
    },

    async contestar(problemaId: string, moradorId: string, motivo: string) {
      const p = await buscar(problemaId);
      const erro = podeContestar(p.status, p.resolvidoEm);
      if (erro) throw regraViolada(erro);
      const jaContestou = await db.select({ id: historicoStatus.id }).from(historicoStatus).where(and(
        eq(historicoStatus.problemaId, problemaId), eq(historicoStatus.moradorId, moradorId), eq(historicoStatus.tipoEvento, 'CONTESTACAO'),
      ));
      if (jaContestou.length) throw conflito('Você já contestou este problema.');
      return db.transaction(async (tx) => {
        const [atualizado] = await tx.update(problema)
          .set({ status: 'EM_ANDAMENTO', resolvidoEm: null, atualizadoEm: new Date() })
          .where(eq(problema.id, problemaId)).returning();
        await tx.insert(historicoStatus).values({
          problemaId, moradorId, tipoEvento: 'CONTESTACAO', statusAnterior: 'RESOLVIDO', statusNovo: 'EM_ANDAMENTO', observacao: motivo,
        });
        return atualizado;
      });
    },

    async ocultar(problemaId: string, usuario: { papel: string }) {
      if (usuario.papel !== 'ADMINISTRADOR') throw proibido();
      await buscar(problemaId);
      await db.update(problema).set({ oculto: true, atualizadoEm: new Date() }).where(eq(problema.id, problemaId));
    },
  };
}

export type ProblemasService = ReturnType<typeof criarProblemasService>;
