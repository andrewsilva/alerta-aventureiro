/**
 * Dados fictícios para demonstração e para os testes de usabilidade.
 * Nenhum dado é de morador real. Uso: npm run db:seed
 */
import argon2 from 'argon2';
import { and, eq, inArray } from 'drizzle-orm';
import { db, pool } from './client.js';
import { confirmacao, historicoStatus, morador, problema } from './schema.js';

const SENHA_TESTE = 'teste-aventureiro';
const hash = await argon2.hash(SENHA_TESTE, { type: argon2.argon2id });
const dias = (n: number) => new Date(Date.now() - n * 86_400_000);

const [teste] = await db.insert(morador).values({ nome: 'Morador Teste', celular: '47900000001', senhaHash: hash, aceiteTermosEm: new Date() }).onConflictDoNothing().returning();
const [admin] = await db.insert(morador).values({ nome: 'Administrador', celular: '47900000099', senhaHash: hash, papel: 'ADMINISTRADOR', aceiteTermosEm: new Date() }).onConflictDoNothing().returning();
const primeiraVez = Boolean(teste && admin);

const contasVizinhos = Array.from({ length: 12 }, (_, i) => ({
  nome: `Vizinho ${i + 1}`, celular: `479000001${i + 10}`, senhaHash: hash, aceiteTermosEm: new Date(),
}));
const celularesVizinhos = contasVizinhos.map((v) => v.celular);

await db.insert(morador).values(contasVizinhos).onConflictDoNothing();
const vizinhos = await db.select().from(morador).where(inArray(morador.celular, celularesVizinhos)).orderBy(morador.celular);

async function criar(dados: typeof problema.$inferInsert, eventos: (typeof historicoStatus.$inferInsert)[], confirmam: number, conexao: Pick<typeof db, 'insert'> = db) {
  const [p] = await conexao.insert(problema).values({ ...dados, totalConfirmacoes: confirmam }).returning();
  await conexao.insert(historicoStatus).values(eventos.map((e) => ({ ...e, problemaId: p.id })));
  if (confirmam) await conexao.insert(confirmacao).values(vizinhos.slice(0, confirmam).map((v) => ({ problemaId: p.id, moradorId: v.id })));
}

if (primeiraVez) {
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
}

// Tipo sugerido pela comunidade (ajuste da 1ª validação): 3 vizinhos registraram "Mato alto" em "Outro".
const registrosNovos = await db.transaction(async (tx) => {
  const contas = contasVizinhos.slice(4, 7);
  const autores = await tx.select({ id: morador.id, nome: morador.nome, celular: morador.celular })
    .from(morador).where(inArray(morador.celular, contas.map((v) => v.celular))).orderBy(morador.celular).for('update');
  const pontos = [[-26.2532, -48.8062], [-26.2588, -48.8139], [-26.2605, -48.8030]];
  let incluidos = 0;
  for (const [i, [latitude, longitude]] of pontos.entries()) {
    const autor = autores.find((v) => v.celular === contas[i].celular && v.nome === contas[i].nome);
    if (!autor) continue;
    const [existente] = await tx.select({ id: problema.id }).from(problema).where(and(
      eq(problema.tipo, 'OUTRO'), eq(problema.nomeOutro, 'Mato alto'), eq(problema.moradorId, autor.id),
    )).limit(1);
    if (existente) continue;
    const criadoEm = dias(10 - i * 3);
    await criar(
      { tipo: 'OUTRO', nomeOutro: 'Mato alto', descricao: 'Mato alto no terreno baldio', latitude, longitude, moradorId: autor.id, criadoEm },
      [{ problemaId: '', moradorId: autor.id, tipoEvento: 'REGISTRO', statusNovo: 'ABERTO', criadoEm }],
      0, tx,
    );
    incluidos += 1;
  }
  return incluidos;
});

if (primeiraVez) console.log('Dados de demonstração iniciais criados.');
console.log(`Registros fictícios de Mato alto adicionados: ${registrosNovos}.`);
console.log(`Conta de teste: celular (47) 90000-0001, senha ${SENHA_TESTE}`);
await pool.end();
