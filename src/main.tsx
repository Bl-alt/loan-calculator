import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './ui/App';
import { applyTheme, readStoredTheme, resolveTheme } from './ui/common/theme';
import './styles.css';

// Apply the theme before the first render so dark-mode users don't see a light flash.
applyTheme(resolveTheme(readStoredTheme()));

const root = document.getElementById('root');
if (!root) throw new Error('#root element is missing in index.html');
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
