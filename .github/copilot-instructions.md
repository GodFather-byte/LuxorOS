# Instruções do repositório para o GitHub Copilot

Leia [`AGENTS.md`](../AGENTS.md) na raiz antes de começar qualquer tarefa. Ele traz o estado atual do LuxorOS, as convenções, os problemas conhecidos e a lista priorizada de próximos passos.

Resumo do essencial:

- Antes de implementar, confira os PRs abertos e os branches `copilot/*` e `ccr-*`: outros agentes trabalham em paralelo e já houve PRs duplicados.
- Regras de estado ficam em `src/kernel/` como funções puras com testes Vitest; a UI em `src/shell/` só despacha ações.
- Todo campo novo no estado precisa de validação em `src/kernel/session.ts` e de compatibilidade com sessões salvas antes dele.
- Rode `npm run lint`, `npm test` e `npm run build` antes de cada push.
- Ao terminar, atualize as seções "Estado atual" e "Próximos passos" do `AGENTS.md`.
