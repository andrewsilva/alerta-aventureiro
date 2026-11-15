import { config } from './config.js';
import { db } from './db/client.js';
import { criarApp } from './app.js';

const app = criarApp({ db, jwtSecret: config.jwtSecret, corsOrigin: config.corsOrigin, uploadDir: config.uploadDir, limitesBairro: config.bairro });

app.listen(config.port, '0.0.0.0', () => {
  console.log(`API do Alerta Aventureiro rodando em http://localhost:${config.port}`);
});
