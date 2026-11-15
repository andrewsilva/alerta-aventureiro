/**
 * Dados fictícios para demonstração e para os testes de usabilidade.
 * Nenhum dado é de morador real. Uso: npm run db:seed
 */
import argon2 from 'argon2';
import { db, pool } from './client.js';
import { confirmacao, historicoStatus, morador, problema } from './schema.js';

const SENHA_TESTE = 'teste-aventureiro';
const hash = await argon2.hash(SENHA_TESTE, { type: argon2.argon2id });
const dias = (n: number) => new Date(Date.now() - n * 86_400_000);

const [teste] = await db.insert(morador).values({ nome: 'Morador Teste', celular: '47900000001', senhaHash: hash, aceiteTermosEm: new Date() }).onConflictDoNothing().returning();
const [admin] = await db.insert(morador).values({ nome: 'Administrador', celular: '47900000099', senhaHash: hash, papel: 'ADMINISTRADOR', aceiteTermosEm: new Date() }).onConflictDoNothing().returning();
if (!teste || !admin) {
  console.log('Os dados de demonstração já existem. Nada foi alterado.');
  await pool.end();
  process.exit(0);
}

const vizinhos = await db.insert(morador).values(
  Array.from({ length: 12 }, (_, i) => ({ nome: `Vizinho ${i + 1}`, celular: `479000001${String(i + 10)}`, senhaHash: hash, aceiteTermosEm: new Date() })),
).returning();

async function criar(dados: typeof problema.$inferInsert, eventos: (typeof historicoStatus.$inferInsert)[], confirmam: number) {
  const [p] = await db.insert(problema).values({ ...dados, totalConfirmacoes: confirmam }).returning();
  await db.insert(historicoStatus).values(eventos.map((e) => ({ ...e, problemaId: p.id })));
  if (confirmam) await db.insert(confirmacao).values(vizinhos.slice(0, confirmam).map((v) => ({ problemaId: p.id, moradorId: v.id })));
}

await criar(
  { tipo: 'BURACO', descricao: 'Buraco grande na esquina, enche de água quando chove', latitude: -26.2561, longitude: -48.8102, referenciaEndereco: 'Rua Tuiuti, esquina', moradorId: vizinhos[11].id, criadoEm: dias(58) },
  [{ problemaId: '', moradorId: vizinhos[11].id, tipoEvento: 'REGISTRO', statusNovo: 'ABERTO', criadoEm: dias(58) }],
  11,
);
await criar(
  { tipo: 'ALAGAMENTO', descricao: 'Boca de lobo entupida, alaga quando chove', latitude: -26.2549, longitude: -48.8081, referenciaEndereco: 'Perto da praça', status: 'AVISADO_PREFEITURA', protocolo156: '2026-000000', moradorId: vizinhos[0].id, criadoEm: dias(20) },
  [
    { problemaId: '', moradorId: vizinhos[0].id, tipoEvento: 'REGISTRO', statusNovo: 'ABERTO', criadoEm: dias(20) },
    { problemaId: '', moradorId: vizinhos[1].id, tipoEvento: 'AVISO_PREFEITURA', statusAnterior: 'ABERTO', statusNovo: 'AVISADO_PREFEITURA', criadoEm: dias(18) },
  ],
  6,
);
await criar(
  { tipo: 'LIXO_ENTULHO', descricao: 'Entulho de obra na calçada', latitude: -26.2575, longitude: -48.8121, referenciaEndereco: 'Calçada perto do mercado', status: 'RESOLVIDO', resolvidoEm: dias(2), moradorId: vizinhos[2].id, criadoEm: dias(15) },
  [
    { problemaId: '', moradorId: vizinhos[2].id, tipoEvento: 'REGISTRO', statusNovo: 'ABERTO', criadoEm: dias(15) },
    { problemaId: '', moradorId: vizinhos[3].id, tipoEvento: 'EM_ANDAMENTO', statusAnterior: 'ABERTO', statusNovo: 'EM_ANDAMENTO', criadoEm: dias(5) },
    { problemaId: '', moradorId: vizinhos[3].id, tipoEvento: 'RESOLVIDO', statusAnterior: 'EM_ANDAMENTO', statusNovo: 'RESOLVIDO', criadoEm: dias(2) },
  ],
  3,
);

console.log(`Dados de demonstração criados. Conta de teste: celular (47) 90000-0001, senha ${SENHA_TESTE}`);
await pool.end();
