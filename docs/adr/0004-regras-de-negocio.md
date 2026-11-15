# ADR 0004: Regras de negócio que não aparecem no código à primeira vista

**Status:** aceita

- Um problema novo do mesmo tipo a até **50 metros** de outro ainda não resolvido é tratado como possível duplicata: a API devolve os parecidos (HTTP 409) e o morador escolhe entre confirmar o existente ou registrar mesmo assim.
- Cada morador confirma um problema **uma única vez**, e o autor não confirma o próprio registro.
- O status só avança na ordem **aberto → avisado à prefeitura → em andamento → resolvido**. Avisado à prefeitura exige o **protocolo do 156**. Resolvido exige a **foto do depois**.
- Um problema resolvido pode ser **contestado em até 7 dias**, por motivo de até 200 caracteres, uma vez por morador. A contestação devolve o problema para **em andamento**.
- Registros não são apagados: o administrador apenas os oculta, e o histórico é somente de inserção.

## Atualização após a 1ª validação com a comunidade (15/11/2026)

A representante pediu mais opções de tipos de problema, **desde que a própria comunidade valide quais se repetem**. Em vez de acrescentar tipos fixos no código:

- Ao escolher **Outro**, o morador escreve qual é o problema (3 a 40 caracteres). O nome é padronizado (espaços e maiúsculas) para que "mato alto" e "Mato  Alto" contem juntos.
- Quando **3 moradores diferentes** usam o mesmo nome, ele aparece como opção sugerida na tela de registro (`GET /api/problemas/tipos-sugeridos`, no máximo 4 sugestões).
- Em **Outro**, a busca de parecidos só considera registros com o mesmo nome, para não tratar "mato alto" como duplicata de "árvore caída".
- Se um nome sugerido continuar frequente, ele pode virar um tipo fixo numa próxima versão, com base nos dados e não em suposição.
