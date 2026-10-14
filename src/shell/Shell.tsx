import { useReducer, type ReactNode } from 'react'
import { NotesApp } from '../apps/NotesApp'
import { PlaceholderApp } from '../apps/PlaceholderApp'
import { getApp } from '../apps/registry'
import { initialShellState, selectActiveTemple, shellReducer } from '../kernel/shellReducer'
import type { AppId, PanelId } from '../kernel/types'
import { Dock } from './components/Dock'
import { SidePanel } from './components/SidePanel'
import { TopBar } from './components/TopBar'
import { Window } from './components/Window'
import { AiPanel } from './panels/AiPanel'
import { FilesPanel } from './panels/FilesPanel'
import { ToolsPanel } from './panels/ToolsPanel'

const panelTitles: Record<PanelId, string> = {
  ai: 'Copiloto',
  tools: 'Ferramentas',
  files: 'Arquivos',
}

function renderApp(appId: AppId): ReactNode {
  if (appId === 'notes') return <NotesApp />
  return <PlaceholderApp app={getApp(appId)} />
}

export function Shell() {
  const [state, dispatch] = useReducer(shellReducer, initialShellState)
  const temple = selectActiveTemple(state)
  const closePanel = () => state.openPanel && dispatch({ type: 'panel/toggle', panel: state.openPanel })

  return (
    <div className="shell">
      <TopBar
        temples={state.temples}
        activeTempleId={state.activeTempleId}
        openPanel={state.openPanel}
        onActivateTemple={(templeId) => dispatch({ type: 'temple/activate', templeId })}
        onCreateTemple={() => dispatch({ type: 'temple/create', name: `Templo ${state.temples.length + 1}` })}
        onTogglePanel={(panel) => dispatch({ type: 'panel/toggle', panel })}
      />
      <main className="desktop" aria-label={`Templo ${temple.name}`}>
        {temple.windows.length === 0 && (
          <div className="desktop-empty">
            <span className="desktop-glyph">{temple.glyph}</span>
            <p>Templo {temple.name}</p>
            <small>Abra um aplicativo pelo dock ou consulte o Copiloto.</small>
          </div>
        )}
        {temple.windows.map((w, i) => (
          <Window
            key={w.id}
            win={w}
            index={i}
            onFocus={() => dispatch({ type: 'window/focus', windowId: w.id })}
            onMinimize={() => dispatch({ type: 'window/toggleMinimize', windowId: w.id })}
            onClose={() => dispatch({ type: 'window/close', windowId: w.id })}
          >
            {renderApp(w.appId)}
          </Window>
        ))}
        {(Object.keys(panelTitles) as PanelId[]).map((id) => (
          <SidePanel key={id} open={state.openPanel === id} title={panelTitles[id]} onClose={closePanel}>
            {id === 'ai' && <AiPanel temple={temple} />}
            {id === 'tools' && <ToolsPanel />}
            {id === 'files' && <FilesPanel />}
          </SidePanel>
        ))}
      </main>
      <Dock
        windows={temple.windows}
        onLaunch={(appId) => dispatch({ type: 'window/open', appId, title: getApp(appId).name })}
        onRestore={(windowId) => dispatch({ type: 'window/focus', windowId })}
      />
    </div>
  )
}
