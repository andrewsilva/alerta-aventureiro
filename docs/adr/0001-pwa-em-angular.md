# ADR 0001: Aplicação web responsiva (PWA) em Angular

**Status:** aceita

## Contexto
Os moradores do Aventureiro usam celulares simples, com pouca memória e internet móvel instável, e já se organizam pelo grupo de WhatsApp do bairro.

## Decisão
O front-end é uma aplicação de página única em Angular, publicada como PWA. O morador abre por um link, sem loja de aplicativos. O service worker guarda os arquivos em cache para abrir rápido com sinal fraco.

## Alternativas consideradas
- Aplicativo nativo (Android/iOS): exige instalação e duas bases de código.
- Site sem PWA: perde o cache e o atalho na tela inicial.

## Consequências
Uma base de código só, distribuída por link. Notificações push ficam para uma versão futura.
