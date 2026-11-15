# ADR 0005: Publicação no Render e no Vercel, com monitoramento pelo UptimeRobot

**Status:** aceita

## Contexto

O MVP precisa ficar acessível pela internet para os moradores, sem custo e com um mecanismo que avise quando sair do ar. O banco já está no Neon (PostgreSQL gerenciado).

## Decisão

- **API no Render** (plano gratuito, Web Service Node), configurada pelo `render.yaml` na raiz. O build compila o TypeScript; ao iniciar, aplica as migrações (`npm run db:migrate:prod`) e sobe o servidor. O Render faz deploy automático a cada push na `main` e usa `/api/saude` como health check.
- **Interface no Vercel** (plano Hobby), configurada pelo `web/vercel.json`. O Vercel gera o build do Angular, repassa `/api` e `/uploads` para o Render e encaminha as rotas da interface para o `index.html` do PWA.
- **Monitoramento:**
  - Serão configurados no UptimeRobot dois monitores, um para `/api/saude` e outro para a página inicial, com alertas por e-mail.
  - `/api/saude` testa a conexão com o banco e responde 503 se ele estiver fora.
  - Cada requisição gera uma linha JSON nos logs do Render com método, padrão da rota, status e tempo. O padrão fica nulo quando nenhuma rota é identificada.
- `TRUST_PROXY=1` no Render confia apenas no proxy imediato. A API também aceita acesso direto pelo domínio do Render, com uma cadeia mais curta que o acesso via Vercel.

## Consequências

- O plano gratuito do Render pode hibernar o serviço após um período sem tráfego.
- O disco do Render gratuito é temporário: fotos enviadas podem se perder numa reinicialização ou num novo deploy. Mover as fotos para um armazenamento de objetos é o próximo passo técnico.
