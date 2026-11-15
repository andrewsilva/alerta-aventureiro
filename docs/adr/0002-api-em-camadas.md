# ADR 0002: API monolítica em camadas (rotas, serviços e acesso a dados)

**Status:** aceita

## Contexto
MVP desenvolvido por uma pessoa, com poucas entidades e regras concentradas em duplicidade, status e contestação.

## Decisão
API REST única em Node.js com Express. As rotas validam o formato (Zod) e a autenticação, os serviços concentram as regras de negócio (`problemas.regras.ts`) e o acesso ao banco fica na camada de dados (Drizzle ORM).

## Consequências
As regras podem ser testadas isoladamente (testes unitários) e o fluxo completo é testado contra um PostgreSQL real (testes de integração). Não há custo de operar vários serviços.
