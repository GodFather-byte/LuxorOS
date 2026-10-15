import { useEffect, useReducer, useState, type ReactNode } from 'react'
import { NotesApp } from '../apps/NotesApp'
import { PlaceholderApp } from '../apps/PlaceholderApp'
import { getApp } from '../apps/registry'
import { SheetsApp } from '../apps/sheets/SheetsApp'
import { WriterApp } from '../apps/writer/WriterApp'
import { initialShellState, selectActiveTemple, shellReducer } from '../kernel/shellReducer'
import { loadSession, saveSession } from '../kernel/session'
import { resolveShortcut } from '../kernel/shortcuts'
import type { AppId, PanelId, WindowGeometry } from '../kernel/types'
import { Dock } from './components/Dock'
import { CommandPalette } from './components/CommandPalette'
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
  if (appId === 'sheets') return <SheetsApp />
  if (appId === 'writer') return <WriterApp />
  return <PlaceholderApp app={getApp(appId)} />
}

function isEditable(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && (target.isContentEditable || target.matches('input, textarea, select'))
}

export function Shell() {
  const [state, dispatch] = useReducer(shellReducer, initialShellState, () => loadSession())
  const [sessionSaved, setSessionSaved] = useState(true)
  const [commandsOpen, setCommandsOpen] = useState(false)
  useEffect(() => {
    setSessionSaved(saveSession(state))
  }, [state])
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k' && !event.repeat) {
        event.preventDefault()
        setCommandsOpen((open) => !open)
        return
      }
      // Arrow chords keep their text-editing meaning (word selection) inside fields.
      if (isEditable(event.target)) return
      const action = resolveShortcut(event, state)
      if (action) {
        event.preventDefault()
        dispatch(action)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [state])
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
        onOpenCommands={() => setCommandsOpen(true)}
      />
      <main className="desktop" aria-label={`Templo ${temple.name}`}>
        {!sessionSaved && <p className="session-warning" role="status">Não foi possível salvar a sessão neste navegador. As alterações serão perdidas ao recarregar.</p>}
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
            onGeometryChange={(geometry: WindowGeometry) => dispatch({ type: 'window/setGeometry', windowId: w.id, geometry })}
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
      {commandsOpen && <CommandPalette state={state} onCommand={dispatch} onClose={() => setCommandsOpen(false)} />}
    </div>
  )
}
