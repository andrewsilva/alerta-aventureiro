# ADR 0004: Regras de negócio que não aparecem no código à primeira vista

**Status:** aceita

- Um problema novo do mesmo tipo a até **50 metros** de outro ainda não resolvido é tratado como possível duplicata: a API devolve os parecidos (HTTP 409) e o morador escolhe entre confirmar o existente ou registrar mesmo assim.
- Cada morador confirma um problema **uma única vez**, e o autor não confirma o próprio registro.
- O status só avança na ordem **aberto → avisado à prefeitura → em andamento → resolvido**. Avisado à prefeitura exige o **protocolo do 156**. Resolvido exige a **foto do depois**.
- Um problema resolvido pode ser **contestado em até 7 dias**, por motivo de até 200 caracteres, uma vez por morador. A contestação devolve o problema para **em andamento**.
- Registros não são apagados: o administrador apenas os oculta, e o histórico é somente de inserção.
