import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { requestPersistentStorage } from './services/idb';
// Bundled Inter (variable) so the typeface works fully offline (STYLE_GUIDE.md).
import '@fontsource-variable/inter';
import 'react-mosaic-component/react-mosaic-component.css';
import './index.css';

// Ask for durable storage so the saved board survives (esp. on iPad). Fire and
// forget — never block app start on it.
void requestPersistentStorage();

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element #root not found');

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
