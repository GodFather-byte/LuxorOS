# Instruções para agentes (Copilot, Claude e outros)

Este arquivo é o ponto de partida para qualquer agente que for continuar o LuxorOS.
Leia-o inteiro antes de abrir um branch. Ao terminar uma entrega, **atualize a seção "Estado atual" e "Próximos passos"** no mesmo PR.

## 1. Antes de começar: evite trabalho duplicado

Vários agentes trabalham neste repositório em paralelo. A mesma feature (janelas móveis) já foi implementada três vezes em PRs concorrentes (#4, #5, #6).

1. Atualize a `main` (`git fetch origin main`) e leia o histórico recente.
2. Liste os PRs abertos e os branches `copilot/*` e `ccr-*`. Se alguém já está no item que você escolheu, escolha outro.
3. Comece o branch a partir da `main` mais recente. Se a `main` mudar enquanto você trabalha, faça merge dela no seu branch antes de abrir o PR.

## 2. Comandos

```bash
npm ci
npm run dev        # http://localhost:5173
npm test           # unidade (Vitest), arquivos src/**/*.test.ts
npm run lint       # oxlint
npm run build      # tsc -b + vite build (também verifica os tipos de e2e/)
npm run test:e2e   # Playwright em e2e/*.e2e.ts, contra o build de produção (vite preview, porta 4173)
```

Para o E2E, instale o Chromium uma vez com `npx playwright install chromium`. Em ambientes com um Chromium já instalado e sem download
de browsers (por exemplo, sessões em nuvem com `/opt/pw-browsers`), aponte para ele:
`PLAYWRIGHT_CHROMIUM_EXECUTABLE=/opt/pw-browsers/chromium npm run test:e2e`.

O CI (`.github/workflows/pages.yml`) roda lint, testes, build e E2E em todo PR e publica no GitHub Pages ao entrar na `main`.
Rode tudo localmente antes de cada push.

Ao escrever testes E2E: use seletores por papel/rótulo (`getByRole`, `aria-label`), meça janelas com `offsetLeft`/`offsetWidth`
(não `boundingBox`, que inclui a animação de abertura), e confira que o teste falha se você quebrar de propósito o comportamento que ele cobre.
Não use `retries` para esconder instabilidade.
Exemplo real: um teste de XSS do Escriba passava mesmo com `javascript:` liberado, porque `_` no payload virava itálico e escondia o link. Só a mutação revelou isso.
Para páginas externas, use `page.route` com `contentType: 'text/html; charset=utf-8'` (sem o charset, acentos viram mojibake e o seletor por nome falha).

## 3. Arquitetura em resumo

Detalhes completos em [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

- `src/kernel/`: estado do sistema, **sem React e sem DOM**. Toda regra nova entra aqui como função pura com teste.
  - `shellReducer.ts`: Templos, janelas, painéis. Toda mudança de estado é uma `ShellAction` (`types.ts`).
  - `session.ts`: persistência em `localStorage` (`luxoros:session:v1`) com validação estrita. **Qualquer campo novo no estado precisa de validação aqui, de teste, e de compatibilidade com sessões salvas antes dele** (sessões antigas sem o campo devem continuar carregando).
  - `commands.ts`: catálogo da paleta (Ctrl/Cmd+K). `shortcuts.ts`: atalhos Ctrl/Cmd+Shift+setas. `geometry.ts`: arraste e redimensionamento.
- `src/shell/`: componentes React finos que despacham ações. `src/apps/`: micro-apps (manifesto em `registry.ts`). `src/ai/`: contrato do Copiloto (hoje um stub offline).
- `src/styles/theme.css`: tokens de design (Obsidiana & Dourado Solar). Use as variáveis, não cores soltas.

## 4. Convenções

- Texto de interface em **português (pt-BR)**; código, comentários e mensagens de commit em **inglês** (commit no imperativo: "Add…", "Fix…").
- Mudanças pequenas e focadas, um assunto por PR. Atualize `README.md` (seção "O que já existe" e "Roteiro de teste") quando o comportamento visível mudar.
- Não use `getBoundingClientRect` para geometria de janela: a animação `window-in` aplica `transform`. Use `offsetLeft`/`offsetWidth`.
- A alça de redimensionar é um `<button>`: ao filtrar cliques, exclua só `.window-controls`, nunca `button` em geral.
- Atalhos globais: Ctrl+T/W/N/Tab são reservados pelo navegador e não chegam à página. Ignore atalhos de setas quando o foco estiver em `input`, `textarea` ou `contenteditable`.
- Dados do usuário ficam no `localStorage` do navegador, sem criptografia. Não grave nada sensível.

## 5. Estado atual

Fases 0 e 1 concluídas. Fase 1 (Shell completo):

- [x] Templos de Trabalho, janelas com foco/minimizar/fechar, Dock, painéis laterais.
- [x] Paleta de comandos (Ctrl/Cmd+K) com busca sem acentos.
- [x] Sessão persistente e validada (Templos, janelas, geometria).
- [x] Arrastar e redimensionar janelas (ponteiro e teclado na alça), clamp na área do desktop e no viewport.
- [x] Atalhos: Ctrl/Cmd+Shift+←/→ (Templo), Ctrl/Cmd+Shift+↑/↓ (foco de janela).
- [x] Testes E2E com Playwright no repositório e no CI (`e2e/shell.e2e.ts`).

Micro-apps:

- [x] Papiro (notas), `src/apps/NotesApp.tsx`.
- [x] Tábuas (planilha), `src/apps/sheets/`: motor de fórmulas puro em `engine.ts` (testes em `engine.test.ts`), UI em `SheetsApp.tsx`, E2E em `e2e/sheets.e2e.ts`. Dados em `luxoros:sheets:v1`.
- [x] Escriba (Markdown), `src/apps/writer/`: `markdown.ts` gera uma árvore de blocos/inlines que o React renderiza; nenhum HTML do documento chega ao DOM. `safeHref` aceita só `http(s):`/`mailto:`. Dados em `luxoros:writer:v1`. E2E em `e2e/writer.e2e.ts`, incluindo um teste de segurança.
- [x] Portal (navegação), `src/apps/browser/`: `address.ts` decide entre página, pesquisa (nova aba) ou recusa (só `http`/`https`); `PortalApp.tsx` usa `iframe` com `sandbox` **sem** `allow-same-origin` e `referrerPolicy="no-referrer"`. Última página em `luxoros:portal:v1`. E2E em `e2e/portal.e2e.ts` (intercepta `https://portal.test` com `page.route`, sem rede).
- [ ] Copiloto: stub offline (`src/ai/copilot.ts`).

## 6. Próximos passos (em ordem de prioridade)

1. **Arquivos**: painel Arquivos listando notas, planilhas e documentos reais dos micro-apps, em vez da lista fixa.
2. **Copiloto local**: entender comandos simples ("abrir tábuas", "novo templo Viagem") e despachar `ShellAction`s, mantendo o contrato `CopilotProvider` para um provedor real futuro.
3. **Layout em telas estreitas**: corrigir o problema de largura do `.desktop` descrito em "Problemas conhecidos" e cobrir com um E2E em viewport de celular.
4. **Janelas do mesmo app em sincronia**: hoje duas janelas de Papiro/Tábuas/Escriba não se atualizam entre si. Opção: evento `storage` + `BroadcastChannel`, ou um documento por janela.
5. **Portal**: detectar páginas que recusam iframe é impossível de forma confiável entre origens; manter o link "Abrir em nova aba". Possível evolução no host Electron (Fase 2) com `WebContentsView`.

As fases 2+ (host Electron, AI Gateway, memória, agentes) estão em `docs/ARCHITECTURE.md`.

## 7. Problemas conhecidos

- `oxlint` emite 1 aviso pré-existente (`react(set-state-in-effect)`) em `src/shell/Shell.tsx`, no efeito que salva a sessão. Não é bloqueante.
- Em largura de celular (~400px), `.desktop` fica mais largo que a tela: a coluna `auto` do grid em `.shell` cresce até a largura mínima do Dock. Correção provável: `grid-template-columns: minmax(0, 1fr)` em `.shell` e permitir rolagem/quebra no Dock.
- O PR #5 (`copilot/continuar-criacao-luxoros`) reimplementa janelas móveis sobre uma base antiga; a feature já está na `main`.
- Papiro, Tábuas e Escriba guardam um único documento cada no `localStorage`, compartilhado entre todas as janelas e Templos. Duas janelas do mesmo app não se sincronizam ao vivo: a edição de uma só aparece na outra ao reabrir.
- Tábuas: nas fórmulas o separador decimal é o ponto e o de argumentos é `,` ou `;`. Nos valores digitados direto na célula, `3,5` vale 3,5. A grade é fixa em 8×20.
