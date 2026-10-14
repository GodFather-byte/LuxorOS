# 𓂀 LuxorOS

Sistema operacional baseado em navegador (Browser OS) com IA nativa, inspirado no Egito Antigo.
Tema **Obsidiana & Dourado Solar**.

## Começando

```bash
npm install
npm run dev      # servidor de desenvolvimento (http://localhost:5173)
npm test         # testes unitários (Vitest)
npm run lint     # lint (oxlint)
npm run build    # type-check + build de produção
```

## O que já existe (Fase 0 — Shell)

- **Barra superior** com os *Templos de Trabalho* (espaços por tarefa/projeto que substituem as abas tradicionais).
- **Área de trabalho** com janelas (foco, minimizar, fechar), isoladas por Templo.
- **Dock** com micro-apps (Papiro/Notas funcional com persistência local; Escriba, Tábuas e Portal como placeholders) e indicadores das janelas abertas/minimizadas.
- **Painéis laterais deslizantes**: Copiloto (IA — stub offline), Ferramentas e Arquivos.

Arquitetura, stack e roadmap completos em [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).
