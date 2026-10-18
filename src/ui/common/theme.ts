import themes from '@salutejs/plasma-themes/css/plasma_homeds.module.css';

export type Theme = 'auto' | 'light' | 'dark';
export type EffectiveTheme = 'light' | 'dark';

const STORAGE_KEY = 'theme';
const darkQuery = () => window.matchMedia('(prefers-color-scheme: dark)');

export function readStoredTheme(): Theme {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === 'light' || v === 'dark' ? v : 'auto';
  } catch {
    return 'auto';
  }
}

export function storeTheme(theme: Theme): void {
  try {
    if (theme === 'auto') localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Storage may be unavailable (private mode); the theme still applies for this visit.
  }
}

export function resolveTheme(theme: Theme): EffectiveTheme {
  if (theme !== 'auto') return theme;
  return darkQuery().matches ? 'dark' : 'light';
}

function themeClass(name: EffectiveTheme): string {
  const cls = themes[name];
  if (!cls) throw new Error(`Plasma theme class "${name}" is missing in plasma_homeds.module.css`);
  return cls;
}

/** Puts the Plasma theme class (light/dark token set) on <html>. */
export function applyTheme(effective: EffectiveTheme): void {
  const root = document.documentElement;
  root.classList.remove(themeClass('light'), themeClass('dark'));
  root.classList.add(themeClass(effective));
  root.dataset.theme = effective;
  root.style.colorScheme = effective;
}

export function subscribeToSystemTheme(onChange: () => void): () => void {
  const query = darkQuery();
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}
