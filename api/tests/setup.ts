import 'dotenv/config';

// Os testes apagam os dados das tabelas a cada caso, por isso usam um banco separado.
// Em CI ele vem do serviço PostgreSQL do GitHub Actions; localmente, defina DATABASE_URL_TEST no .env.
if (!process.env.DATABASE_URL_TEST) {
  throw new Error('Defina DATABASE_URL_TEST com um banco só para testes (nunca o banco principal).');
}
process.env.DATABASE_URL = process.env.DATABASE_URL_TEST;
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'segredo-somente-para-testes';
process.env.UPLOAD_DIR = 'tmp-uploads-teste';
