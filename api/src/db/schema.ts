import {
  pgTable, pgEnum, uuid, varchar, text, timestamp, boolean, integer, doublePrecision, uniqueIndex, index,
} from 'drizzle-orm/pg-core';

export const papelEnum = pgEnum('papel', ['MORADOR', 'ADMINISTRADOR']);
export const tipoProblemaEnum = pgEnum('tipo_problema', ['BURACO', 'LIXO_ENTULHO', 'CALCADA', 'ALAGAMENTO', 'OUTRO']);
export const statusProblemaEnum = pgEnum('status_problema', ['ABERTO', 'AVISADO_PREFEITURA', 'EM_ANDAMENTO', 'RESOLVIDO']);
export const tipoEventoEnum = pgEnum('tipo_evento', ['REGISTRO', 'AVISO_PREFEITURA', 'EM_ANDAMENTO', 'RESOLVIDO', 'CONTESTACAO']);

export const morador = pgTable('morador', {
  id: uuid('id').primaryKey().defaultRandom(),
  nome: varchar('nome', { length: 80 }).notNull(),
  celular: varchar('celular', { length: 20 }).notNull().unique(),
  senhaHash: text('senha_hash').notNull(),
  papel: papelEnum('papel').notNull().default('MORADOR'),
  aceiteTermosEm: timestamp('aceite_termos_em', { withTimezone: true }).notNull(),
  criadoEm: timestamp('criado_em', { withTimezone: true }).notNull().defaultNow(),
});

export const problema = pgTable('problema', {
  id: uuid('id').primaryKey().defaultRandom(),
  tipo: tipoProblemaEnum('tipo').notNull(),
  descricao: varchar('descricao', { length: 280 }),
  latitude: doublePrecision('latitude').notNull(),
  longitude: doublePrecision('longitude').notNull(),
  referenciaEndereco: varchar('referencia_endereco', { length: 120 }),
  fotoAntesUrl: text('foto_antes_url'),
  fotoDepoisUrl: text('foto_depois_url'),
  status: statusProblemaEnum('status').notNull().default('ABERTO'),
  protocolo156: varchar('protocolo_156', { length: 40 }),
  totalConfirmacoes: integer('total_confirmacoes').notNull().default(0),
  oculto: boolean('oculto').notNull().default(false),
  resolvidoEm: timestamp('resolvido_em', { withTimezone: true }),
  moradorId: uuid('morador_id').notNull().references(() => morador.id),
  criadoEm: timestamp('criado_em', { withTimezone: true }).notNull().defaultNow(),
  atualizadoEm: timestamp('atualizado_em', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('problema_status_idx').on(t.status),
  index('problema_coordenadas_idx').on(t.latitude, t.longitude),
]);

export const confirmacao = pgTable('confirmacao', {
  id: uuid('id').primaryKey().defaultRandom(),
  problemaId: uuid('problema_id').notNull().references(() => problema.id),
  moradorId: uuid('morador_id').notNull().references(() => morador.id),
  criadoEm: timestamp('criado_em', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex('confirmacao_problema_morador_uq').on(t.problemaId, t.moradorId)]);

export const historicoStatus = pgTable('historico_status', {
  id: uuid('id').primaryKey().defaultRandom(),
  problemaId: uuid('problema_id').notNull().references(() => problema.id),
  moradorId: uuid('morador_id').notNull().references(() => morador.id),
  tipoEvento: tipoEventoEnum('tipo_evento').notNull(),
  statusAnterior: statusProblemaEnum('status_anterior'),
  statusNovo: statusProblemaEnum('status_novo').notNull(),
  observacao: varchar('observacao', { length: 200 }),
  criadoEm: timestamp('criado_em', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('historico_problema_idx').on(t.problemaId)]);

export type TipoProblema = (typeof tipoProblemaEnum.enumValues)[number];
export type StatusProblema = (typeof statusProblemaEnum.enumValues)[number];
