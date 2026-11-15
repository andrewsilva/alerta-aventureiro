import 'dotenv/config';

function obrigatoria(nome: string): string {
  const valor = process.env[nome];
  if (!valor) throw new Error(`Variável de ambiente ${nome} não configurada`);
  return valor;
}

export const config = {
  databaseUrl: obrigatoria('DATABASE_URL'),
  jwtSecret: obrigatoria('JWT_SECRET'),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:4200',
  port: Number(process.env.PORT ?? 3000),
  uploadDir: process.env.UPLOAD_DIR ?? 'uploads',
  bairro: {
    latMin: Number(process.env.BAIRRO_LAT_MIN ?? -26.29),
    latMax: Number(process.env.BAIRRO_LAT_MAX ?? -26.225),
    lngMin: Number(process.env.BAIRRO_LNG_MIN ?? -48.845),
    lngMax: Number(process.env.BAIRRO_LNG_MAX ?? -48.775),
  },
};
