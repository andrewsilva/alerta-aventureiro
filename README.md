# Alerta Aventureiro

Plataforma colaborativa para registrar e acompanhar problemas de zeladoria urbana do bairro **Aventureiro, em Joinville/SC**: buracos, lixo e entulho, calçadas quebradas e alagamentos.

Hoje as reclamações dos moradores se perdem no grupo de WhatsApp, se repetem e ninguém sabe se a prefeitura foi avisada. No Alerta Aventureiro, cada problema vira um registro único, os vizinhos confirmam com **"Eu também vi"** em vez de repetir a reclamação, o protocolo do 156 fica visível para todos e a comunidade pode **contestar** quando um conserto não resolveu.

Projeto desenvolvido na disciplina Projeto de Software (CST em Análise e Desenvolvimento de Sistemas), ligado ao **ODS 11, Cidades e Comunidades Sustentáveis** (metas 11.3 e 11.6).

## Funcionalidades do MVP

| Requisito | Funcionalidade |
| --- | --- |
| RF01 | Cadastro e login com celular e senha (hash Argon2id) |
| RF02 | Registro de problema com tipo, local (GPS ou toque no mapa), descrição e foto opcionais |
| RF03 | Sugestão de problemas parecidos a até 50 m e confirmação "Eu também vi" |
| RF04 | Lista e mapa dos problemas do bairro, com filtro por situação |
| RF05 | Andamento: protocolo do 156, em andamento e resolvido com foto do depois |
| RF06 | Contestação em até 7 dias quando o problema volta |
| Ajuste da validação | Em "Outro", o morador escreve o problema. Nomes usados por 3 moradores diferentes viram opções sugeridas. |

## Tecnologias

| Parte | Tecnologias |
| --- | --- |
| Interface | Angular 21 (PWA), Leaflet com OpenStreetMap |
| API | Node.js 22, Express 5, TypeScript, Zod, Argon2, JWT, Helmet |
| Banco | PostgreSQL 16 com Drizzle ORM |
| Testes | Vitest e Supertest (API), Vitest com Angular TestBed (web) |
| CI | GitHub Actions |

## Estrutura

```
alerta-aventureiro/
├── api/                 API REST em camadas
│   ├── src/modules/     auth e problemas (rotas, regras e serviços)
│   ├── src/db/          esquema, conexão, migrações e dados de demonstração
│   ├── drizzle/         migrações SQL versionadas
│   └── tests/           unit/ e integration/
├── web/                 PWA em Angular
│   └── src/app/         core/, shared/ e pages/ (lista, registrar, detalhe, conta)
├── docs/adr/            registros de decisão de arquitetura
└── .github/             CI e modelo de pull request
```

## Como rodar localmente

O CI usa Node.js 22 e PostgreSQL 16. Para rodar localmente com Node.js 22, use a versão 22.12 ou mais recente dessa série.

```bash
# API
cd api
npm ci
cp .env.example .env        # no Windows: copy .env.example .env
# edite o .env com a sua DATABASE_URL e um JWT_SECRET
npm run db:migrate
npm run db:seed             # opcional: dados fictícios para demonstração
npm run dev                 # http://localhost:3000

# Interface (em outro terminal)
cd web
npm ci
npm start                   # http://localhost:4200
```

Para testar no celular na mesma rede Wi-Fi, rode `npx ng serve --host 0.0.0.0` e abra `http://IP-DO-COMPUTADOR:4200`. Sem HTTPS o navegador do celular pode bloquear o GPS; nesse caso, marque o local tocando no mapa.

Conta de demonstração criada pelo seed: celular `(47) 90000-0001`, senha `teste-aventureiro`.

## Publicação

- **API:** conecte a branch `main` no Render com o Blueprint `render.yaml`. Informe `DATABASE_URL` do banco de publicação e o domínio da interface em `CORS_ORIGIN`. O Blueprint gera `JWT_SECRET`, aplica as migrações ao iniciar e usa `/api/saude` para verificar a conexão com o banco.
- **Interface:** importe a `main` no Vercel com `web` como diretório do projeto. Se o Render gerar um domínio diferente do previsto, atualize os destinos de `/api` e `/uploads` em `web/vercel.json`.
- **Monitoramento:** configure um monitor HTTP para a página publicada e outro para `/api/saude`. Os logs da API ficam no painel do Render.

Use um banco de publicação separado da demonstração local, cujo seed cria contas com senhas de exemplo. Veja o [ADR 0005](docs/adr/0005-publicacao-render-vercel.md) para as decisões e limitações.

## Testes

```bash
# API (na pasta api)
npm test
npm run test:coverage

# Interface (na pasta web)
npm test -- --watch=false
npm run build
```

Configure `DATABASE_URL_TEST` em `api/.env` com um banco PostgreSQL separado. Os testes de integração aplicam as migrações e limpam as tabelas desse banco entre os casos. No CI, o GitHub Actions sobe um PostgreSQL só para os testes.

## Segurança e privacidade

- Senhas guardadas apenas como hash Argon2id. Nunca em texto, MD5 ou SHA-1.
- Entradas validadas no servidor com Zod e consultas parametrizadas pelo ORM.
- Respostas públicas mostram só o primeiro nome de quem registrou. Celular e hash nunca saem da API.
- Limite de tentativas de login, cabeçalhos de segurança com Helmet e CORS restrito.
- Segredos apenas em variáveis de ambiente (`.env` fora do repositório).

## Decisões de arquitetura

Veja a pasta [`docs/adr`](docs/adr).

## Licença

MIT
