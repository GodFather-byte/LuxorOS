# 𓂀 LuxorOS

Sistema operacional baseado em navegador (Browser OS) com IA nativa, inspirado no Egito Antigo.
Tema **Obsidiana & Dourado Solar**.

## Começando

```bash
npm install
npm run dev      # servidor de desenvolvimento (http://localhost:5173)
npm test         # testes unitários (Vitest)
npm run test:e2e # testes E2E (Playwright) no build de produção; antes, uma vez: npx playwright install chromium
npm run lint     # lint (oxlint)
npm run build    # type-check + build de produção
```

## O que já existe (Shell + início da Fase 1)

- **Barra superior** com os *Templos de Trabalho* (espaços por tarefa/projeto que substituem as abas tradicionais).
- **Área de trabalho** com janelas móveis e redimensionáveis por Templo (foco, minimizar e fechar), com geometria salva na sessão.
- **Dock** com micro-apps (Papiro, Tábuas, Escriba e Portal, todos funcionais) e indicadores das janelas abertas/minimizadas.
- **Tábuas** (planilha): grade A–H × 1–20 com fórmulas (`=SOMA(A1:A5)`, `MÉDIA`, `MÍN`, `MÁX`, `+ - * /`, parênteses), decimais com vírgula nos valores, erros `#DIV/0!`, `#CICLO!`, `#REF!`, `#NOME?`, `#VALOR!` e `#ERRO!`. Enter confirma e desce, ↑/↓ navegam, Esc cancela a edição.
- **Escriba** (editor Markdown): títulos, negrito, itálico, `código`, listas, citações, blocos de código e links, com modos Editar, Dividir e Visualizar e contador de palavras. A pré-visualização nunca executa HTML do documento; links só abrem com `http`, `https` ou `mailto`.
- **Portal** (navegação): barra de endereço com voltar/avançar; abre páginas `http`/`https` num `iframe` isolado (`sandbox` sem `allow-same-origin`, sem referrer). Domínios sem esquema ganham `https://`; texto livre vira pesquisa em nova aba; `javascript:`, `data:` e `file:` são recusados. A última página é lembrada.
- **Painéis laterais deslizantes**: Copiloto, Ferramentas e Arquivos.
- **Copiloto** (offline): entende comandos em português e os executa no shell, por exemplo "abra as Tábuas", "crie um templo chamado Viagem", "vá para Karnak", "abrir arquivos", "feche todas as janelas" e "minimize tudo". Digite "ajuda" para ver a lista. Perguntas livres ainda não são respondidas: não há modelo de IA conectado.
- **Paleta de comandos**: abra pelo botão ⌕ na barra superior ou com **Ctrl+K / Cmd+K**. Busque apps, Templos, janelas e painéis; use ↑/↓ e Enter para executar, ou Esc para fechar. A busca aceita termos sem acentos.
- **Sessão persistente**: Templos, Templo ativo e janelas (inclusive minimizadas) são restaurados ao recarregar. Dados inválidos retornam à sessão inicial; armazenamento indisponível não impede o uso do desktop.

### Atalhos de teclado

| Atalho | Ação |
|---|---|
| **Ctrl+K / Cmd+K** | Abrir a paleta de comandos |
| **Ctrl+Shift+← / →** (ou Cmd no macOS) | Templo anterior / seguinte, com volta circular |
| **Ctrl+Shift+↑ / ↓** (ou Cmd no macOS) | Foco na janela anterior / seguinte do Templo ativo; restaura janelas minimizadas |

Os atalhos de setas são ignorados enquanto o foco está num campo de texto, para não interferir na seleção de palavras do Papiro. Combinações com Alt não são tratadas pelo shell.

## Testar no GitHub Pages

1. Em **Settings → Pages → Build and deployment → Source**, selecione **GitHub Actions** (requer permissão de administração).
2. Integre estas alterações à branch `main`. O workflow **Validate and deploy LuxorOS** executa lint, testes e build antes de publicar. Também é possível executá-lo manualmente em **Actions → Run workflow**, selecionando `main`.
3. Após a publicação bem-sucedida, abra **https://godfather-byte.github.io/LuxorOS/**. O endereço definitivo aparece no ambiente `github-pages` da execução.

Pull requests apenas validam o projeto: não publicam previews nem substituem o site. Os assets usam caminhos relativos para funcionar tanto no subdiretório do Pages quanto localmente.

Mantenha apenas o workflow **Validate and deploy LuxorOS** publicando no Pages. O projeto usa React/Vite, não Jekyll: publicar o código-fonte sem o build de `dist` pode deixar a página em branco. Um workflow Jekyll concorrente pode sobrescrever a publicação correta.

### Roteiro de teste

- Abra Papiro no dock, escreva uma nota e minimize a janela.
- Crie outro Templo e abra um aplicativo; confirme que cada Templo mantém suas próprias janelas.
- Use a paleta para trocar de Templo e **Focar Papiro**, restaurando a janela minimizada.
- Recarregue a página: Templos, janelas e nota devem permanecer no mesmo navegador.
- Busque `tabuas` na paleta; confirme a correspondência com **Tábuas** e feche com Esc.
- Em Tábuas, digite `2` em A1, `3,5` em A2 e `=SOMA(A1:A2)` em A3; confirme `5,5`. Recarregue e confirme que a planilha permanece.
- Em Escriba, escreva `# Título` e `**negrito**`; confirme a pré-visualização ao lado e alterne entre Editar, Dividir e Visualizar.
- Em Portal, abra **example.com** pela página inicial; digite `javascript:alert(1)` e confirme que o endereço é recusado.
- No Copiloto, digite `abra as tábuas` e depois `crie um templo chamado Oásis`; confirme a janela e o novo Templo ativo.
- Com dois Templos, use Ctrl+Shift+→ e Ctrl+Shift+← para alternar entre eles; com duas janelas abertas, use Ctrl+Shift+↓ para trocar o foco entre elas.

### Limitações da demonstração

O Pages hospeda o **Shell Web**, não um kernel inicializável nem o futuro host nativo. Muitos sites proíbem ser exibidos dentro de outra página (`X-Frame-Options`/CSP); nesses casos o Portal mostra a página em branco ou um erro do navegador, e o link **Abrir em nova aba** resolve; o Copiloto entende apenas comandos, sem chamadas a serviços de IA.

Sessão e notas ficam no `localStorage` do navegador/origem, sem sincronização, backup ou criptografia própria; evite dados sensíveis em dispositivos compartilhados. A nota do Papiro continua compartilhada entre suas janelas e Templos. Limpar os dados do site apaga esse conteúdo. Para reiniciar apenas a sessão, remova a chave `luxoros:session:v1` em **DevTools → Application → Local Storage** e recarregue.

Arquitetura, stack e roadmap completos em [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).
