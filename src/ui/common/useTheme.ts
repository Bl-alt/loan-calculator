import { useEffect, useState } from 'react';
import {
  applyTheme,
  readStoredTheme,
  resolveTheme,
  storeTheme,
  subscribeToSystemTheme,
  type Theme,
} from './theme';

/** 'auto' follows the OS; an explicit choice is remembered between visits. */
export function useTheme(): [Theme, (t: Theme) => void] {
  const [theme, setTheme] = useState<Theme>(readStoredTheme);

  useEffect(() => {
    applyTheme(resolveTheme(theme));
    storeTheme(theme);
    if (theme !== 'auto') return;
    return subscribeToSystemTheme(() => applyTheme(resolveTheme('auto')));
  }, [theme]);

  return [theme, setTheme];
}
