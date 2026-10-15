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
npm run build      # tsc -b + vite build
```

O CI (`.github/workflows/pages.yml`) roda lint, testes e build em todo PR e publica no GitHub Pages ao entrar na `main`.
Rode os três comandos localmente antes de cada push.

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

## 5. Estado atual (main)

Fase 0 concluída. Fase 1 (Shell completo):

- [x] Templos de Trabalho, janelas com foco/minimizar/fechar, Dock, painéis laterais.
- [x] Paleta de comandos (Ctrl/Cmd+K) com busca sem acentos.
- [x] Sessão persistente e validada (Templos, janelas, geometria).
- [x] Arrastar e redimensionar janelas (ponteiro e teclado na alça), clamp na área do desktop e no viewport.
- [x] Atalhos: Ctrl/Cmd+Shift+←/→ (Templo), Ctrl/Cmd+Shift+↑/↓ (foco de janela).
- [ ] Testes E2E com Playwright no repositório e no CI.

Micro-apps: Papiro (notas) funciona. Escriba, Tábuas e Portal ainda são placeholders. Copiloto é um stub offline.

## 6. Próximos passos (em ordem de prioridade)

1. **E2E com Playwright** (fecha a Fase 1). Cobrir: abrir app pelo Dock, arrastar/redimensionar, atalhos, paleta, persistência após recarregar. Rodar no CI.
2. **Tábuas** (planilha): grade editável, referências `A1`, fórmulas com `+ - * /`, `SUM`/`AVERAGE`/`MIN`/`MAX` em intervalos `A1:B3`, detecção de referência circular, persistência local. Motor de fórmulas como módulo puro com testes.
3. **Escriba** (editor): Markdown com pré-visualização. Escape todo HTML; não injete HTML do usuário sem sanitização.
4. **Portal** (navegação): barra de endereço + `iframe` com `sandbox`. Muitos sites bloqueiam iframes (`X-Frame-Options`/CSP): mostre uma mensagem e um botão "abrir em nova aba".
5. **Arquivos**: painel Arquivos listando notas, planilhas e documentos reais dos micro-apps, em vez da lista fixa.
6. **Copiloto local**: entender comandos simples ("abrir tábuas", "novo templo Viagem") e despachar `ShellAction`s, mantendo o contrato `CopilotProvider` para um provedor real futuro.

As fases 2+ (host Electron, AI Gateway, memória, agentes) estão em `docs/ARCHITECTURE.md`.

## 7. Problemas conhecidos

- `oxlint` emite 1 aviso pré-existente (`react(set-state-in-effect)`) em `src/shell/Shell.tsx`, no efeito que salva a sessão. Não é bloqueante.
- Em largura de celular (~400px), `.desktop` fica mais largo que a tela: a coluna `auto` do grid em `.shell` cresce até a largura mínima do Dock. Correção provável: `grid-template-columns: minmax(0, 1fr)` em `.shell` e permitir rolagem/quebra no Dock.
- O PR #5 (`copilot/continuar-criacao-luxoros`) reimplementa janelas móveis sobre uma base antiga; a feature já está na `main`.
