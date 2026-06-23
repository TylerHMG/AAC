import { useState } from 'react';
import { WindowManager } from './components/WindowManager';
import { Toolbar } from './components/Toolbar';
import { Modal } from './components/Modal';
import { MessageBar } from './components/modules/MessageBar';
import { TypePanel } from './components/modules/TypePanel';
import { SettingsPanel } from './components/SettingsPanel';
import { WindowPalette } from './components/WindowPalette';
import { BoardSwitcher } from './components/BoardSwitcher';
import { AboutModal } from './components/AboutModal';
import { MessageBarProvider } from './state/MessageBarContext';
import { BoardProvider, useBoard } from './state/BoardStore';
import { WindowLibraryProvider } from './state/WindowLibraryStore';

function Workspace() {
  const { editMode, hydrated } = useBoard();
  const [typeOpen, setTypeOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  return (
    <div className={`app${editMode ? ' app--editing' : ''}`}>
      <header className="app__header">
        <div className="app__brand">
          <h1 className="app__title">Modular AAC</h1>
          <span className="app__subtitle">{editMode ? 'arrange mode' : 'iteration 3'}</span>
        </div>
        <BoardSwitcher />
      </header>

      {/* Fixed message-bar frame — the shared output buffer. Not a window:
          can't be moved, resized into the tiling, or closed. */}
      <div className="messagebar-strip">
        <MessageBar />
      </div>

      {/* The tiling window workspace beneath the message bar. */}
      <main className="app__main">
        {hydrated ? <WindowManager /> : <div className="mosaic-zero">Loading…</div>}
      </main>

      {/* Controls live at the bottom for easier reach. */}
      <nav className="app__bottombar" aria-label="Board controls">
        <Toolbar
          onOpenType={() => setTypeOpen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenPalette={() => setPaletteOpen(true)}
        />
      </nav>

      <footer className="app__footer">
        <button type="button" className="app__about" onClick={() => setAboutOpen(true)}>
          About
        </button>
        <span>
          Pictograms courtesy of ARASAAC (https://arasaac.org), property of the Government of
          Aragon, created by Sergio Palao, distributed under CC BY-NC-SA.
        </span>
        <span>Everything stays on this device. The optional AI feature sends only the scenario you type.</span>
      </footer>

      {typeOpen && (
        <Modal title="Type" onClose={() => setTypeOpen(false)}>
          <TypePanel onClose={() => setTypeOpen(false)} />
        </Modal>
      )}
      {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} />}
      {paletteOpen && <WindowPalette onClose={() => setPaletteOpen(false)} />}
      {aboutOpen && <AboutModal onClose={() => setAboutOpen(false)} />}
    </div>
  );
}

export default function App() {
  return (
    <BoardProvider>
      <WindowLibraryProvider>
        <MessageBarProvider>
          <Workspace />
        </MessageBarProvider>
      </WindowLibraryProvider>
    </BoardProvider>
  );
}
