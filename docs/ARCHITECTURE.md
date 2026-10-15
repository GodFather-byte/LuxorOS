# LuxorOS — Arquitetura, Stack e Roadmap

## 1. Visão geral

O LuxorOS é dividido em duas camadas que evoluem em paralelo:

1. **Shell Web (este repositório, hoje)** — a interface de desktop (Templos, janelas, dock, painéis) escrita em
   React/TypeScript. Roda em qualquer navegador e é o "userland" do sistema.
2. **Host nativo (fases seguintes)** — um navegador próprio baseado em Chromium que carrega o Shell como sua
   "aba principal" e expõe ao Shell APIs privilegiadas (processos isolados, leitura de contexto das abas,
   automação para agentes).

```
┌──────────────────────────── Host (Electron → Chromium/CEF) ────────────────────────────┐
│ Main process: Gerenciador de processos · Sandbox · Monitor de RAM · Agent Runtime (CDP) │
│        ▲ IPC tipado (contextBridge)                                                     │
│ ┌──────┴──────────────────── Shell (React, aba principal) ────────────────────────────┐ │
│ │ TopBar/Templos │ Desktop/Janelas │ Dock │ Painéis: Copiloto · Ferramentas · Arquivos │ │
│ │ kernel/ (estado)   ai/ (cliente do Copiloto)   apps/ (micro-apps)                    │ │
│ └─────────────────────────────────────────────────────────────────────────────────────┘ │
│ WebContentsView por aba/app (renderer isolado, orçamento de memória)                    │
└─────────────────────────────────────────────────────────────────────────────────────────┘
                │ HTTPS / WebSocket
┌───────────────┴──────────────────────── Nuvem Luxor ───────────────────────────────────┐
│ API Gateway (Fastify/tRPC) · Auth (OIDC) · Sync (CRDT/Yjs) · AI Gateway (LLMs)          │
│ Memória Universal (Postgres + pgvector) · Storage de arquivos (S3 compatível)           │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

## 2. Stack tecnológica proposta

| Pilar | Tecnologia | Justificativa |
|---|---|---|
| Shell / UI | React 19 + TypeScript + Vite | Ecossistema maduro, HMR rápido, tipagem forte. |
| Estilo | CSS com *design tokens* (custom properties) | Tema Obsidiana/Dourado centralizado, sem custo em runtime. |
| Estado | `useReducer` puro no kernel (hoje) → Zustand quando houver múltiplos stores | Lógica testável sem UI. |
| Testes | Vitest (unidade, `src/**/*.test.ts`) · Playwright (E2E, `e2e/*.e2e.ts`, roda no CI) | Integração nativa com Vite. |
| Motor / Host | **Electron** (MVP) → **Chromium/CEF próprio** (longo prazo) | Electron entrega `WebContentsView`, processos isolados e CDP de imediato; fork de Chromium só quando o produto estiver validado. |
| Isolamento / RAM | Um renderer por aba/app, `sandbox: true`, `contextIsolation`, descarte de abas inativas e `process.getProcessMemoryInfo` para orçamento por Templo | Evita travamentos e vazamentos entre apps. |
| Micro-apps | Componentes carregados sob demanda, PWA + Service Worker (offline), OPFS/IndexedDB local | "Instantâneos, sem instalação". |
| Sync em nuvem | Yjs (CRDT) + WebSocket | Edição colaborativa e offline-first para Escriba, Tábuas e Papiro. |
| Cérebro de IA | AI Gateway agnóstico de provedor (APIs de LLM em nuvem ou modelos locais via Ollama/WebLLM) | Evita *lock-in*; permite modo privado local. |
| Contexto das abas | Extração por content script → Readability → *chunks* com embeddings | O Copiloto "lê" todas as abas do Templo. |
| Agentes Auto-Browse | Playwright/CDP no host + loop planejador → executor → verificador (tool calling), com confirmação humana para ações sensíveis | Tarefas ponta a ponta com segurança. |
| Memória Universal | Postgres + pgvector (nuvem) e índice local (SQLite + sqlite-vec) | Busca semântica em linguagem natural no histórico. |
| Agrupamento automático | Clusterização de embeddings das abas + rótulo gerado por LLM | Cria Templos automaticamente (ex.: Viagem: voos, mapas, hotéis). |
| Backend | Node.js + Fastify + tRPC, Postgres, Redis (filas de agentes) | TypeScript ponta a ponta. |
| Monorepo (futuro) | pnpm workspaces + Turborepo | Quando surgirem `host`, `server` e `packages/*`. |

### Segurança e privacidade (requisitos não funcionais)
- O conteúdo das abas só é enviado à IA com consentimento por Templo; modo local disponível.
- Agentes nunca concluem pagamentos nem enviam credenciais sem confirmação explícita; *allowlist* de domínios por tarefa.
- IPC do host exposto apenas via `contextBridge` com esquema validado (ex.: zod).

## 3. Estrutura de arquivos

### Atual (Fase 0 + início da Fase 1)
```
src/
├── main.tsx                 # bootstrap
├── kernel/                  # núcleo de estado do sistema (sem UI, 100% testável)
│   ├── types.ts             # Temple, AppWindow, PanelId, ShellAction
│   ├── shellReducer.ts      # Templos, janelas, painéis
│   ├── shellReducer.test.ts
│   ├── geometry.ts          # arraste e redimensionamento das janelas, limitados à área do desktop
│   ├── geometry.test.ts
│   ├── shortcuts.ts         # atalhos Ctrl/Cmd+Shift+setas: traduz a tecla em ação do reducer
│   ├── shortcuts.test.ts
│   ├── session.ts            # snapshot versionado, validação e persistência local
│   ├── session.test.ts
│   ├── commands.ts           # catálogo e busca de ações do shell
│   └── commands.test.ts
├── ai/
│   ├── copilot.ts           # contrato CopilotProvider (texto + ShellActions) e provedor local
│   └── intents.ts           # comandos em português → ShellActions (puro e testado)
├── apps/                    # micro-apps nativos
│   ├── registry.ts          # manifesto dos apps (Papiro, Escriba, Tábuas, Portal)
│   ├── storageKeys.ts       # chave de localStorage de cada micro-app (fonte única)
│   ├── documents.ts         # resumo dos documentos salvos para o painel Arquivos (puro e testado)
│   ├── NotesApp.tsx
│   ├── PlaceholderApp.tsx
│   ├── browser/             # Portal: address.ts (resolve endereço/pesquisa, puro) + PortalApp.tsx (iframe com sandbox)
│   ├── sheets/              # Tábuas: engine.ts (fórmulas, puro e testado) + SheetsApp.tsx
│   └── writer/              # Escriba: markdown.ts (parser → árvore, sem HTML cru) + WriterApp.tsx
├── shell/                   # ambiente de desktop
│   ├── Shell.tsx
│   ├── components/          # TopBar, Dock, Window, SidePanel, CommandPalette
│   └── panels/              # AiPanel, ToolsPanel, FilesPanel
└── styles/
    ├── theme.css            # design tokens Obsidiana & Dourado Solar
    └── shell.css
```

### Alvo (monorepo)
```
apps/
  shell/        # este código (React)
  host/         # Electron: main process, process manager, agent runtime, preload
  server/       # Fastify + tRPC: auth, sync, AI gateway, memória
packages/
  kernel/       # tipos e reducers compartilhados
  ai-sdk/       # cliente do Copiloto, ferramentas dos agentes
  ui/           # design system (tokens, componentes)
  micro-apps/   # papiro, escriba, tabuas, portal
docs/
```

## 4. Design de interface

- **Paleta**: Obsidiana (`#0b0a0f` → `#2e2a3a`), Dourado Solar (`#e8b44a` / `#f5d27a`), Areia (`#f4ead7`) para
  texto e Lápis-lazúli (`#2f5fa8`) como acento secundário.
- **Tipografia**: display serifada inspirada em inscrições (Cinzel, com fallback Georgia) para marca e títulos;
  Inter / fonte do sistema para a UI.
- **Layout**: barra superior (marca · Templos · painéis · relógio), área de trabalho com janelas em vidro fosco,
  dock flutuante inferior e painéis laterais deslizantes à direita (um por vez).
- **Movimento**: curva `cubic-bezier(0.22, 1, 0.36, 1)`, respeitando `prefers-reduced-motion`.
- **Acessibilidade**: foco visível dourado, rótulos ARIA, painéis fechados marcados como `inert`.

## 5. Roadmap

| Fase | Entregas |
|---|---|
| **0 — Shell (concluída)** | Vite/React/TS, tema, Templos, janelas, dock, painéis, Papiro com persistência local, testes do kernel. |
| **1 — Shell completo (concluída)** | Arrastar/redimensionar janelas, atalhos de teclado, paleta de comandos (⌘K), persistência dos Templos, testes E2E com Playwright. |
| 2 — Host Electron | App `host` com `WebContentsView` por aba, app Portal real, monitor de RAM por Templo, descarte de abas inativas. |
| 3 — Cérebro de IA | AI Gateway, Copiloto com contexto das abas do Templo, respostas em streaming. |
| 4 — Memória & Templos inteligentes | Histórico com embeddings, busca semântica, agrupamento automático de abas em Templos. |
| 5 — Auto-Browse | Runtime de agentes (CDP), ferramentas (navegar, clicar, preencher, extrair), aprovação humana, logs auditáveis. |
| 6 — Nuvem & micro-apps | Auth, sync com Yjs, Escriba (editor), Tábuas (planilhas), armazenamento de arquivos. |
| 7 — Motor próprio | Avaliar fork de Chromium/CEF, otimizações de memória, distribuição (instaladores, auto-update). |
