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

## O que já existe (Shell + início da Fase 1)

- **Barra superior** com os *Templos de Trabalho* (espaços por tarefa/projeto que substituem as abas tradicionais).
- **Área de trabalho** com janelas móveis e redimensionáveis por Templo (foco, minimizar e fechar), com geometria salva na sessão.
- **Dock** com micro-apps (Papiro/Notas funcional com persistência local; Escriba, Tábuas e Portal como placeholders) e indicadores das janelas abertas/minimizadas.
- **Painéis laterais deslizantes**: Copiloto (IA — stub offline), Ferramentas e Arquivos.
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
- Com dois Templos, use Ctrl+Shift+→ e Ctrl+Shift+← para alternar entre eles; com duas janelas abertas, use Ctrl+Shift+↓ para trocar o foco entre elas.

### Limitações da demonstração

O Pages hospeda o **Shell Web**, não um kernel inicializável nem o futuro host nativo. Escriba, Tábuas e Portal ainda são placeholders; o Copiloto é uma simulação offline, sem chamadas a serviços de IA.

Sessão e notas ficam no `localStorage` do navegador/origem, sem sincronização, backup ou criptografia própria; evite dados sensíveis em dispositivos compartilhados. A nota do Papiro continua compartilhada entre suas janelas e Templos. Limpar os dados do site apaga esse conteúdo. Para reiniciar apenas a sessão, remova a chave `luxoros:session:v1` em **DevTools → Application → Local Storage** e recarregue.

Arquitetura, stack e roadmap completos em [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).
