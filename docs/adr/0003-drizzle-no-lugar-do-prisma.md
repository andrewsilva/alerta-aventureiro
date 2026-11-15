# ADR 0003: Drizzle ORM no lugar do Prisma

**Status:** aceita (substitui a escolha do Prisma registrada no planejamento da Experiência Prática 2)

## Contexto
O planejamento previa o Prisma ORM. Na implementação, o Prisma depende de um motor binário baixado na instalação e na geração do cliente, o que trouxe atrito no ambiente de desenvolvimento e no pipeline de CI, além de aumentar o tempo de partida do servidor em planos gratuitos que hibernam.

## Decisão
Usar o Drizzle ORM com o driver `pg`. Ele é escrito em TypeScript, não depende de binário, gera consultas parametrizadas e versiona as migrações em SQL na pasta `api/drizzle`.

## Consequências
- Mantém o que motivou o ORM no planejamento: acesso a dados centralizado, tipos verificados e proteção contra injeção de SQL.
- As migrações ficam legíveis em SQL e são aplicadas com `npm run db:migrate`.
- O banco continua sendo PostgreSQL, sem impacto no modelo de dados.
